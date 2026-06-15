// ════════════════════════════════════════════════
// src/components/DistPicker.tsx
// Dois campos (Adiant./Salário) que se complementam: editar um
// recalcula o outro mantendo a soma = total.
// ════════════════════════════════════════════════

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { parseBRL } from "../core/finance";

interface Props {
  total: number;
  distA: number;
  distS: number;
  onChange: (a: number, s: number) => void;
}

export function DistPicker({ total, distA, distS, onChange }: Props) {
  const { t } = useTheme();

  const handle = (lado: "A" | "S", raw: string) => {
    const v = Math.max(0, Math.min(parseBRL(raw), total));
    const outro = +(total - v).toFixed(2);
    if (lado === "A") onChange(v, outro);
    else onChange(outro, v);
  };

  const field = (label: string, lado: "A" | "S", val: number) => (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: t.txtSub, marginBottom: 4 }}>{label}</Text>
      <TextInput
        keyboardType="decimal-pad"
        value={val.toFixed(2).replace(".", ",")}
        onChangeText={(raw) => handle(lado, raw)}
        style={[s.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.txt }]}
      />
    </View>
  );

  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {field("Adiant.", "A", distA)}
      {field("Salário", "S", distS)}
    </View>
  );
}

const s = StyleSheet.create({
  input: {
    borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10,
    fontSize: 14, textAlign: "right",
  },
});