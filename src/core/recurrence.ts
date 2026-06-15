// ════════════════════════════════════════════════
// src/core/recurrence.ts
// Resumo em linguagem natural + cálculo de ocorrência mensal.
// ════════════════════════════════════════════════

import { Recurrence, Template, DiaSemana } from "./types";

export const DAYNAMES: Record<DiaSemana, string> = {
  MO: "segunda", TU: "terça", WE: "quarta", TH: "quinta",
  FR: "sexta", SA: "sábado", SU: "domingo",
};

export const SETPOS_LABEL: Record<number, string> = {
  1: "primeira", 2: "segunda", 3: "terceira", 4: "quarta", [-1]: "última",
};

/** Unidade textual conforme frequência e quantidade */
function unitLabel(n: number, freq: Recurrence["freq"]): string {
  const singular = { daily: "dia", weekly: "semana", monthly: "mês", yearly: "ano" };
  const plural = { daily: "dias", weekly: "semanas", monthly: "meses", yearly: "anos" };
  return n === 1 ? singular[freq] : plural[freq];
}

/**
 * Resumo em linguagem natural da regra.
 * Ex: "Todo mês, dia 15" / "Toda semana às segundas e sextas, por 10 vezes"
 */
export function recurrenceLabel(r: Recurrence | null): string {
  if (!r) return "Única vez";

  const { freq, interval: iv, byDay, byMonthDay, bySetPos, byDayOfWeek, until } = r;
  let base = "";

  if (freq === "daily") {
    base = iv === 1 ? "Todo dia" : `A cada ${iv} dias`;
  }

  if (freq === "weekly") {
    const dias = (byDay ?? []).map((d) => DAYNAMES[d]);
    const sufixo =
      dias.length === 0 ? ""
      : dias.length === 1 ? ` às ${dias[0]}s`
      : ` às ${dias.slice(0, -1).join(", ")} e ${dias[dias.length - 1]}`;
    base = (iv === 1 ? "Toda semana" : `A cada ${iv} semanas`) + sufixo;
  }

  if (freq === "monthly") {
    const pfx = iv === 1 ? "Todo mês" : `A cada ${iv} meses`;
    if (byMonthDay != null) {
      base = `${pfx}, dia ${byMonthDay}`;
    } else if (bySetPos != null && byDayOfWeek) {
      base = `${pfx}, na ${SETPOS_LABEL[bySetPos]} ${DAYNAMES[byDayOfWeek]}`;
    } else {
      base = pfx;
    }
  }

  if (freq === "yearly") {
    base = iv === 1 ? "Todo ano" : `A cada ${iv} anos`;
  }

  if (!until || until.type === "never") return base;
  if (until.type === "date") return `${base}, até ${until.date || "…"}`;
  if (until.type === "count") {
    return `${base}, por ${until.count} vez${until.count === 1 ? "" : "es"}`;
  }
  return base;
}

/**
 * O template ocorre no mês (y, m)?
 *
 * Para o protótipo, daily/weekly são aproximados como "aparece todo mês".
 * monthly/yearly respeitam o intervalo a partir de startMonthKey.
 *
 * NOTA: quando você quiser precisão real para daily/weekly (datas exatas
 * no calendário), este é o ponto a evoluir — gerando ocorrências com uma
 * lib RRULE (ex: `rrule`) e filtrando pelo mês.
 */
export function occursInMonth(tpl: Template, y: number, m: number): boolean {
  const monthKey = `${y}-${String(m).padStart(2, "0")}`;

  if (!tpl.recurrence) {
    return monthKey === tpl.startMonthKey;
  }

  const { freq, interval: iv } = tpl.recurrence;
  const [sy, sm] = tpl.startMonthKey.split("-").map(Number);
  const diff = (y - sy) * 12 + (m - sm);

  if (diff < 0) return false;
  if (freq === "monthly") return diff % iv === 0;
  if (freq === "yearly") return diff % (iv * 12) === 0;

  // daily / weekly → presente em todo mês (aproximação do protótipo)
  return true;
}

/** Regra mensal padrão num dia fixo (helper para criar templates) */
export const monthlyRule = (day: number): Recurrence => ({
  freq: "monthly",
  interval: 1,
  byDay: [],
  byMonthDay: day,
  bySetPos: null,
  byDayOfWeek: null,
  until: { type: "never" },
  exceptions: [],
  additions: [],
});

/** Regra padrão genérica (usada como ponto de partida em formulários) */
export const DEFAULT_RULE: Recurrence = monthlyRule(1);