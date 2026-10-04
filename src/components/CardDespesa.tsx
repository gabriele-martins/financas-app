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
import { CampoEdit } from "./CampoEdit";
import { DespesaResolvida, StatusPag } from "../core/types";
import { formatBRL } from "../core/finance";
import { recurrenceLabel } from "../core/recurrence";

interface Props {
  despesa: DespesaResolvida;
  expanded: boolean;
  isPast: boolean;
  onToggle: () => void;
  onEditDist: (lado: "distA" | "distS", v: number) => void;
  onTogglePago: (lado: "A" | "S") => void;
  onEditValor: (v: number) => void;
  onEditTemplate: () => void;
}

export function CardDespesa({
  despesa: d, expanded, isPast, onToggle, onEditDist, onTogglePago, onEditValor, onEditTemplate,
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
          {!d.fixo && (
            <View style={s.row}>
              <Text style={[s.valorRealLbl, { color: t.txtSub }]}>Valor real</Text>
              {isPast
                ? <Text style={[s.valorRealVal, { color: t.txtHint }]}>{formatBRL(d.valor)}</Text>
                : <CampoEdit valor={d.valor} onChange={onEditValor} />}
            </View>
          )}

          <View style={s.row}>
            <CampoDist label="Adiant." valor={d.distA} disabled={isPast}
              onChange={(v) => onEditDist("distA", v)} />
            <CampoDist label="Salário" valor={d.distS} disabled={isPast}
              onChange={(v) => onEditDist("distS", v)} />
          </View>

          <View style={s.row}>
            {d.distA > 0 && (
              <PagoBtn status={d.statusA} disabled={isPast} onPress={() => onTogglePago("A")} />
            )}
            {d.distS > 0 && (
              <PagoBtn status={d.statusS} disabled={isPast} onPress={() => onTogglePago("S")} />
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

/** Ciclo pendente → guardado → pago; um toque avança para o próximo */
function PagoBtn({ status, disabled, onPress }: { status: StatusPag; disabled?: boolean; onPress: () => void }) {
  const { t } = useTheme();
  const visual = {
    pendente: { label: "Pendente", cor: t.expenseTxt, bg: t.surfaceAlt, peso: "500" as const },
    guardado: { label: "Reservado", cor: t.warn, bg: t.warnBg, peso: "600" as const },
    pago: { label: "Pago", cor: t.incomeC, bg: t.incomeBg, peso: "600" as const },
  }[status];

  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={[s.pago, { backgroundColor: visual.bg, borderColor: t.border, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={{ fontSize: 11, fontWeight: visual.peso, color: visual.cor }}>
        {visual.label}
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
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  valorRealLbl: { fontSize: 11, fontWeight: "600", flex: 1 },
  valorRealVal: { fontSize: 13, fontWeight: "600" },
  pago: { flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  editTxt: { fontSize: 11, fontWeight: "500" },
});