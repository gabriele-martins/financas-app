// ════════════════════════════════════════════════
// src/components/DistPicker.tsx
// Dois campos (Adiant./Salário) que se complementam: editar um
// recalcula o outro mantendo a soma = total.
// ════════════════════════════════════════════════

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { InputMoeda } from "./InputMoeda";

interface Props {
  total: number;
  distA: number;
  distS: number;
  onChange: (a: number, s: number) => void;
}

export function DistPicker({ total, distA, distS, onChange }: Props) {
  const { t } = useTheme();

  const handle = (lado: "A" | "S", v: number) => {
    const vv = Math.max(0, Math.min(v, total));
    const outro = +(total - vv).toFixed(2);
    if (lado === "A") onChange(vv, outro);
    else onChange(outro, vv);
  };

  const field = (label: string, lado: "A" | "S", val: number) => (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: t.txtSub, marginBottom: 4 }}>{label}</Text>
      <InputMoeda
        valor={val}
        onChange={(v) => handle(lado, v)}
        prefixColor={t.txt}
        style={[s.input, { borderColor: t.border, backgroundColor: t.inputBg }]}
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