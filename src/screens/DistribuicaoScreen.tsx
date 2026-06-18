// ════════════════════════════════════════════════
// src/screens/DistribuicaoScreen.tsx
// Lista de despesas com distribuição editável + total fixo no rodapé.
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useStore } from "../state/store";
import { CardDespesa } from "../components/CardDespesa";
import { formatBRL } from "../core/finance";

interface Props {
  /** chamado quando o usuário toca em "Editar despesa" */
  onEditTemplate: (templateId: number) => void;
}

export function DistribuicaoScreen({ onEditTemplate }: Props) {
  const { t } = useTheme();
  const { despesas, totais, isPast, editarDistribuicao, alternarPago } = useStore();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Text style={[s.title, { color: t.txt }]}>Distribuição</Text>

      {/* Lista rolável */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} keyboardShouldPersistTaps="handled">
        {isPast && (
          <View style={[s.histBox, { backgroundColor: t.chipA.bg }]}>
            <Text style={{ fontSize: 11, color: t.chipA.txt }}>
              Histórico — somente leitura.
            </Text>
          </View>
        )}

        {despesas.map((d) => (
          <CardDespesa
            key={d.id}
            despesa={d}
            expanded={expandedId === d.id}
            isPast={isPast}
            onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
            onEditDist={(lado, v) => editarDistribuicao(d.id, lado, v)}
            onTogglePago={(campo) => alternarPago(d.id, campo)}
            onEditTemplate={() => onEditTemplate(d.id)}
          />
        ))}
      </ScrollView>

      {/* Total fixo */}
      <View style={s.totalWrap}>
        <View style={[s.total, { backgroundColor: t.totalBg }]}>
          <Text style={[s.totalLbl, { color: t.totalTxt }]}>Total despesas</Text>
          <Text style={[s.totalVal, { color: t.totalTxt }]}>{formatBRL(totais.totalDespA)}</Text>
          <Text style={[s.totalVal, { color: t.totalTxt }]}>{formatBRL(totais.totalDespS)}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
  histBox: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12 },
  totalWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  total: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  totalLbl: { flex: 1, fontSize: 12, fontWeight: "600" },
  totalVal: { width: 80, textAlign: "right", fontSize: 12, fontWeight: "700", marginLeft: 8 },
});