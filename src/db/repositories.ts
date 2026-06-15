// ════════════════════════════════════════════════
// src/db/repositories.ts
// CRUD de templates e instâncias. Traduz linhas do banco
// (snake_case) para os tipos do domínio (camelCase).
// ════════════════════════════════════════════════

import { getDb } from "./database";
import {
  Template, InstanceOverride, InstanceStore, Recurrence, Tipo, Periodo,
} from "../core/types";

// ── Tipos das linhas cruas do SQLite ──

interface TemplateRow {
  id: number;
  tipo: string;
  nome: string;
  icone: string;
  valor: number;
  dia: number;
  start_month_key: string;
  recurrence: string | null;
  periodo: string | null;
  dist_a: number | null;
  dist_s: number | null;
}

interface InstanceRow {
  month_key: string;
  template_id: number;
  valor: number | null;
  valor_real: number | null;
  dist_a: number | null;
  dist_s: number | null;
  pago_a: number | null;
  pago_s: number | null;
}

// ── Mapeamento linha → domínio ──

function rowToTemplate(r: TemplateRow): Template {
  return {
    id: r.id,
    tipo: r.tipo as Tipo,
    nome: r.nome,
    icone: r.icone,
    valor: r.valor,
    dia: r.dia,
    startMonthKey: r.start_month_key,
    recurrence: r.recurrence ? (JSON.parse(r.recurrence) as Recurrence) : null,
    periodo: (r.periodo as Periodo) ?? undefined,
    distA: r.dist_a ?? undefined,
    distS: r.dist_s ?? undefined,
  };
}

function rowToOverride(r: InstanceRow): InstanceOverride {
  const o: InstanceOverride = {};
  if (r.valor != null) o.valor = r.valor;
  if (r.valor_real != null) o.valorReal = r.valor_real;
  if (r.dist_a != null) o.distA = r.dist_a;
  if (r.dist_s != null) o.distS = r.dist_s;
  if (r.pago_a != null) o.pagoA = r.pago_a === 1;
  if (r.pago_s != null) o.pagoS = r.pago_s === 1;
  return o;
}

// ════════════════════════════════════════════════
// TEMPLATES
// ════════════════════════════════════════════════

export async function getAllTemplates(): Promise<Template[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TemplateRow>(
    "SELECT * FROM templates ORDER BY tipo, dia"
  );
  return rows.map(rowToTemplate);
}

export async function insertTemplate(t: Omit<Template, "id">): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO templates
       (tipo, nome, icone, valor, dia, start_month_key, recurrence, periodo, dist_a, dist_s)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      t.tipo ?? "despesa",
      t.nome ?? "",
      t.icone ?? "cash",
      t.valor ?? 0,
      t.dia ?? 1,
      t.startMonthKey ?? "",
      t.recurrence ? JSON.stringify(t.recurrence) : null,
      t.periodo ?? null,
      t.distA ?? null,
      t.distS ?? null,
    ]
  );
  return res.lastInsertRowId;
}

export async function updateTemplate(t: Template): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE templates SET
       tipo = ?, nome = ?, icone = ?, valor = ?, dia = ?,
       start_month_key = ?, recurrence = ?, periodo = ?, dist_a = ?, dist_s = ?
     WHERE id = ?`,
    [
      t.tipo ?? "despesa",
      t.nome ?? "",
      t.icone ?? "cash",
      t.valor ?? 0,
      t.dia ?? 1,
      t.startMonthKey ?? "",
      t.recurrence ? JSON.stringify(t.recurrence) : null,
      t.periodo ?? null,
      t.distA ?? null,
      t.distS ?? null,
      t.id,
    ]
  );
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDb();
  // ON DELETE CASCADE remove as instâncias relacionadas automaticamente
  await db.runAsync("DELETE FROM templates WHERE id = ?", [id]);
}

// ════════════════════════════════════════════════
// INSTÂNCIAS (overrides)
// ════════════════════════════════════════════════

/** Carrega todos os overrides como InstanceStore (usado ao iniciar o app) */
export async function getAllInstances(): Promise<InstanceStore> {
  const db = await getDb();
  const rows = await db.getAllAsync<InstanceRow>("SELECT * FROM instances");
  const store: InstanceStore = {};
  for (const r of rows) {
    if (!store[r.month_key]) store[r.month_key] = {};
    store[r.month_key][r.template_id] = rowToOverride(r);
  }
  return store;
}

/**
 * Aplica (upsert) um override parcial para um template num mês.
 * Faz merge com o que já existe — só sobrescreve os campos informados.
 */
export async function upsertInstance(
  monthKey: string,
  templateId: number,
  patch: InstanceOverride
): Promise<void> {
  const db = await getDb();

  const cur = await db.getFirstAsync<InstanceRow>(
    "SELECT * FROM instances WHERE month_key = ? AND template_id = ?",
    [monthKey, templateId]
  );

  const merged: InstanceOverride = cur ? rowToOverride(cur) : {};
  Object.assign(merged, patch);

  const b = (v: boolean | undefined) => (v == null ? null : v ? 1 : 0);

  await db.runAsync(
    `INSERT OR REPLACE INTO instances
       (month_key, template_id, valor, valor_real, dist_a, dist_s, pago_a, pago_s)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      monthKey,
      templateId,
      merged.valor ?? null,
      merged.valorReal ?? null,
      merged.distA ?? null,
      merged.distS ?? null,
      b(merged.pagoA),
      b(merged.pagoS),
    ]
  );
}

/**
 * Remove overrides de um template do mês atual em diante.
 * Usado quando se edita um template recorrente: o passado é preservado,
 * o presente/futuro re-deriva dos novos valores do template.
 */
export async function clearFutureInstances(
  templateId: number,
  fromMonthKey: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "DELETE FROM instances WHERE template_id = ? AND month_key >= ?",
    [templateId, fromMonthKey]
  );
}

// ════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}