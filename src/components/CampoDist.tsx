// ════════════════════════════════════════════════
// src/components/CampoDist.tsx
// Campo de valor de distribuição. Toque → vira input; blur/enter confirma.
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { Pressable, TextInput, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { formatBRL, parseBRL } from "../core/finance";

interface Props {
  valor: number;
  label: string;            // "Adiant." | "Salário"
  disabled?: boolean;
  onChange: (v: number) => void;
}

export function CampoDist({ valor, label, disabled, onChange }: Props) {
  const { t } = useTheme();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  const confirm = () => {
    onChange(parseBRL(text));
    setEditing(false);
  };

  if (disabled) {
    return (
      <View style={[s.box, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
        <Text style={[s.val, { color: t.txtHint }]}>{formatBRL(valor)}</Text>
      </View>
    );
  }

  if (editing) {
    return (
      <TextInput
        autoFocus
        keyboardType="decimal-pad"
        value={text}
        placeholder={valor.toFixed(2).replace(".", ",")}
        placeholderTextColor={t.txtHint}
        onChangeText={setText}
        onSubmitEditing={confirm}
        onBlur={confirm}
        style={[s.box, s.input, { borderColor: t.accent, color: t.txt, backgroundColor: t.inputBg }]}
      />
    );
  }

  return (
    <Pressable
      onPress={() => { setText(valor.toFixed(2).replace(".", ",")); setEditing(true); }}
      style={[s.box, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}
    >
      <Text style={[s.lbl, { color: t.txtHint }]}>{label} ✎</Text>
      <Text style={[s.val, { color: valor > 0 ? t.expenseTxt : t.txtHint }]}>
        {formatBRL(valor)}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  box: {
    flex: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8,
    borderWidth: 1, borderStyle: "dashed",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  input: { borderStyle: "solid", borderWidth: 2, textAlign: "right", fontSize: 12 },
  lbl: { fontSize: 9 },
  val: { fontSize: 11, fontWeight: "500" },
});