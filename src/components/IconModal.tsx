// ════════════════════════════════════════════════
// src/components/IconModal.tsx
// Bottom sheet para escolher o ícone da entrada (grade dos 30).
// ════════════════════════════════════════════════

import React from "react";
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { Icon, ICON_CHOICES, IconName } from "./Icon";

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (name: IconName) => void;
  onClose: () => void;
}

export function IconModal({ visible, selected, onSelect, onClose }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[s.overlay, { backgroundColor: t.overlay }]} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: t.surface, paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={s.header}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: t.txt }}>Escolher ícone</Text>
            <Pressable onPress={onClose}><Icon name="close" size={20} color={t.txtSub} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
            {ICON_CHOICES.map((ic) => {
              const sel = selected === ic;
              return (
                <Pressable key={ic} onPress={() => { onSelect(ic); onClose(); }}
                  style={[s.cell, { borderColor: sel ? t.accent : t.border, backgroundColor: sel ? t.segActive : t.surfaceAlt }]}>
                  <Icon name={ic} size={22} color={sel ? t.accent : t.txtSub} />
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, maxHeight: "75%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cell: { width: "15%", aspectRatio: 1, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 8 },
});