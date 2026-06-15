// ════════════════════════════════════════════════
// src/components/CampoEdit.tsx
// Valor editável inline (usado na tela Saldo Atual para o valor real).
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { Pressable, TextInput, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { formatBRL, parseBRL } from "../core/finance";

interface Props {
  valor: number;
  onChange: (v: number) => void;
}

export function CampoEdit({ valor, onChange }: Props) {
  const { t } = useTheme();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  const confirm = () => {
    onChange(parseBRL(text));
    setEditing(false);
  };

  if (editing) {
    return (
      <TextInput
        autoFocus
        keyboardType="decimal-pad"
        value={text}
        onChangeText={setText}
        onSubmitEditing={confirm}
        onBlur={confirm}
        style={[s.input, { borderColor: t.accent, color: t.txt, backgroundColor: t.inputBg }]}
      />
    );
  }

  return (
    <Pressable
      onPress={() => { setText(valor.toFixed(2).replace(".", ",")); setEditing(true); }}
      style={[s.btn, { borderColor: t.border }]}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: t.incomeC }}>
        {formatBRL(valor)} ✎
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderStyle: "dashed" },
  input: {
    width: 110, borderRadius: 8, borderWidth: 2, paddingVertical: 2, paddingHorizontal: 8,
    fontSize: 13, textAlign: "right",
  },
});