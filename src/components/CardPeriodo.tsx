// ════════════════════════════════════════════════
// src/components/CardPeriodo.tsx
// Card expansível de um período (Adiantamento/Salário).
// Usado nas telas Saldo Previsto e Saldo Atual.
// O conteúdo do topo da área expandida é passado via children
// (Previsto mostra "Receita"; Atual mostra entradas editáveis).
// ════════════════════════════════════════════════

import React from "react";
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Icon } from "./Icon";
import { formatBRL } from "../core/finance";

interface Props {
  titulo: string;          // "Adiantamento" | "Salário"
  entrada: number;         // receita (prevista ou real)
  despesa: number;
  saldo: number;
  pagoLabel: string;       // "Reservado" | "Realizado"
  pago: number;
  pendente: number;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;  // linha(s) de receita no topo da área expandida
}

export function CardPeriodo({
  titulo, entrada, despesa, saldo, pagoLabel, pago, pendente,
  expanded, onToggle, children,
}: Props) {
  const { t } = useTheme();
  const cor = saldo < 0 ? t.expenseTxt : t.incomeC;
  const pct = despesa > 0 ? Math.min((pago / despesa) * 100, 100) : 0;

  const press = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Pressable onPress={press} style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={[s.titulo, { color: t.txt }]}>{titulo}</Text>
          <View style={s.headVals}>
            <Text style={{ fontSize: 11, color: t.incomeC, fontWeight: "500" }}>{formatBRL(entrada)}</Text>
            <Text style={{ fontSize: 11, color: t.expenseTxt, fontWeight: "500" }}>- {formatBRL(despesa)}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[s.saldo, { color: cor }]}>{formatBRL(saldo)}</Text>
          <Text style={{ fontSize: 10, color: t.txtHint }}>Saldo</Text>
        </View>
        <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
          <Icon name="chevD" size={18} color={t.txtHint} />
        </View>
      </Pressable>

      {expanded && (
        <View style={[s.body, { borderTopColor: t.border }]}>
          {children}
          <Linha label="Despesas" valor={`- ${formatBRL(despesa)}`} color={t.expenseTxt} t={t} />
          <Linha label={pagoLabel} valor={formatBRL(pago)} color={t.txt} t={t} />
          <Linha label="Pendente" valor={formatBRL(pendente)} color={t.expenseTxt} t={t} />
          <View style={[s.saldoRow, { borderTopColor: t.border }]}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: t.txt }}>Saldo</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: cor }}>{formatBRL(saldo)}</Text>
          </View>
          <View style={[s.bar, { backgroundColor: t.surfaceAlt }]}>
            <View style={[s.barFill, { backgroundColor: t.accent, width: `${pct}%` }]} />
          </View>
          <Text style={{ fontSize: 10, color: t.txtHint, marginTop: 4 }}>
            {Math.round(pct)}% {pagoLabel === "Reservado" ? "das contas pagas" : "realizado"}
          </Text>
        </View>
      )}
    </View>
  );
}

function Linha({ label, valor, color, t }: { label: string; valor: string; color: string; t: any }) {
  return (
    <View style={s.linha}>
      <Text style={{ fontSize: 12, color: t.txtSub }}>{label}</Text>
      <Text style={{ fontSize: 12, color, fontWeight: "500" }}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 12 },
  head: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  titulo: { fontSize: 14, fontWeight: "600" },
  headVals: { flexDirection: "row", gap: 12, marginTop: 3 },
  saldo: { fontSize: 18, fontWeight: "700" },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, borderTopWidth: 1 },
  linha: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  saldoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  bar: { height: 6, borderRadius: 4, overflow: "hidden", marginTop: 10 },
  barFill: { height: "100%", borderRadius: 4 },
});