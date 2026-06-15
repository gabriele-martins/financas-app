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
  ReceitaResolvida,
} from "../core/types";
import {
  resolveDespesas, resolveReceitas, calcTotais, redistribuir, Totais,
} from "../core/finance";
import {
  CUR_YEAR, CUR_MONTH, CUR_MONTH_KEY, mKey, addMonths, isMonthBefore,
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

  despesas: DespesaResolvida[];
  receitas: ReceitaResolvida[];
  templates: Template[];
  totais: Totais;

  criarTemplate: (t: Omit<Template, "id">) => Promise<void>;
  editarTemplate: (t: Template) => Promise<void>;
  excluirTemplate: (id: number) => Promise<void>;

  editarDistribuicao: (templateId: number, lado: "distA" | "distS", valor: number) => Promise<void>;
  alternarPago: (templateId: number, campo: "pagoA" | "pagoS") => Promise<void>;
  editarValorReal: (templateId: number, valor: number) => Promise<void>;

  reload: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<InstanceStore>({});
  const [viewY, setViewY] = useState(CUR_YEAR);
  const [viewM, setViewM] = useState(CUR_MONTH);

  const monthKey = mKey(viewY, viewM);
  const isPast = isMonthBefore(monthKey, CUR_MONTH_KEY);

  // ── Carga / recarga do banco ──
  const carregar = useCallback(async () => {
    const [tpls, insts] = await Promise.all([
      repo.getAllTemplates(),
      repo.getAllInstances(),
    ]);
    setTemplates(tpls);
    setInstances(insts);
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
    const id = await repo.insertTemplate(t);
    setTemplates((prev) => [...prev, { ...t, id }]);
  }, []);

  const editarTemplate = useCallback(async (t: Template) => {
    await repo.updateTemplate(t);
    await repo.clearFutureInstances(t.id, monthKey);
    setTemplates((prev) => prev.map((x) => (x.id === t.id ? t : x)));
    setInstances((prev) => {
      const next: InstanceStore = {};
      for (const mk of Object.keys(prev)) {
        if (!isMonthBefore(mk, monthKey)) {
          const { [t.id]: _drop, ...rest } = prev[mk];
          next[mk] = rest;
        } else {
          next[mk] = prev[mk];
        }
      }
      return next;
    });
  }, [monthKey]);

  const excluirTemplate = useCallback(async (id: number) => {
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
  }, []);

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

  const alternarPago = useCallback(
    async (templateId: number, campo: "pagoA" | "pagoS") => {
      if (isPast) return;
      const d = despesas.find((x) => x.id === templateId);
      if (!d) return;
      await applyOverride(templateId, { [campo]: !d[campo] });
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

  const value: StoreValue = {
    loading,
    viewY, viewM, monthKey, isPast, goMonth,
    templates,
    despesas, receitas, totais,
    criarTemplate, editarTemplate, excluirTemplate,
    editarDistribuicao, alternarPago, editarValorReal,
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