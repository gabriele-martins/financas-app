// ════════════════════════════════════════════════
// src/state/store.tsx
// Estado global via Context. Carrega o banco ao iniciar,
// mantém o mês visível e orquestra repositórios + recálculo.
// ════════════════════════════════════════════════

import React, {
  createContext, useContext, useEffect, useState, useMemo, useCallback,
} from "react";
import {
  Template, InstanceStore, InstanceOverride, DespesaResolvida,
  ReceitaResolvida, StatusPag,
} from "../core/types";
import {
  resolveDespesas, resolveReceitas, calcTotais, redistribuir, Totais,
} from "../core/finance";
import {
  CUR_YEAR, CUR_MONTH, mKey, addMonths, isMonthBefore,
  prevMonthKey, isReadOnlyMonth, CARENCIA_PADRAO,
} from "../core/date";
import * as repo from "../db/repositories";

// ── Shape do contexto ──

interface StoreValue {
  loading: boolean;

  viewY: number;
  viewM: number;
  monthKey: string;
  isPast: boolean;
  goMonth: (delta: number) => void;

  /** dias do mês atual em que o mês anterior segue editável */
  carenciaDias: number;
  setCarenciaDias: (dias: number) => Promise<void>;
  /** true quando o mês visível só está editável por causa da carência */
  emCarencia: boolean;

  despesas: DespesaResolvida[];
  receitas: ReceitaResolvida[];
  templates: Template[];
  totais: Totais;

  criarTemplate: (t: Omit<Template, "id">) => Promise<void>;
  editarTemplate: (t: Template) => Promise<void>;
  excluirTemplate: (id: number) => Promise<void>;

  editarDistribuicao: (templateId: number, lado: "distA" | "distS", valor: number) => Promise<void>;
  /** avança pendente → guardado → pago → pendente no período indicado */
  alternarPago: (templateId: number, lado: "A" | "S") => Promise<void>;
  editarValorReal: (templateId: number, valor: number) => Promise<void>;
  editarValorDespesa: (templateId: number, valor: number) => Promise<void>;

  /** move uma despesa uma posição para cima/baixo na ordem manual */
  moverDespesa: (templateId: number, delta: -1 | 1) => Promise<void>;
  /** grava a ordem final das despesas (usado pelo arrastar) */
  reordenarDespesas: (idsNaOrdem: number[]) => Promise<void>;
  /** reordena as despesas alfabeticamente por nome */
  ordenarDespesasAZ: () => Promise<void>;

  reload: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<InstanceStore>({});
  const [viewY, setViewY] = useState(CUR_YEAR);
  const [viewM, setViewM] = useState(CUR_MONTH);
  const [carenciaDias, setCarencia] = useState(CARENCIA_PADRAO);

  const monthKey = mKey(viewY, viewM);
  const isPast = isReadOnlyMonth(monthKey, carenciaDias);
  // mês já passado, mas ainda editável pela janela de carência
  const emCarencia = isMonthBefore(monthKey, mKey(CUR_YEAR, CUR_MONTH)) && !isPast;

  // ── Carga / recarga do banco ──
  const carregar = useCallback(async () => {
    const [tpls, insts, carencia] = await Promise.all([
      repo.getAllTemplates(),
      repo.getAllInstances(),
      repo.getSetting("carenciaDias"),
    ]);
    setTemplates(tpls);
    setInstances(insts);
    const n = carencia != null ? parseInt(carencia, 10) : NaN;
    setCarencia(isNaN(n) ? CARENCIA_PADRAO : Math.max(0, Math.min(28, n)));
  }, []);

  const setCarenciaDias = useCallback(async (dias: number) => {
    const v = Math.max(0, Math.min(28, Math.round(dias)));
    await repo.setSetting("carenciaDias", String(v));
    setCarencia(v);
  }, []);

  useEffect(() => {
    carregar().then(() => setLoading(false));
  }, [carregar]);

  // ── Navegação de mês ──
  const goMonth = useCallback((delta: number) => {
    setViewY((y) => {
      const { y: ny, m: nm } = addMonths(y, viewM, delta);
      setViewM(nm);
      return ny;
    });
  }, [viewM]);

  // ── Dados resolvidos do mês visível ──
  const despesas = useMemo(
    () => resolveDespesas(templates, instances, viewY, viewM),
    [templates, instances, viewY, viewM]
  );
  const receitas = useMemo(
    () => resolveReceitas(templates, instances, viewY, viewM),
    [templates, instances, viewY, viewM]
  );
  const totais = useMemo(
    () => calcTotais(despesas, receitas),
    [despesas, receitas]
  );

  // ── Helper: aplica override no banco E no estado local ──
  const applyOverride = useCallback(
    async (templateId: number, patch: InstanceOverride) => {
      await repo.upsertInstance(monthKey, templateId, patch);
      setInstances((prev) => ({
        ...prev,
        [monthKey]: {
          ...prev[monthKey],
          [templateId]: { ...(prev[monthKey]?.[templateId] ?? {}), ...patch },
        },
      }));
    },
    [monthKey]
  );

  // ── Ações de template ──

  const criarTemplate = useCallback(async (t: Omit<Template, "id">) => {
    // entra no fim da lista do seu tipo, para não embaralhar a ordem manual
    const ordem =
      t.ordem ??
      templates.reduce((max, x) => (x.tipo === t.tipo ? Math.max(max, x.ordem ?? 0) : max), 0) + 1;
    const comOrdem = { ...t, ordem };
    const id = await repo.insertTemplate(comOrdem);
    setTemplates((prev) => [...prev, { ...comOrdem, id }]);
  }, [templates]);

  /** Remove, no estado local, os overrides de um template do mês visível em diante */
  const dropInstancesFrom = useCallback((id: number) => {
    setInstances((prev) => {
      const next: InstanceStore = {};
      for (const mk of Object.keys(prev)) {
        if (isMonthBefore(mk, monthKey)) {
          next[mk] = prev[mk];
        } else {
          const { [id]: _drop, ...rest } = prev[mk];
          next[mk] = rest;
        }
      }
      return next;
    });
  }, [monthKey]);

  /**
   * Edita um template preservando o histórico.
   *
   * Se o template já valeu em meses anteriores ao visível, não dá para mutá-lo:
   * os meses passados derivam do template, então um UPDATE reescreveria o
   * histórico. Nesse caso fazemos um "split de versão" — encerramos o template
   * antigo no mês anterior (que continua resolvendo o passado) e criamos um novo
   * a partir do mês visível com os dados editados.
   *
   * Quando não há passado (template nasceu no mês visível, ou é de única vez),
   * um UPDATE direto é suficiente e mantém o mesmo id.
   */
  const editarTemplate = useCallback(async (t: Template) => {
    if (isPast) return;   // passado é imutável
    const antigo = templates.find((x) => x.id === t.id);
    const temPassado =
      !!antigo && !!antigo.recurrence && isMonthBefore(antigo.startMonthKey, monthKey);

    if (!temPassado) {
      await repo.updateTemplate(t);
      await repo.clearFutureInstances(t.id, monthKey);
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      dropInstancesFrom(t.id);
      return;
    }

    const corte = prevMonthKey(monthKey);
    const { id: _oldId, ...dados } = t;

    await repo.endTemplate(t.id, corte);
    await repo.clearFutureInstances(t.id, monthKey);
    const novoId = await repo.insertTemplate({
      ...dados,
      startMonthKey: monthKey,
      endMonthKey: undefined,
    });

    setTemplates((prev) => [
      ...prev.map((x) => (x.id === t.id ? { ...x, endMonthKey: corte } : x)),
      { ...dados, startMonthKey: monthKey, endMonthKey: undefined, id: novoId },
    ]);
    dropInstancesFrom(t.id);
  }, [isPast, templates, monthKey, dropInstancesFrom]);

  /**
   * Exclui um template preservando o histórico.
   *
   * Se houve meses anteriores ao visível, só encerramos o template no mês
   * anterior: ele desaparece do mês visível em diante e segue intacto no
   * passado. Sem passado, é um DELETE de verdade (nada a preservar).
   */
  const excluirTemplate = useCallback(async (id: number) => {
    if (isPast) return;   // passado é imutável
    const tpl = templates.find((x) => x.id === id);
    const temPassado =
      !!tpl && !!tpl.recurrence && isMonthBefore(tpl.startMonthKey, monthKey);

    if (!temPassado) {
      await repo.deleteTemplate(id);
      setTemplates((prev) => prev.filter((x) => x.id !== id));
      setInstances((prev) => {
        const next: InstanceStore = {};
        for (const mk of Object.keys(prev)) {
          const { [id]: _drop, ...rest } = prev[mk];
          next[mk] = rest;
        }
        return next;
      });
      return;
    }

    const corte = prevMonthKey(monthKey);
    await repo.endTemplate(id, corte);
    await repo.clearFutureInstances(id, monthKey);
    setTemplates((prev) =>
      prev.map((x) => (x.id === id ? { ...x, endMonthKey: corte } : x))
    );
    dropInstancesFrom(id);
  }, [isPast, templates, monthKey, dropInstancesFrom]);

  // ── Ações de instância ──

  const editarDistribuicao = useCallback(
    async (templateId: number, lado: "distA" | "distS", valor: number) => {
      if (isPast) return;
      const d = despesas.find((x) => x.id === templateId);
      if (!d) return;
      const novo = redistribuir(d.valor, lado, valor);
      await applyOverride(templateId, novo);
    },
    [isPast, despesas, applyOverride]
  );

  /**
   * Avança o status de um período da despesa no ciclo
   * pendente → guardado → pago → pendente.
   */
  const alternarPago = useCallback(
    async (templateId: number, lado: "A" | "S") => {
      if (isPast) return;
      const d = despesas.find((x) => x.id === templateId);
      if (!d) return;

      const atual = lado === "A" ? d.statusA : d.statusS;
      const proximo: StatusPag =
        atual === "pendente" ? "guardado" : atual === "guardado" ? "pago" : "pendente";

      await applyOverride(templateId, {
        [`pago${lado}`]: proximo === "pago",
        [`guardado${lado}`]: proximo === "guardado",
      });
    },
    [isPast, despesas, applyOverride]
  );

  const editarValorReal = useCallback(
    async (templateId: number, valor: number) => {
      if (isPast) return;
      await applyOverride(templateId, { valorReal: valor });
    },
    [isPast, applyOverride]
  );

  const editarValorDespesa = useCallback(
    async (templateId: number, novoValor: number) => {
      if (isPast) return;
      const d = despesas.find((x) => x.id === templateId);
      if (!d) return;
      const ratio = d.valor > 0 ? d.distA / d.valor : 0;
      const novoA = +(novoValor * ratio).toFixed(2);
      const novoS = +(novoValor - novoA).toFixed(2);
      await applyOverride(templateId, { valor: novoValor, distA: novoA, distS: novoS });
    },
    [isPast, despesas, applyOverride]
  );

  // ── Ordenação manual ──

  /**
   * Persiste uma nova ordem de despesas e reflete no estado local.
   * A posição é gravada no template (vale para todas as telas e meses).
   */
  const aplicarOrdem = useCallback(async (idsNaOrdem: number[]) => {
    const pares = idsNaOrdem.map((id, i) => ({ id, ordem: i + 1 }));
    await repo.updateOrdem(pares);

    const porId = new Map(pares.map((p) => [p.id, p.ordem]));
    setTemplates((prev) => {
      const next = prev.map((t) =>
        porId.has(t.id) ? { ...t, ordem: porId.get(t.id)! } : t
      );
      // mesma regra do SELECT: tipo, ordem, dia
      return next.sort((a, b) =>
        a.tipo !== b.tipo
          ? a.tipo.localeCompare(b.tipo)
          : (a.ordem ?? 0) - (b.ordem ?? 0) || a.dia - b.dia
      );
    });
  }, []);

  const moverDespesa = useCallback(
    async (templateId: number, delta: -1 | 1) => {
      const ids = despesas.map((d) => d.id);
      const i = ids.indexOf(templateId);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await aplicarOrdem(ids);
    },
    [despesas, aplicarOrdem]
  );

  const ordenarDespesasAZ = useCallback(async () => {
    const ids = [...despesas]
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
      .map((d) => d.id);
    await aplicarOrdem(ids);
  }, [despesas, aplicarOrdem]);

  const value: StoreValue = {
    loading,
    viewY, viewM, monthKey, isPast, goMonth,
    carenciaDias, setCarenciaDias, emCarencia,
    templates,
    despesas, receitas, totais,
    criarTemplate, editarTemplate, excluirTemplate,
    editarDistribuicao, alternarPago, editarValorReal, editarValorDespesa,
    moverDespesa, reordenarDespesas: aplicarOrdem, ordenarDespesasAZ,
    reload: carregar,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Hook de acesso ao estado global */
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}