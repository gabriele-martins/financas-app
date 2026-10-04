// ════════════════════════════════════════════════
// src/core/types.ts
// Tipos centrais do domínio. Sem dependência de UI ou banco.
// ════════════════════════════════════════════════

/** Período quinzenal: A = Adiantamento (dia 15), S = Salário (dia 30) */
export type Periodo = "A" | "S";

/** Tipo de lançamento */
export type Tipo = "despesa" | "receita";

// ── Recorrência (modelo RRULE-like) ──

export type Frequencia = "daily" | "weekly" | "monthly" | "yearly";

/** Dia da semana no padrão RRULE (2 letras em inglês) */
export type DiaSemana = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

/** Condição de término da recorrência */
export type Termino =
  | { type: "never" }
  | { type: "date"; date: string }   // ISO: "2026-12-31"
  | { type: "count"; count: number };

/**
 * Regra de recorrência.
 * `null` em um template significa "única vez" (sem recorrência).
 */
export interface Recurrence {
  freq: Frequencia;
  interval: number;              // a cada N (dias/semanas/meses/anos)
  byDay: DiaSemana[];            // usado em freq weekly
  byMonthDay: number | null;     // ex: 15 → todo dia 15
  bySetPos: number | null;       // -1=último, 1=primeiro… (freq monthly por posição)
  byDayOfWeek: DiaSemana | null; // "FR" em "última sexta"
  until: Termino;
  exceptions: string[];          // datas ISO ignoradas (scaffold p/ futuro)
  additions: string[];           // datas ISO extras    (scaffold p/ futuro)
}

// ── Template (a regra recorrente) ──

export interface Template {
  id: number;
  tipo: Tipo;
  nome: string;
  icone: string;                 // nome do ícone (ex: "home", "cash")
  valor: number;
  dia: number;                   // dia do vencimento/recebimento (1–31)
  /** mês a partir do qual o template passa a valer: "2026-06" */
  startMonthKey: string;
  /**
   * Último mês em que o template vale (inclusive): "2026-11".
   * Ausente = vale indefinidamente. Usado para "encerrar" um template sem
   * apagá-lo, preservando o histórico dos meses passados — é o que sustenta
   * a edição versionada e a exclusão por corte.
   */
  endMonthKey?: string;
  recurrence: Recurrence | null;

  // Só para receitas:
  periodo?: Periodo;

  // Só para despesas (distribuição padrão do template):
  distA?: number;
  distS?: number;
  /** Só para despesas: false = variável (valor pode ser ajustado por mês na Distribuição). Default true. */
  fixo?: boolean;
  /**
   * Posição manual nas listas. Menor vem primeiro; empate cai no dia de
   * vencimento. Definida ao reordenar ou ao ordenar alfabeticamente.
   */
  ordem?: number;
}

// ── Instância (override de um template em um mês específico) ──

/**
 * Armazena APENAS os campos que diferem do template naquele mês.
 * Tudo que não estiver aqui é derivado do template.
 */
export interface InstanceOverride {
  valor?: number;
  valorReal?: number;   // valor efetivamente recebido (tela Realizado)
  distA?: number;
  distS?: number;
  pagoA?: boolean;
  pagoS?: boolean;
  /** dinheiro separado, conta ainda não paga (ver StatusPag) */
  guardadoA?: boolean;
  guardadoS?: boolean;
}

/**
 * Status de uma despesa num período, no ciclo pendente → guardado → pago.
 *
 * Guardado e pago contam igual nos totais (ambos são dinheiro já comprometido);
 * a diferença é só se o boleto já foi quitado. Derivado dos booleanos acima —
 * `pago` vence sobre `guardado` se ambos estiverem marcados.
 */
export type StatusPag = "pendente" | "guardado" | "pago";

/** instances[monthKey][templateId] = override */
export type InstanceStore = Record<string, Record<number, InstanceOverride>>;

// ── Tipos "resolvidos" (template + override aplicado), usados pela UI ──

export interface DespesaResolvida extends Template {
  valor: number;
  distA: number;
  distS: number;
  pagoA: boolean;
  pagoS: boolean;
  guardadoA: boolean;
  guardadoS: boolean;
  /** derivados dos booleanos acima — é o que a UI usa */
  statusA: StatusPag;
  statusS: StatusPag;
  fixo: boolean;
}

export interface ReceitaResolvida extends Template {
  valor: number;
  valorReal: number;
  periodo: Periodo;
}

// ── Tema ──

export type ThemeMode = "light" | "dark";