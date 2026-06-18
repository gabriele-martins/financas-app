// ════════════════════════════════════════════════
// src/screens/EntradaFormScreen.tsx
// Formulário de criação/edição de despesa ou receita.
// Usa DatePicker nativo, IconModal, DistPicker e RecurrencePicker.
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../theme/ThemeContext";
import { useStore } from "../state/store";
import { Icon, IconName } from "../components/Icon";
import { IconModal } from "../components/IconModal";
import { DistPicker } from "../components/DistPicker";
import { RecurrencePicker } from "../components/RecurrencePicker";
import { Tipo, Template, Recurrence } from "../core/types";
import { parseBRL } from "../core/finance";
import { DEFAULT_RULE, monthlyRule } from "../core/recurrence";
import { periodoByDay, mKey, pad, CUR_YEAR, CUR_MONTH } from "../core/date";

interface Props {
  /** template a editar; ausência = criar novo */
  editing?: Template;
  onDone: () => void;
}

export function EntradaFormScreen({ editing, onDone }: Props) {
  const { t } = useTheme();
  const { criarTemplate, editarTemplate, monthKey } = useStore();

  const [tipo, setTipo] = useState<Tipo>(editing?.tipo ?? "despesa");
  const [nome, setNome] = useState(editing?.nome ?? "");
  const [valor, setValor] = useState(editing ? editing.valor.toFixed(2).replace(".", ",") : "");
  const [icone, setIcone] = useState<string>(editing?.icone ?? "cash");
  const [data, setData] = useState<Date>(editing ? new Date(CUR_YEAR, CUR_MONTH - 1, editing.dia) : new Date());
  const [showDate, setShowDate] = useState(false);
  const [rec, setRec] = useState<Recurrence | null>(editing?.recurrence ?? monthlyRule(new Date().getDate()));
  const [distA, setDistA] = useState(editing?.distA ?? 0);
  const [distS, setDistS] = useState(editing?.distS ?? 0);
  const [iconModal, setIconModal] = useState(false);

  const dia = data.getDate();
  const v = parseBRL(valor);

  const onValorChange = (raw: string) => {
    setValor(raw);
    if (tipo === "despesa") {
      const nv = parseBRL(raw);
      const ratio = editing && editing.valor > 0 ? distA / editing.valor : 0;
      const a = +(nv * ratio).toFixed(2);
      setDistA(a); setDistS(+(nv - a).toFixed(2));
    }
  };

  const onDateChange = (_e: any, sel?: Date) => {
    setShowDate(Platform.OS === "ios");
    if (sel) {
      setData(sel);
      // recorrência mensal travada no dia escolhido
      setRec((r) => ({ ...(r ?? DEFAULT_RULE), freq: "monthly", byMonthDay: sel.getDate(), bySetPos: null, byDayOfWeek: null }));
    }
  };

  const salvar = () => {
    if (!nome.trim() || v <= 0) return;
    const ruleFinal: Recurrence | null = rec
      ? { ...rec, byMonthDay: rec.freq === "monthly" && rec.byMonthDay != null ? dia : rec.byMonthDay }
      : null;

    if (editing) {
      const upd: Template = {
        ...editing, tipo, nome: nome.trim(), icone, valor: v, dia,
        recurrence: ruleFinal,
        ...(tipo === "despesa"
          ? { distA, distS, periodo: undefined }
          : { periodo: periodoByDay(dia), distA: undefined, distS: undefined }),
      };
      editarTemplate(upd);
    } else {
      criarTemplate({
        tipo, nome: nome.trim(), icone, valor: v, dia,
        startMonthKey: monthKey, recurrence: ruleFinal,
        ...(tipo === "despesa"
          ? { distA, distS }
          : { periodo: periodoByDay(dia) }),
      });
    }
    onDone();
  };

  const inp = [s.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.txt }];
  const Lbl = ({ children }: { children: React.ReactNode }) =>
    <Text style={{ fontSize: 12, fontWeight: "600", color: t.txtSub, marginBottom: 6 }}>{children}</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 18, fontWeight: "700", color: t.txt, marginBottom: 16 }}>
          {editing ? (tipo === "despesa" ? "Editar despesa" : "Editar receita") : "Entrada"}
        </Text>

        {/* Tipo */}
        <View style={[s.seg, { backgroundColor: t.surfaceAlt }]}>
          {([["despesa", "Despesa", "expense"], ["receita", "Receita", "income"]] as const).map(([k, l, ic]) => {
            const on = tipo === k;
            const c = on ? (k === "despesa" ? t.expenseTxt : t.incomeC) : t.txtSub;
            return (
              <Pressable key={k} onPress={() => setTipo(k)}
                style={[s.segBtn, { backgroundColor: on ? t.surface : "transparent" }]}>
                <Icon name={ic} size={16} color={c} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: c }}>{l}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Nome + ícone */}
        <Lbl>Nome</Lbl>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TextInput style={[inp, { flex: 1 }]} value={nome} onChangeText={setNome}
            placeholder={tipo === "despesa" ? "Ex: Internet" : "Ex: Salário extra"} placeholderTextColor={t.txtHint} />
          <Pressable onPress={() => setIconModal(true)}
            style={[s.iconBtn, { borderColor: t.inputBorder, backgroundColor: t.inputBg }]}>
            <Icon name={icone} size={20} color={t.accent} />
          </Pressable>
        </View>

        {/* Valor */}
        <Lbl>Valor (R$)</Lbl>
        <TextInput style={[inp, { marginBottom: 16 }]} keyboardType="decimal-pad"
          value={valor} onChangeText={onValorChange} placeholder="0,00" placeholderTextColor={t.txtHint} />

        {/* Data */}
        <Lbl>{tipo === "despesa" ? "Data de vencimento" : "Data de recebimento"}</Lbl>
        <Pressable onPress={() => setShowDate(true)} style={[inp, s.dateBtn, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 14, color: t.txt }}>
            {`${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()}`}
          </Text>
          <Icon name="chevD" size={16} color={t.txtHint} />
        </Pressable>
        {showDate && (
          <DateTimePicker value={data} mode="date" display="default" onChange={onDateChange} />
        )}

        {/* Distribuição (só despesa) */}
        {tipo === "despesa" && (
          <>
            <Lbl>Distribuição</Lbl>
            <View style={{ marginBottom: 16 }}>
              <DistPicker total={v} distA={distA} distS={distS}
                onChange={(a, sd) => { setDistA(a); setDistS(sd); }} />
            </View>
          </>
        )}

        {/* Recorrência */}
        <Lbl>Recorrência</Lbl>
        <View style={[s.recBox, { backgroundColor: t.surface, borderColor: t.border }]}>
          <RecurrencePicker value={rec} onChange={setRec} />
        </View>

        {/* Salvar */}
        <Pressable onPress={salvar} style={[s.save, { backgroundColor: t.accent }]}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Salvar</Text>
        </Pressable>
      </ScrollView>

      <IconModal visible={iconModal} selected={icone}
        onSelect={(n: IconName) => setIcone(n)} onClose={() => setIconModal(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, fontSize: 14 },
  seg: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10 },
  iconBtn: { width: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recBox: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  save: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginBottom: 8 },
});