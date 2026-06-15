// ════════════════════════════════════════════════
// src/core/date.ts
// Helpers de data. Funções puras, fáceis de testar.
// ════════════════════════════════════════════════

import { Periodo } from "./types";

/** Zero-pad: 5 → "05" */
export const pad = (n: number): string => String(n).padStart(2, "0");

/** Chave de mês: (2026, 6) → "2026-06" */
export const mKey = (y: number, m: number): string => `${y}-${pad(m)}`;

/** Data ISO a partir de ano/mês/dia: (2026, 6, 10) → "2026-06-10" */
export const isoDate = (y: number, m: number, d: number): string =>
  `${y}-${pad(m)}-${pad(d)}`;

/** Avança/retrocede meses com transbordo de ano */
export function addMonths(
  y: number,
  m: number,
  delta: number
): { y: number; m: number } {
  let nm = m + delta;
  let ny = y;
  while (nm > 12) { nm -= 12; ny++; }
  while (nm < 1) { nm += 12; ny--; }
  return { y: ny, m: nm };
}

/** Período quinzenal a partir do dia: 1–15 → A, 16–31 → S */
export const periodoByDay = (dia: number): Periodo => (dia <= 15 ? "A" : "S");

/** Extrai o dia (1–31) de uma data ISO "2026-06-10" → 10 */
export const dayFromIso = (iso: string): number =>
  parseInt(iso.split("-")[2], 10);

/** Compara duas monthKeys cronologicamente. "2026-05" < "2026-06" */
export const isMonthBefore = (a: string, b: string): boolean => a < b;

/** Nomes dos meses em pt-BR (índice 0 = Janeiro) */
export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

/** Mês/ano atuais (úteis como defaults) */
export const now = new Date();
export const CUR_YEAR = now.getFullYear();
export const CUR_MONTH = now.getMonth() + 1;
export const CUR_MONTH_KEY = mKey(CUR_YEAR, CUR_MONTH);