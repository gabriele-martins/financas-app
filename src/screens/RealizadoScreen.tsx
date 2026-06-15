// ════════════════════════════════════════════════
// src/screens/RealizadoScreen.tsx
// Saldo Atual: espelho do Previsto, mas com receita real editável.
// Saldo = receita real − despesas.
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useStore } from "../state/store";
import { CardPeriodo } from "../components/CardPeriodo";
import { CampoEdit } from "../components/CampoEdit";
import { formatBRL } from "../core/finance";
import { Periodo } from "../core/types";

export function RealizadoScreen() {
  const { t } = useTheme();
  const { receitas, totais, isPast, editarValorReal } = useStore();
  const [exp, setExp] = useState<Periodo | null>(null);

  const cards: { key: Periodo; titulo: string; real: number; d: number; s: number; p: number; r: number }[] = [
    { key: "A", titulo: "Adiantamento", real: totais.receitaRealA, d: totais.totalDespA, s: totais.saldoRealA, p: totais.pagoA, r: totais.pendA },
    { key: "S", titulo: "Salário",      real: totais.receitaRealS, d: totais.totalDespS, s: totais.saldoRealS, p: totais.pagoS, r: totais.pendS },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Text style={[s.title, { color: t.txt }]}>Saldo Atual</Text>
      <ScrollView contentContainerStyle={s.list}>
        {cards.map((c) => {
          const itens = receitas.filter((e) => e.periodo === c.key);
          return (
            <CardPeriodo key={c.key} titulo={c.titulo} entrada={c.real} despesa={c.d} saldo={c.s}
              pagoLabel="Realizado" pago={c.p} pendente={c.r}
              expanded={exp === c.key} onToggle={() => setExp(exp === c.key ? null : c.key)}>
              {itens.map((item) => (
                <View key={item.id} style={s.recRow}>
                  <Text style={{ fontSize: 12, color: t.txtSub }}>{item.nome}</Text>
                  {isPast
                    ? <Text style={{ fontSize: 12, fontWeight: "600", color: t.incomeC }}>{formatBRL(item.valorReal)}</Text>
                    : <CampoEdit valor={item.valorReal} onChange={(v) => editarValorReal(item.id, v)} />}
                </View>
              ))}
            </CardPeriodo>
          );
        })}
        {!isPast && (
          <Text style={{ fontSize: 11, color: t.txtHint, textAlign: "center", paddingHorizontal: 16 }}>
            Toque no valor para editar o recebido.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
  recRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
});