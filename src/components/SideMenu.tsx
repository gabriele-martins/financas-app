// ════════════════════════════════════════════════
// src/components/SideMenu.tsx
// Menu lateral de configurações (desliza da direita).
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, StatusBar, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { Icon } from "./Icon";
import { exportarCSV, importarCSV } from "../db/backup";
import { resetDatabase } from "../db/database";

interface Props {
  visible: boolean;
  onClose: () => void;
  onDataChanged?: () => void;   // chamado após importar, p/ recarregar o store
}

export function SideMenu({ visible, onClose, onDataChanged }: Props) {
  const { t, mode, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const dark = mode === "dark";
  const [busy, setBusy] = useState(false);

  const androidSB = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
  const topPad = Math.max(insets.top, androidSB, 24) + 16;
  const bottomPad = Math.max(insets.bottom, 16) + 16;

  const handleExport = async () => {
    try {
      setBusy(true);
      await exportarCSV();
    } catch (e: any) {
      Alert.alert("Erro ao exportar", e?.message ?? "Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    try {
      setBusy(true);
      const n = await importarCSV();
      if (n > 0) {
        onDataChanged?.();
        Alert.alert("Importação concluída", `${n} ${n === 1 ? "item importado" : "itens importados"}.`);
        onClose();
      }
    } catch (e: any) {
      Alert.alert("Erro ao importar", e?.message ?? "Verifique o arquivo CSV.");
    } finally {
      setBusy(false);
    }
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

          {/* Backup */}
          <Text style={[s.section, { color: t.txtHint }]}>BACKUP</Text>
          <Pressable onPress={handleExport} disabled={busy}
            style={[s.action, { opacity: busy ? 0.5 : 1 }]}>
            <Icon name="card" size={18} color={t.accent} />
            <Text style={{ fontSize: 14, color: t.txt }}>Exportar CSV</Text>
          </Pressable>
          <Pressable onPress={handleImport} disabled={busy}
            style={[s.action, { opacity: busy ? 0.5 : 1 }]}>
            <Icon name="wallet" size={18} color={t.accent} />
            <Text style={{ fontSize: 14, color: t.txt }}>Importar CSV</Text>
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
  switch: { width: 48, height: 26, borderRadius: 13, justifyContent: "center" },
  knob: { position: "absolute", top: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  section: { fontSize: 11, fontWeight: "700", marginTop: 20, marginBottom: 8, letterSpacing: 0.5 },
  action: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
});