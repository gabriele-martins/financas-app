// ════════════════════════════════════════════════
// src/components/SideMenu.tsx
// Menu lateral de configurações (desliza da direita).
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, StatusBar, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useStore } from "../state/store";
import { Icon } from "./Icon";
import { exportarBackup, importarBackup } from "../db/backup";
import { resetDatabase } from "../db/database";

interface Props {
  visible: boolean;
  onClose: () => void;
  onDataChanged?: () => void;   // chamado após importar, p/ recarregar o store
}

export function SideMenu({ visible, onClose, onDataChanged }: Props) {
  const { t, mode, toggle } = useTheme();
  const { carenciaDias, setCarenciaDias } = useStore();
  const insets = useSafeAreaInsets();
  const dark = mode === "dark";
  const [busy, setBusy] = useState(false);

  const androidSB = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
  const topPad = Math.max(insets.top, androidSB, 24) + 16;
  const bottomPad = Math.max(insets.bottom, 16) + 16;

  const handleExport = async () => {
    try {
      setBusy(true);
      await exportarBackup();
    } catch (e: any) {
      Alert.alert("Erro ao exportar", e?.message ?? "Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const executarImport = async (substituir: boolean) => {
    try {
      setBusy(true);
      const r = await importarBackup(substituir);
      if (!r.importado) return;

      onDataChanged?.();
      const partes = [`${r.contas} ${r.contas === 1 ? "conta" : "contas"}`];
      if (r.overrides > 0) {
        partes.push(`${r.overrides} ${r.overrides === 1 ? "ajuste" : "ajustes"} de histórico`);
      }
      const resumo = partes.join(" e ") + ".";
      Alert.alert(
        "Importação concluída",
        r.semHistorico
          ? `${resumo}\n\nO arquivo era um CSV antigo, que não guarda histórico — pagamentos e valores por mês não vieram.`
          : resumo
      );
      onClose();
    } catch (e: any) {
      Alert.alert("Erro ao importar", e?.message ?? "Verifique o arquivo.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = () => {
    Alert.alert(
      "Importar backup",
      "Substituir apaga as contas e o histórico atuais e restaura o arquivo no lugar. Adicionar mantém o que existe e insere o conteúdo do arquivo junto.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Adicionar", onPress: () => executarImport(false) },
        { text: "Substituir", style: "destructive", onPress: () => executarImport(true) },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      "Apagar tudo?",
      "Isso remove TODAS as despesas, receitas e o histórico. Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar tudo",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await resetDatabase();
              onDataChanged?.();
              onClose();
              Alert.alert("Pronto", "Todos os dados foram apagados.");
            } catch (e: any) {
              Alert.alert("Erro ao apagar", e?.message ?? "Tente novamente.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, flexDirection: "row" }} onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: t.overlay }} />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[s.panel, {
            backgroundColor: t.menuBg,
            borderLeftColor: t.border,
            paddingTop: topPad,
            paddingBottom: bottomPad,
          }]}
        >
          <View style={s.header}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: t.txt }}>Configurações</Text>
            <Pressable onPress={onClose}><Icon name="close" size={20} color={t.txtSub} /></Pressable>
          </View>

          {/* Modo escuro */}
          <View style={[s.row, { borderBottomColor: t.border }]}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: t.txt }}>Modo escuro</Text>
              <Text style={{ fontSize: 11, color: t.txtHint }}>Tema azul noturno</Text>
            </View>
            <Pressable onPress={toggle}
              style={[s.switch, { backgroundColor: dark ? t.accent : t.border }]}>
              <View style={[s.knob, { left: dark ? 24 : 3 }]} />
            </Pressable>
          </View>

          {/* Carência para editar o mês anterior */}
          <View style={[s.row, { borderBottomColor: t.border }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: t.txt }}>Editar mês anterior</Text>
              <Text style={{ fontSize: 11, color: t.txtHint }}>
                {carenciaDias === 0
                  ? "Trava assim que o mês vira"
                  : `Até o dia ${carenciaDias} do mês seguinte`}
              </Text>
            </View>
            <View style={s.stepper}>
              <Pressable onPress={() => setCarenciaDias(carenciaDias - 1)}
                disabled={carenciaDias <= 0}
                style={[s.stepBtn, { borderColor: t.border, opacity: carenciaDias <= 0 ? 0.4 : 1 }]}>
                <Text style={{ fontSize: 16, color: t.accent }}>−</Text>
              </Pressable>
              <Text style={{ fontSize: 14, fontWeight: "600", color: t.txt, minWidth: 22, textAlign: "center" }}>
                {carenciaDias}
              </Text>
              <Pressable onPress={() => setCarenciaDias(carenciaDias + 1)}
                disabled={carenciaDias >= 28}
                style={[s.stepBtn, { borderColor: t.border, opacity: carenciaDias >= 28 ? 0.4 : 1 }]}>
                <Text style={{ fontSize: 16, color: t.accent }}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Backup */}
          <Text style={[s.section, { color: t.txtHint }]}>BACKUP</Text>
          <Pressable onPress={handleExport} disabled={busy}
            style={[s.action, { opacity: busy ? 0.5 : 1 }]}>
            <Icon name="card" size={18} color={t.accent} />
            <Text style={{ fontSize: 14, color: t.txt }}>Exportar backup</Text>
          </Pressable>
          <Pressable onPress={handleImport} disabled={busy}
            style={[s.action, { opacity: busy ? 0.5 : 1 }]}>
            <Icon name="wallet" size={18} color={t.accent} />
            <Text style={{ fontSize: 14, color: t.txt }}>Importar backup</Text>
          </Pressable>

          {/* Zona de perigo */}
          <Text style={[s.section, { color: t.expenseTxt }]}>ZONA DE PERIGO</Text>
          <Pressable onPress={handleReset} disabled={busy}
            style={[s.action, { opacity: busy ? 0.5 : 1 }]}>
            <Icon name="close" size={18} color={t.expenseC} />
            <Text style={{ fontSize: 14, color: t.expenseC }}>Apagar todos os dados</Text>
          </Pressable>

          <View style={{ marginTop: "auto" }}>
            <Text style={{ fontSize: 11, color: t.txtHint, textAlign: "center" }}>App Finanças</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  panel: { width: 260, height: "100%", borderLeftWidth: 1, paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  switch: { width: 48, height: 26, borderRadius: 13, justifyContent: "center" },
  knob: { position: "absolute", top: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  section: { fontSize: 11, fontWeight: "700", marginTop: 20, marginBottom: 8, letterSpacing: 0.5 },
  action: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
});