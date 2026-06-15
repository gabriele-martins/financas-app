// ════════════════════════════════════════════════
// src/db/database.ts
// Abre a conexão SQLite, cria tabelas e roda o seed na 1ª vez.
// ════════════════════════════════════════════════

import * as SQLite from "expo-sqlite";
import { CREATE_TABLES, SEED } from "./schema";
import { CUR_MONTH_KEY } from "../core/date";

const DB_NAME = "financas.db";

// Guarda a PROMESSA (não a conexão) para evitar abrir o banco
// várias vezes em chamadas concorrentes (ex: Promise.all na carga inicial).
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // PRAGMAs um a um (execAsync com múltiplos statements pode falhar
    // em algumas versões do driver). WAL fora de qualquer transação.
    await db.execAsync("PRAGMA journal_mode = WAL");
    await db.execAsync("PRAGMA foreign_keys = ON");

    // Cria as tabelas. CREATE_TABLES tem vários statements separados por ';'
    // — execAsync aceita isso, mas se der problema, ver nota abaixo.
    await db.execAsync(CREATE_TABLES);

    // Seed só se a tabela estiver vazia
    // const row = await db.getFirstAsync<{ n: number }>(
    //   "SELECT COUNT(*) AS n FROM templates"
    // );
    // if (!row || row.n === 0) {
    //   await seedDatabase(db);
    // }

    return db;
  })();

  return _dbPromise;
}

/** Insere os dados iniciais — SEM transação, para o erro real aparecer se falhar */
async function seedDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const rows = SEED(CUR_MONTH_KEY);
  for (const r of rows) {
    await db.runAsync(
      `INSERT INTO templates
         (tipo, nome, icone, valor, dia, start_month_key, recurrence, periodo, dist_a, dist_s)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.tipo,
        r.nome,
        r.icone,
        r.valor,
        r.dia,
        r.start_month_key,
        r.recurrence ?? null,
        r.periodo ?? null,
        r.dist_a ?? null,
        r.dist_s ?? null,
      ]
    );
  }
}

/** Reseta tudo (dev). Zera a promessa para forçar recriação. */
export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync("DROP TABLE IF EXISTS instances");
  await db.execAsync("DROP TABLE IF EXISTS templates");
  await db.execAsync("DROP TABLE IF EXISTS settings");
  _dbPromise = null;
  await getDb();
}