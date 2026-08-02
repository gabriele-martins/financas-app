// ════════════════════════════════════════════════
// src/screens/SimulacaoScreen.tsx
// Simulação de pagamento: marca despesas do mês em checkboxes e
// mostra soma das marcadas + diferença com a receita, por período.
// Não persiste nada — estado local, efêmero.
// ════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useStore } from "../state/store";
import { Icon } from "../components/Icon";
import { formatBRL } from "../core/finance";

type Filtro = "A" | "S" | "ambos";

export function SimulacaoScreen() {
  const { t } = useTheme();
  const { despesas, totais } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("ambos");
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  const mostraA = filtro === "A" || filtro === "ambos";
  const mostraS = filtro === "S" || filtro === "ambos";

  const toggle = (id: number) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const marcarTudo = () => setSelecionados(new Set(despesas.map((d) => d.id)));
  const desmarcarTudo = () => setSelecionados(new Set());
  const marcarPendentes = () =>
    setSelecionados(
      new Set(
        despesas
          .filter((d) => (mostraA && d.distA > 0 && !d.pagoA) || (mostraS && d.distS > 0 && !d.pagoS))
          .map((d) => d.id)
      )
    );

  const { somaA, somaS } = useMemo(() => {
    let a = 0, s = 0;
    for (const d of despesas) {
      if (!selecionados.has(d.id)) continue;
      a += d.distA;
      s += d.distS;
    }
    return { somaA: a, somaS: s };
  }, [despesas, selecionados]);

  const difA = totais.receitaPrevA - somaA;
  const difS = totais.receitaPrevS - somaS;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Text style={[s.title, { color: t.txt }]}>Simulação</Text>

      {/* Filtro A/S/Ambos */}
      <View style={[s.seg, { backgroundColor: t.surfaceAlt }]}>
        {([["A", "Adiantamento"], ["S", "Salário"], ["ambos", "Ambos"]] as const).map(([k, l]) => {
          const on = filtro === k;
          return (
            <Pressable key={k} onPress={() => setFiltro(k)}
              style={[s.segBtn, { backgroundColor: on ? t.surface : "transparent" }]}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: on ? t.accent : t.txtSub }}>{l}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Ações rápidas */}
      <View style={s.acoes}>
        <AcaoBtn label="Marcar tudo" onPress={marcarTudo} t={t} />
        <AcaoBtn label="Desmarcar tudo" onPress={desmarcarTudo} t={t} />
        <AcaoBtn label="Marcar pendentes" onPress={marcarPendentes} t={t} />
      </View>

      {/* Receita do(s) período(s) */}
      <View style={[s.receitaBox, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[s.receitaLbl, { color: t.txtSub }]}>Receita</Text>
        <View style={s.colunas}>
          {mostraA && <Text style={[s.receitaVal, { color: t.incomeC }]}>A {formatBRL(totais.receitaPrevA)}</Text>}
          {mostraS && <Text style={[s.receitaVal, { color: t.incomeC }]}>S {formatBRL(totais.receitaPrevS)}</Text>}
        </View>
      </View>

      {/* Lista de despesas */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} keyboardShouldPersistTaps="handled">
        {despesas.map((d) => {
          const marcado = selecionados.has(d.id);
          return (
            <Pressable key={d.id} onPress={() => toggle(d.id)}
              style={[s.linha, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={[s.check, { borderColor: t.border, backgroundColor: marcado ? t.accent : "transparent" }]}>
                {marcado && <Icon name="check" size={12} color="#fff" />}
              </View>
              <Text numberOfLines={1} style={[s.nome, { color: t.txt }]}>{d.nome}</Text>
              <View style={s.colunas}>
                {mostraA && <Text style={[s.valCol, { color: t.expenseTxt }]}>{formatBRL(d.distA)}</Text>}
                {mostraS && <Text style={[s.valCol, { color: t.expenseTxt }]}>{formatBRL(d.distS)}</Text>}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Rodapé: soma + diferença */}
      <View style={s.rodapeWrap}>
        <View style={[s.rodape, { backgroundColor: t.totalBg }]}>
          <Text style={[s.rodapeLbl, { color: t.totalTxt }]}>Marcado</Text>
          <View style={s.colunas}>
            {mostraA && <Text style={[s.rodapeVal, { color: t.totalTxt }]}>{formatBRL(somaA)}</Text>}
            {mostraS && <Text style={[s.rodapeVal, { color: t.totalTxt }]}>{formatBRL(somaS)}</Text>}
          </View>
        </View>
        <View style={[s.rodape, { backgroundColor: t.totalBg, marginTop: 6 }]}>
          <Text style={[s.rodapeLbl, { color: t.totalTxt }]}>Diferença</Text>
          <View style={s.colunas}>
            {mostraA && (
              <Text style={[s.rodapeVal, s.rodapeValBold, { color: difA < 0 ? t.expenseTxt : t.incomeC }]}>
                {formatBRL(difA)}
              </Text>
            )}
            {mostraS && (
              <Text style={[s.rodapeVal, s.rodapeValBold, { color: difS < 0 ? t.expenseTxt : t.incomeC }]}>
                {formatBRL(difS)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function AcaoBtn({ label, onPress, t }: { label: string; onPress: () => void; t: any }) {
  return (
    <Pressable onPress={onPress} style={[s.acaoBtn, { borderColor: t.border, backgroundColor: t.surface }]}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: t.accent }}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  seg: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4, marginHorizontal: 12, marginBottom: 8 },
  segBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10 },
  acoes: { flexDirection: "row", gap: 8, marginHorizontal: 12, marginBottom: 10 },
  acaoBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  receitaBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  receitaLbl: { fontSize: 12, fontWeight: "600" },
  receitaVal: { fontSize: 12, fontWeight: "700", width: 90, textAlign: "right" },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
  linha: {
    flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10,
    borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6,
  },
  check: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  nome: { flex: 1, fontSize: 13, fontWeight: "500" },
  colunas: { flexDirection: "row" },
  valCol: { fontSize: 12, fontWeight: "600", width: 90, textAlign: "right" },
  rodapeWrap: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12 },
  rodape: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  rodapeLbl: { flex: 1, fontSize: 12, fontWeight: "600" },
  rodapeVal: { fontSize: 12, fontWeight: "700", width: 90, textAlign: "right" },
  rodapeValBold: { fontSize: 14 },
});
