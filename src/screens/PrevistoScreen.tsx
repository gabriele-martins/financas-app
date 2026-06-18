// ════════════════════════════════════════════════
// src/screens/PrevistoScreen.tsx
// Saldo Previsto: cards por período + lista de receitas (com editar).
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useStore } from "../state/store";
import { CardPeriodo } from "../components/CardPeriodo";
import { Icon } from "../components/Icon";
import { formatBRL } from "../core/finance";
import { recurrenceLabel } from "../core/recurrence";
import { Periodo } from "../core/types";

interface Props {
  onEditTemplate: (templateId: number) => void;
}

export function PrevistoScreen({ onEditTemplate }: Props) {
  const { t } = useTheme();
  const { receitas, totais, isPast } = useStore();
  const [exp, setExp] = useState<Periodo | null>(null);

  const cards: { key: Periodo; titulo: string; e: number; d: number; s: number; p: number; r: number }[] = [
    { key: "A", titulo: "Adiantamento", e: totais.receitaPrevA, d: totais.totalDespA, s: totais.saldoPrevA, p: totais.pagoA, r: totais.pendA },
    { key: "S", titulo: "Salário",      e: totais.receitaPrevS, d: totais.totalDespS, s: totais.saldoPrevS, p: totais.pagoS, r: totais.pendS },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Text style={[s.title, { color: t.txt }]}>Saldo Previsto</Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} keyboardShouldPersistTaps="handled">
        {cards.map((c) => (
          <CardPeriodo key={c.key} titulo={c.titulo} entrada={c.e} despesa={c.d} saldo={c.s}
            pagoLabel="Reservado" pago={c.p} pendente={c.r}
            expanded={exp === c.key} onToggle={() => setExp(exp === c.key ? null : c.key)}>
            <Linha label="Receita" valor={formatBRL(c.e)} color={t.incomeC} t={t} />
          </CardPeriodo>
        ))}

        {/* Lista de receitas */}
        <View style={[s.box, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[s.boxTitle, { color: t.txt }]}>Receitas</Text>
          {receitas.map((e) => (
            <View key={e.id} style={[s.recRow, { borderBottomColor: t.border }]}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "500", color: t.txt }}>{e.nome}</Text>
                <Text style={{ fontSize: 10, color: t.txtHint }}>
                  {e.periodo === "A" ? "Adiantamento" : "Salário"} · dia {e.dia} · {recurrenceLabel(e.recurrence)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: t.incomeC }}>{formatBRL(e.valor)}</Text>
                {!isPast && (
                  <Pressable onPress={() => onEditTemplate(e.id)}>
                    <Icon name="edit" size={15} color={t.accent} />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Linha({ label, valor, color, t }: { label: string; valor: string; color: string; t: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
      <Text style={{ fontSize: 12, color: t.txtSub }}>{label}</Text>
      <Text style={{ fontSize: 12, color, fontWeight: "500" }}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
  box: { borderRadius: 14, padding: 14, borderWidth: 1 },
  boxTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  recRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, marginBottom: 10, borderBottomWidth: 1 },
});