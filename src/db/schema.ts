// ════════════════════════════════════════════════
// src/db/schema.ts
// DDL das tabelas. A regra de recorrência é serializada como JSON
// numa coluna TEXT — flexível e fácil de evoluir.
// ════════════════════════════════════════════════

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
-- Templates: a regra recorrente (despesa ou receita)
CREATE TABLE IF NOT EXISTS templates (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo            TEXT    NOT NULL CHECK (tipo IN ('despesa','receita')),
  nome            TEXT    NOT NULL,
  icone           TEXT    NOT NULL DEFAULT 'cash',
  valor           REAL    NOT NULL DEFAULT 0,
  dia             INTEGER NOT NULL DEFAULT 1,
  start_month_key TEXT    NOT NULL,            -- "2026-06"
  recurrence      TEXT,                        -- JSON da Recurrence ou NULL (única vez)
  periodo         TEXT    CHECK (periodo IN ('A','S')),  -- só receita
  dist_a          REAL,                        -- só despesa
  dist_s          REAL,                        -- só despesa
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Instâncias: overrides de um template em um mês específico.
-- Guarda só o que difere do template (esparso).
CREATE TABLE IF NOT EXISTS instances (
  month_key   TEXT    NOT NULL,                -- "2026-06"
  template_id INTEGER NOT NULL,
  valor       REAL,
  valor_real  REAL,
  dist_a      REAL,
  dist_s      REAL,
  pago_a      INTEGER,                         -- 0/1 (SQLite não tem boolean)
  pago_s      INTEGER,                         -- 0/1
  PRIMARY KEY (month_key, template_id),
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Configurações simples (tema, etc.)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_instances_month ON instances(month_key);
CREATE INDEX IF NOT EXISTS idx_templates_tipo  ON templates(tipo);
`;

// Seed inicial (equivalente aos dados do protótipo).
// Inserido apenas na primeira execução, quando a tabela está vazia.
export const SEED = (startMonthKey: string) => {
  const m = (day: number) =>
    JSON.stringify({
      freq: "monthly", interval: 1, byDay: [], byMonthDay: day,
      bySetPos: null, byDayOfWeek: null, until: { type: "never" },
      exceptions: [], additions: [],
    });

  return [
    // Receitas
    { tipo: "receita", nome: "Adiantamento", icone: "cash", valor: 1767.52, dia: 15, periodo: "A", dist_a: null, dist_s: null, recurrence: m(15) },
    { tipo: "receita", nome: "Salário",      icone: "cash", valor: 2217.12, dia: 30, periodo: "S", dist_a: null, dist_s: null, recurrence: m(30) },
    // Despesas
    { tipo: "despesa", nome: "Aluguel",  icone: "home",    valor: 1100,  dia: 10, periodo: null, dist_a: 700, dist_s: 400,   recurrence: m(10) },
    { tipo: "despesa", nome: "Vivo",     icone: "phone2",  valor: 120,   dia: 18, periodo: null, dist_a: 120, dist_s: 0,     recurrence: m(18) },
    { tipo: "despesa", nome: "Unimed",   icone: "health",  valor: 380,   dia: 5,  periodo: null, dist_a: 0,   dist_s: 380,   recurrence: m(5) },
    { tipo: "despesa", nome: "SmartFit", icone: "fitness", valor: 119.9, dia: 7,  periodo: null, dist_a: 0,   dist_s: 119.9, recurrence: m(7) },
    { tipo: "despesa", nome: "Luz",      icone: "bulb",    valor: 180,   dia: 20, periodo: null, dist_a: 60,  dist_s: 120,   recurrence: m(20) },
    { tipo: "despesa", nome: "HBO",      icone: "movie",   valor: 34.9,  dia: 12, periodo: null, dist_a: 0,   dist_s: 34.9,  recurrence: m(12) },
  ].map((r) => ({ ...r, start_month_key: startMonthKey }));
};