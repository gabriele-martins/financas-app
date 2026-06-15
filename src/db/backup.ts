// ════════════════════════════════════════════════
// src/db/backup.ts
// Exporta templates como CSV (compartilha → Drive/email/etc.)
// e importa de um arquivo CSV escolhido pelo usuário.
// ════════════════════════════════════════════════

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { templatesToCSV, csvToTemplates } from "../core/csv";
import { getAllTemplates, insertTemplate } from "./repositories";

/**
 * Gera o CSV dos templates e abre a folha de compartilhamento do sistema.
 * O usuário escolhe o destino (Google Drive, email, WhatsApp…).
 */
export async function exportarCSV(): Promise<void> {
  const templates = await getAllTemplates();
  const csv = templatesToCSV(templates);

  const data = new Date();
  const nome = `financas-${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}.csv`;
  const uri = FileSystem.cacheDirectory + nome;

  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const disponivel = await Sharing.isAvailableAsync();
  if (!disponivel) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "text/csv",
    dialogTitle: "Exportar finanças",
    UTI: "public.comma-separated-values-text",
  });
}

/**
 * Abre o seletor de arquivos, lê o CSV e insere os templates como novos.
 * Retorna quantos foram importados (0 se cancelado).
 */
export async function importarCSV(): Promise<number> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"],
    copyToCacheDirectory: true,
  });

  if (res.canceled || !res.assets?.[0]) return 0;

  const uri = res.assets[0].uri;
  const csv = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const novos = csvToTemplates(csv);
  for (const t of novos) {
    await insertTemplate(t);
  }
  return novos.length;
}