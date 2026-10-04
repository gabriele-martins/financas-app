// ════════════════════════════════════════════════
// src/db/backup.ts
// Exporta o backup completo (contas + histórico) como JSON e importa
// de um arquivo escolhido pelo usuário.
//
// O export é JSON para poder ganhar campos novos sem quebrar arquivos
// antigos. O import aceita JSON e também o CSV das versões anteriores —
// CSV traz só as contas, sem histórico.
// ════════════════════════════════════════════════

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { csvToTemplates } from "../core/csv";
import { montarBackup, backupToJSON, parseBackupJSON } from "../core/backupFormat";
import {
  getAllTemplates, getAllInstances, insertTemplate, upsertInstance, limparDados,
} from "./repositories";

/**
 * Gera o backup completo e abre a folha de compartilhamento do sistema.
 * O usuário escolhe o destino (Google Drive, email, WhatsApp…).
 */
export async function exportarBackup(): Promise<void> {
  const [templates, instances] = await Promise.all([
    getAllTemplates(),
    getAllInstances(),
  ]);

  const agora = new Date();
  const backup = montarBackup(templates, instances, agora.toISOString());
  const conteudo = backupToJSON(backup);

  const stamp = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  const uri = FileSystem.cacheDirectory + `financas-${stamp}.json`;

  await FileSystem.writeAsStringAsync(uri, conteudo, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const disponivel = await Sharing.isAvailableAsync();
  if (!disponivel) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/json",
    dialogTitle: "Exportar finanças",
    UTI: "public.json",
  });
}

export interface ResultadoImport {
  /** false quando o usuário fechou o seletor de arquivos */
  importado: boolean;
  contas: number;
  overrides: number;
  /** true quando veio de um CSV antigo (sem histórico) */
  semHistorico: boolean;
}

const VAZIO: ResultadoImport = {
  importado: false, contas: 0, overrides: 0, semHistorico: false,
};

/**
 * Abre o seletor de arquivos e restaura o backup.
 *
 * `substituir` apaga os dados atuais antes de inserir — é o modo de
 * restauração de verdade. Sem ele a importação é aditiva (duplica o que
 * já existir), mantido para quem quer mesclar dois arquivos.
 */
export async function importarBackup(substituir: boolean): Promise<ResultadoImport> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/csv", "text/comma-separated-values", "application/csv", "*/*"],
    copyToCacheDirectory: true,
  });

  if (res.canceled || !res.assets?.[0]) return VAZIO;

  const asset = res.assets[0];
  const texto = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const pareceJSON = texto.trimStart().startsWith("{");

  // CSV antigo: só contas, sem histórico.
  if (!pareceJSON) {
    const novos = csvToTemplates(texto);
    if (novos.length === 0) {
      throw new Error("Nenhuma conta encontrada no arquivo.");
    }
    if (substituir) await limparDados();
    for (const t of novos) await insertTemplate(t);
    return { importado: true, contas: novos.length, overrides: 0, semHistorico: true };
  }

  const { templates, instancias } = parseBackupJSON(texto);
  if (templates.length === 0) {
    throw new Error("Nenhuma conta encontrada no arquivo.");
  }

  if (substituir) await limparDados();

  // índice no arquivo → id real atribuído pelo banco
  const ids: number[] = [];
  for (const t of templates) {
    ids.push(await insertTemplate(t));
  }

  let overrides = 0;
  for (const monthKey of Object.keys(instancias)) {
    for (const idxStr of Object.keys(instancias[monthKey])) {
      const id = ids[Number(idxStr)];
      if (id == null) continue;
      await upsertInstance(monthKey, id, instancias[monthKey][Number(idxStr)]);
      overrides++;
    }
  }

  return { importado: true, contas: templates.length, overrides, semHistorico: false };
}
