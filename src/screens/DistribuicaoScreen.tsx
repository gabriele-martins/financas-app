// ════════════════════════════════════════════════
// src/screens/DistribuicaoScreen.tsx
// Lista de despesas com distribuição editável + total fixo no rodapé.
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, LayoutAnimation, StyleSheet } from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { DespesaResolvida } from "../core/types";
import { useTheme } from "../theme/ThemeContext";
import { useStore } from "../state/store";
import { CardDespesa } from "../components/CardDespesa";
import { Icon } from "../components/Icon";
import { formatBRL } from "../core/finance";

interface Props {
  /** chamado quando o usuário toca em "Editar despesa" */
  onEditTemplate: (templateId: number) => void;
}

export function DistribuicaoScreen({ onEditTemplate }: Props) {
  const { t } = useTheme();
  const {
    despesas, totais, isPast, emCarencia, carenciaDias,
    editarDistribuicao, alternarPago, editarValorDespesa,
    reordenarDespesas, ordenarDespesasAZ,
  } = useStore();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reordenando, setReordenando] = useState(false);

  const toggleReordenar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(null);
    setReordenando((v) => !v);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={s.titleRow}>
        <Text style={[s.title, { color: t.txt }]}>Distribuição</Text>
        {despesas.length > 1 && (
          <View style={s.titleActions}>
            {reordenando && (
              <Pressable onPress={ordenarDespesasAZ}
                style={[s.miniBtn, { borderColor: t.border, backgroundColor: t.surface }]}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: t.accent }}>A–Z</Text>
              </Pressable>
            )}
            <Pressable onPress={toggleReordenar}
              style={[s.miniBtn, {
                borderColor: reordenando ? t.accent : t.border,
                backgroundColor: reordenando ? t.accent : t.surface,
              }]}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: reordenando ? "#fff" : t.accent }}>
                {reordenando ? "Concluir" : "Reordenar"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {reordenando ? (
        /* Modo reordenar: segure uma linha e arraste para a posição */
        <DraggableFlatList
          data={despesas}
          keyExtractor={(d) => String(d.id)}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={s.list}
          onDragEnd={({ data }) => reordenarDespesas(data.map((d) => d.id))}
          ListHeaderComponent={
            <View style={[s.histBox, { backgroundColor: t.chipA.bg }]}>
              <Text style={{ fontSize: 11, color: t.chipA.txt }}>
                Segure uma despesa e arraste para mudar a ordem.
              </Text>
            </View>
          }
          renderItem={({ item, drag, isActive }: RenderItemParams<DespesaResolvida>) => (
            <Pressable
              onLongPress={drag}
              delayLongPress={150}
              style={[s.reordRow, {
                backgroundColor: isActive ? t.surfaceAlt : t.surface,
                borderColor: isActive ? t.accent : t.border,
              }]}>
              <Icon name={item.icone} size={18} color={t.txtSub} />
              <Text numberOfLines={1} style={[s.reordNome, { color: t.txt }]}>{item.nome}</Text>
              <Text style={{ fontSize: 16, color: t.txtHint, letterSpacing: 2 }}>≡</Text>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} keyboardShouldPersistTaps="handled">
          {isPast && (
            <View style={[s.histBox, { backgroundColor: t.chipA.bg }]}>
              <Text style={{ fontSize: 11, color: t.chipA.txt }}>
                Histórico — somente leitura.
              </Text>
            </View>
          )}

          {emCarencia && (
            <View style={[s.histBox, { backgroundColor: t.warnBg }]}>
              <Text style={{ fontSize: 11, color: t.warn }}>
                Mês anterior, ainda editável até o dia {carenciaDias}. Alterações aqui
                valem deste mês em diante.
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
              onEditValor={(v) => editarValorDespesa(d.id, v)}
              onEditTemplate={() => onEditTemplate(d.id)}
            />
          ))}
        </ScrollView>
      )}

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
  titleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingRight: 16,
  },
  title: { fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  titleActions: { flexDirection: "row", gap: 6 },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  reordRow: {
    flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10,
    borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6,
  },
  reordNome: { flex: 1, fontSize: 13, fontWeight: "500" },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
  histBox: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12 },
  totalWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  total: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  totalLbl: { flex: 1, fontSize: 12, fontWeight: "600" },
  totalVal: { width: 80, textAlign: "right", fontSize: 12, fontWeight: "700", marginLeft: 8 },
});