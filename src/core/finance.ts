// ════════════════════════════════════════════════
// src/core/finance.ts
// Resolução template→instância e cálculos de saldo.
// Núcleo das regras financeiras do app.
// ════════════════════════════════════════════════

import {
  Template, InstanceStore, InstanceOverride,
  DespesaResolvida, ReceitaResolvida, Periodo,
} from "./types";
import { occursInMonth } from "./recurrence";

/** Lê um campo do override da instância, com fallback para o valor do template */
function instValue<K extends keyof InstanceOverride>(
  instances: InstanceStore,
  monthKey: string,
  templateId: number,
  field: K,
  fallback: NonNullable<InstanceOverride[K]>
): NonNullable<InstanceOverride[K]> {
  const v = instances[monthKey]?.[templateId]?.[field];
  return (v ?? fallback) as NonNullable<InstanceOverride[K]>;
}

/**
 * Resolve as despesas visíveis em um mês, aplicando os overrides da instância
 * sobre os valores do template.
 */
export function resolveDespesas(
  templates: Template[],
  instances: InstanceStore,
  y: number,
  m: number
): DespesaResolvida[] {
  const monthKey = `${y}-${String(m).padStart(2, "0")}`;
  return templates
    .filter((t) => t.tipo === "despesa" && occursInMonth(t, y, m))
    .map((t) => ({
      ...t,
      valor: instValue(instances, monthKey, t.id, "valor", t.valor),
      distA: instValue(instances, monthKey, t.id, "distA", t.distA ?? 0),
      distS: instValue(instances, monthKey, t.id, "distS", t.distS ?? 0),
      pagoA: instValue(instances, monthKey, t.id, "pagoA", false),
      pagoS: instValue(instances, monthKey, t.id, "pagoS", false),
    }));
}

/**
 * Resolve as receitas visíveis em um mês.
 * `valorReal` (tela Realizado) tem fallback para o `valor` previsto.
 */
export function resolveReceitas(
  templates: Template[],
  instances: InstanceStore,
  y: number,
  m: number
): ReceitaResolvida[] {
  const monthKey = `${y}-${String(m).padStart(2, "0")}`;
  return templates
    .filter((t) => t.tipo === "receita" && occursInMonth(t, y, m))
    .map((t) => {
      const valor = instValue(instances, monthKey, t.id, "valor", t.valor);
      return {
        ...t,
        valor,
        valorReal: instValue(instances, monthKey, t.id, "valorReal", valor),
        periodo: (t.periodo ?? "A") as Periodo,
      };
    });
}

// ── Totais por período ──

export interface Totais {
  // despesas distribuídas
  totalDespA: number;
  totalDespS: number;
  // já pago (reservado)
  pagoA: number;
  pagoS: number;
  // pendente
  pendA: number;
  pendS: number;
  // receitas previstas
  receitaPrevA: number;
  receitaPrevS: number;
  // receitas reais
  receitaRealA: number;
  receitaRealS: number;
  // saldos previstos (receita prevista − despesas)
  saldoPrevA: number;
  saldoPrevS: number;
  // saldos reais (receita real − despesas)
  saldoRealA: number;
  saldoRealS: number;
}

const somaSe = <T>(arr: T[], pred: (x: T) => boolean, val: (x: T) => number) =>
  arr.filter(pred).reduce((s, x) => s + val(x), 0);

/** Calcula todos os totais e saldos de um mês resolvido */
export function calcTotais(
  despesas: DespesaResolvida[],
  receitas: ReceitaResolvida[]
): Totais {
  const totalDespA = despesas.reduce((s, d) => s + d.distA, 0);
  const totalDespS = despesas.reduce((s, d) => s + d.distS, 0);

  const pagoA = somaSe(despesas, (d) => d.pagoA, (d) => d.distA);
  const pagoS = somaSe(despesas, (d) => d.pagoS, (d) => d.distS);

  const receitaPrevA = somaSe(receitas, (r) => r.periodo === "A", (r) => r.valor);
  const receitaPrevS = somaSe(receitas, (r) => r.periodo === "S", (r) => r.valor);
  const receitaRealA = somaSe(receitas, (r) => r.periodo === "A", (r) => r.valorReal);
  const receitaRealS = somaSe(receitas, (r) => r.periodo === "S", (r) => r.valorReal);

  return {
    totalDespA, totalDespS,
    pagoA, pagoS,
    pendA: totalDespA - pagoA,
    pendS: totalDespS - pagoS,
    receitaPrevA, receitaPrevS,
    receitaRealA, receitaRealS,
    saldoPrevA: receitaPrevA - totalDespA,
    saldoPrevS: receitaPrevS - totalDespS,
    saldoRealA: receitaRealA - totalDespA,
    saldoRealS: receitaRealS - totalDespS,
  };
}

/**
 * Redistribui uma despesa entre os períodos mantendo a soma = total.
 * Editar um lado recalcula o outro. Retorna o override a ser persistido.
 */
export function redistribuir(
  total: number,
  lado: "distA" | "distS",
  novoValor: number
): { distA: number; distS: number } {
  const v = Math.max(0, Math.min(novoValor, total));
  const outro = +(total - v).toFixed(2);
  return lado === "distA" ? { distA: v, distS: outro } : { distA: outro, distS: v };
}

/** Formata número como moeda BRL */
export const formatBRL = (v: number): string =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Converte string digitada ("1.234,56") em número */
export function parseBRL(s: string): number {
  const n = parseFloat(String(s).replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}