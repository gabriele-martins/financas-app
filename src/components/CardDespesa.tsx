// ════════════════════════════════════════════════
// src/components/CardDespesa.tsx
// Card expansível de uma despesa na tela Distribuição.
// Resumo (sempre) + área editável (ao expandir).
// ════════════════════════════════════════════════

import React from "react";
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Icon } from "./Icon";
import { CampoDist } from "./CampoDist";
import { DespesaResolvida } from "../core/types";
import { formatBRL } from "../core/finance";
import { recurrenceLabel } from "../core/recurrence";

interface Props {
  despesa: DespesaResolvida;
  expanded: boolean;
  isPast: boolean;
  onToggle: () => void;
  onEditDist: (lado: "distA" | "distS", v: number) => void;
  onTogglePago: (campo: "pagoA" | "pagoS") => void;
  onEditTemplate: () => void;
}

export function CardDespesa({
  despesa: d, expanded, isPast, onToggle, onEditDist, onTogglePago, onEditTemplate,
}: Props) {
  const { t } = useTheme();

  const press = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const subtitle = d.recurrence
    ? recurrenceLabel(d.recurrence)
    : `vence dia ${d.dia}`;

  return (
    <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Resumo */}
      <Pressable onPress={press} style={s.head}>
        <Icon name={d.icone} size={20} color={t.txtSub} />
        <View style={s.headInfo}>
          <Text numberOfLines={1} style={[s.nome, { color: t.txt }]}>{d.nome}</Text>
          <Text style={[s.sub, { color: t.txtHint }]}>{formatBRL(d.valor)} · {subtitle}</Text>
        </View>
        <View style={s.chips}>
          {d.distA > 0 && (
            <Text style={[s.chip, { backgroundColor: t.chipA.bg, color: t.chipA.txt }]}>
              A {formatBRL(d.distA)}
            </Text>
          )}
          {d.distS > 0 && (
            <Text style={[s.chip, { backgroundColor: t.chipS.bg, color: t.chipS.txt }]}>
              S {formatBRL(d.distS)}
            </Text>
          )}
        </View>
        <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
          <Icon name="chevD" size={18} color={t.txtHint} />
        </View>
      </Pressable>

      {/* Editável */}
      {expanded && (
        <View style={[s.body, { borderTopColor: t.border, backgroundColor: t.surfaceAlt }]}>
          <View style={s.row}>
            <CampoDist label="Adiant." valor={d.distA} disabled={isPast}
              onChange={(v) => onEditDist("distA", v)} />
            <CampoDist label="Salário" valor={d.distS} disabled={isPast}
              onChange={(v) => onEditDist("distS", v)} />
          </View>

          <View style={s.row}>
            {d.distA > 0 && (
              <PagoBtn pago={d.pagoA} disabled={isPast} onPress={() => onTogglePago("pagoA")} />
            )}
            {d.distS > 0 && (
              <PagoBtn pago={d.pagoS} disabled={isPast} onPress={() => onTogglePago("pagoS")} />
            )}
          </View>

          {!isPast && (
            <Pressable onPress={onEditTemplate}
              style={[s.editBtn, { borderColor: t.border, backgroundColor: t.surface }]}>
              <Icon name="edit" size={13} color={t.accent} />
              <Text style={[s.editTxt, { color: t.accent }]}>Editar despesa</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function PagoBtn({ pago, disabled, onPress }: { pago: boolean; disabled?: boolean; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={[s.pago, { backgroundColor: t.surfaceAlt, borderColor: t.border, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={{ fontSize: 11, fontWeight: pago ? "600" : "500", color: pago ? t.incomeC : t.expenseTxt }}>
        {pago ? "✓ Pago" : "Pendente"}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 14, marginBottom: 10, borderWidth: 1, overflow: "hidden" },
  head: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10 },
  headInfo: { flex: 1 },
  nome: { fontSize: 13, fontWeight: "600" },
  sub: { fontSize: 10 },
  chips: { flexDirection: "row", gap: 4 },
  chip: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  body: { padding: 10, borderTopWidth: 1, gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  pago: { flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  editTxt: { fontSize: 11, fontWeight: "500" },
});