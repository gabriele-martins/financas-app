// ════════════════════════════════════════════════
// src/components/CampoEdit.tsx
// Valor editável inline (usado na tela Saldo Atual para o valor real).
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { formatBRL } from "../core/finance";
import { InputMoeda } from "./InputMoeda";

interface Props {
  valor: number;
  onChange: (v: number) => void;
}

export function CampoEdit({ valor, onChange }: Props) {
  const { t } = useTheme();
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(0);

  const confirm = () => {
    onChange(temp);
    setEditing(false);
  };

  if (editing) {
    return (
      <InputMoeda
        autoFocus
        valor={temp}
        onChange={setTemp}
        onBlurConfirm={confirm}
        prefixColor={t.txt}
        style={[s.input, { borderColor: t.accent, backgroundColor: t.inputBg }]}
      />
    );
  }

  return (
    <Pressable
      onPress={() => { setTemp(valor); setEditing(true); }}
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