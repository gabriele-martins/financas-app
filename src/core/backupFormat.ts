// ════════════════════════════════════════════════
// src/core/backupFormat.ts
// Formato do arquivo de backup completo (templates + histórico).
// Funções puras — serialização e parse, sem banco nem UI.
//
// JSON foi escolhido para o backup poder ganhar campos novos com o tempo
// sem quebrar arquivos antigos: adicionar uma chave não invalida nada que
// já foi exportado, e o parser ignora o que não conhece.
// ════════════════════════════════════════════════

import { Template, InstanceStore, InstanceOverride, Tipo, Periodo, Recurrence } from "./types";

/** Versão do formato. Incrementar só em mudança incompatível. */
export const BACKUP_VERSION = 1;

/**
 * Backup completo.
 *
 * As instâncias referenciam o template pelo seu ÍNDICE no array `templates`,
 * não pelo id do banco — ids são reatribuídos na importação, índices não.
 */
export interface BackupFile {
  formato: "financas-backup";
  versao: number;
  exportadoEm: string;            // ISO
  templates: Omit<Template, "id">[];
  /** instancias[monthKey][indiceDoTemplate] = override */
  instancias: Record<string, Record<number, InstanceOverride>>;
}

/** Monta o objeto de backup a partir dos dados do banco */
export function montarBackup(
  templates: Template[],
  instances: InstanceStore,
  exportadoEm: string
): BackupFile {
  // id do banco → índice no array exportado
  const idParaIndice = new Map<number, number>();
  templates.forEach((t, i) => idParaIndice.set(t.id, i));

  const instancias: BackupFile["instancias"] = {};
  for (const monthKey of Object.keys(instances)) {
    const doMes = instances[monthKey];
    for (const idStr of Object.keys(doMes)) {
      const indice = idParaIndice.get(Number(idStr));
      if (indice == null) continue;            // órfã: template não existe mais
      const override = doMes[Number(idStr)];
      if (!override || Object.keys(override).length === 0) continue;
      if (!instancias[monthKey]) instancias[monthKey] = {};
      instancias[monthKey][indice] = override;
    }
  }

  return {
    formato: "financas-backup",
    versao: BACKUP_VERSION,
    exportadoEm,
    templates: templates.map(({ id: _id, ...resto }) => resto),
    instancias,
  };
}

export function backupToJSON(b: BackupFile): string {
  return JSON.stringify(b, null, 2);
}

// ── Parse / validação ──

const TIPOS: Tipo[] = ["despesa", "receita"];

function numOuUndef(v: unknown): number | undefined {
  return typeof v === "number" && isFinite(v) ? v : undefined;
}

function boolOuUndef(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

/** Valida e normaliza um template vindo do arquivo; null se irrecuperável */
function parseTemplate(raw: any): Omit<Template, "id"> | null {
  if (!raw || typeof raw !== "object") return null;
  const tipo = raw.tipo as Tipo;
  if (!TIPOS.includes(tipo)) return null;

  const valor = numOuUndef(raw.valor);
  if (valor == null) return null;

  const base: Omit<Template, "id"> = {
    tipo,
    nome: typeof raw.nome === "string" && raw.nome.trim() ? raw.nome : "(sem nome)",
    icone: typeof raw.icone === "string" && raw.icone ? raw.icone : "cash",
    valor,
    dia: numOuUndef(raw.dia) ?? 1,
    startMonthKey: typeof raw.startMonthKey === "string" ? raw.startMonthKey : "",
    recurrence: (raw.recurrence ?? null) as Recurrence | null,
  };

  if (typeof raw.endMonthKey === "string" && raw.endMonthKey) {
    base.endMonthKey = raw.endMonthKey;
  }

  if (tipo === "receita") {
    base.periodo = (raw.periodo === "S" ? "S" : "A") as Periodo;
  } else {
    base.distA = numOuUndef(raw.distA) ?? 0;
    base.distS = numOuUndef(raw.distS) ?? 0;
    base.fixo = raw.fixo !== false;
  }

  return base;
}

/** Mantém só os campos conhecidos de um override */
function parseOverride(raw: any): InstanceOverride | null {
  if (!raw || typeof raw !== "object") return null;
  const o: InstanceOverride = {};
  const valor = numOuUndef(raw.valor);
  const valorReal = numOuUndef(raw.valorReal);
  const distA = numOuUndef(raw.distA);
  const distS = numOuUndef(raw.distS);
  const pagoA = boolOuUndef(raw.pagoA);
  const pagoS = boolOuUndef(raw.pagoS);
  const guardadoA = boolOuUndef(raw.guardadoA);
  const guardadoS = boolOuUndef(raw.guardadoS);

  if (valor != null) o.valor = valor;
  if (valorReal != null) o.valorReal = valorReal;
  if (distA != null) o.distA = distA;
  if (distS != null) o.distS = distS;
  if (pagoA != null) o.pagoA = pagoA;
  if (pagoS != null) o.pagoS = pagoS;
  if (guardadoA != null) o.guardadoA = guardadoA;
  if (guardadoS != null) o.guardadoS = guardadoS;

  return Object.keys(o).length > 0 ? o : null;
}

export interface BackupParseado {
  templates: Omit<Template, "id">[];
  /** instancias[monthKey][indiceDoTemplate] */
  instancias: Record<string, Record<number, InstanceOverride>>;
}

/**
 * Lê um backup JSON. Lança se o arquivo não for um backup válido.
 * Entradas individuais corrompidas são descartadas, não derrubam a importação.
 */
export function parseBackupJSON(texto: string): BackupParseado {
  let raw: any;
  try {
    raw = JSON.parse(texto);
  } catch {
    throw new Error("Arquivo não é um JSON válido.");
  }

  if (!raw || raw.formato !== "financas-backup" || !Array.isArray(raw.templates)) {
    throw new Error("Arquivo não é um backup do app Finanças.");
  }

  const templates: Omit<Template, "id">[] = [];
  // índice no arquivo → índice na lista já filtrada (templates inválidos somem)
  const remap = new Map<number, number>();
  raw.templates.forEach((t: any, i: number) => {
    const parsed = parseTemplate(t);
    if (parsed) {
      remap.set(i, templates.length);
      templates.push(parsed);
    }
  });

  const instancias: BackupParseado["instancias"] = {};
  const rawInst = raw.instancias;
  if (rawInst && typeof rawInst === "object") {
    for (const monthKey of Object.keys(rawInst)) {
      if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;
      const doMes = rawInst[monthKey];
      if (!doMes || typeof doMes !== "object") continue;

      for (const idxStr of Object.keys(doMes)) {
        const novoIdx = remap.get(Number(idxStr));
        if (novoIdx == null) continue;        // template correspondente foi descartado
        const override = parseOverride(doMes[idxStr]);
        if (!override) continue;
        if (!instancias[monthKey]) instancias[monthKey] = {};
        instancias[monthKey][novoIdx] = override;
      }
    }
  }

  return { templates, instancias };
}
