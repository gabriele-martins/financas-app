// ════════════════════════════════════════════════
// src/core/csv.ts
// Serializa/parseia templates como CSV. Funções puras.
// A recorrência vai como JSON dentro de uma célula (entre aspas).
// ════════════════════════════════════════════════

import { Template, Tipo, Periodo, Recurrence } from "./types";

const HEADERS = [
  "tipo", "nome", "icone", "valor", "dia",
  "start_month_key", "periodo", "dist_a", "dist_s", "recurrence",
];

/** Escapa um campo CSV: aspas duplas e vírgulas exigem envolver em aspas */
function esc(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Gera o conteúdo CSV a partir dos templates */
export function templatesToCSV(templates: Template[]): string {
  const linhas = [HEADERS.join(",")];
  for (const t of templates) {
    linhas.push([
      esc(t.tipo),
      esc(t.nome),
      esc(t.icone),
      esc(t.valor),
      esc(t.dia),
      esc(t.startMonthKey),
      esc(t.periodo),
      esc(t.distA),
      esc(t.distS),
      esc(t.recurrence ? JSON.stringify(t.recurrence) : ""),
    ].join(","));
  }
  return linhas.join("\n");
}

/** Parser de uma linha CSV respeitando aspas */
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Converte CSV em templates (sem id — serão inseridos como novos).
 * Ignora linhas inválidas silenciosamente, retornando só as válidas.
 */
export function csvToTemplates(csv: string): Omit<Template, "id">[] {
  const linhas = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length < 2) return [];

  const header = parseLine(linhas[0]).map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const out: Omit<Template, "id">[] = [];
  for (let i = 1; i < linhas.length; i++) {
    const cols = parseLine(linhas[i]);
    const get = (name: string) => cols[idx(name)] ?? "";

    const tipo = get("tipo") as Tipo;
    if (tipo !== "despesa" && tipo !== "receita") continue;

    const valor = parseFloat(get("valor"));
    if (isNaN(valor)) continue;

    let recurrence: Recurrence | null = null;
    const recRaw = get("recurrence").trim();
    if (recRaw) {
      try { recurrence = JSON.parse(recRaw) as Recurrence; }
      catch { recurrence = null; }
    }

    const base: Omit<Template, "id"> = {
      tipo,
      nome: get("nome") || "(sem nome)",
      icone: get("icone") || "cash",
      valor,
      dia: parseInt(get("dia")) || 1,
      startMonthKey: get("start_month_key") || "",
      recurrence,
    };

    if (tipo === "receita") {
      const p = get("periodo");
      base.periodo = (p === "A" || p === "S" ? p : "A") as Periodo;
    } else {
      base.distA = parseFloat(get("dist_a")) || 0;
      base.distS = parseFloat(get("dist_s")) || 0;
    }

    out.push(base);
  }
  return out;
}