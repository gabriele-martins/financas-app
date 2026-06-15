// ════════════════════════════════════════════════
// src/components/RecurrencePicker.tsx
// Seletor de recorrência. value=null → "Não se repete".
// Mostra só as opções da frequência escolhida; término em "Mais opções".
// ════════════════════════════════════════════════

import React, { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, LayoutAnimation } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Icon } from "./Icon";
import { Recurrence, DiaSemana, Frequencia } from "../core/types";
import { recurrenceLabel, DAYNAMES, DEFAULT_RULE } from "../core/recurrence";

const FREQ: [Frequencia, string][] = [
  ["daily", "Diária"], ["weekly", "Semanal"], ["monthly", "Mensal"], ["yearly", "Anual"],
];
const DAYS_W: { k: DiaSemana; l: string }[] = [
  { k: "SU", l: "D" }, { k: "MO", l: "S" }, { k: "TU", l: "T" }, { k: "WE", l: "Q" },
  { k: "TH", l: "Q" }, { k: "FR", l: "S" }, { k: "SA", l: "S" },
];
const SETPOS: { v: number; l: string }[] = [
  { v: 1, l: "Primeira" }, { v: 2, l: "Segunda" }, { v: 3, l: "Terceira" },
  { v: 4, l: "Quarta" }, { v: -1, l: "Última" },
];

const unitLabel = (n: number, f: Frequencia) =>
  n === 1
    ? { daily: "dia", weekly: "semana", monthly: "mês", yearly: "ano" }[f]
    : { daily: "dias", weekly: "semanas", monthly: "meses", yearly: "anos" }[f];

interface Props {
  value: Recurrence | null;
  onChange: (r: Recurrence | null) => void;
}

export function RecurrencePicker({ value, onChange }: Props) {
  const { t } = useTheme();
  const [more, setMore] = useState(false);
  const noRepeat = value === null;
  const rule = value ?? DEFAULT_RULE;
  const set = (patch: Partial<Recurrence>) => onChange({ ...rule, ...patch });

  const optStyle = (active: boolean) => ({
    borderColor: active ? t.accent : t.border,
    backgroundColor: active ? t.segActive : t.surface,
  });
  const optTxt = (active: boolean) => ({ color: active ? t.accent : t.txtSub });

  return (
    <View style={{ gap: 14 }}>
      {/* Não se repete */}
      <Pressable onPress={() => onChange(noRepeat ? { ...DEFAULT_RULE } : null)}
        style={[s.noRepeat, optStyle(noRepeat)]}>
        <Text style={[{ fontSize: 13, fontWeight: "500" }, optTxt(noRepeat)]}>Não se repete</Text>
        {noRepeat && <Text style={{ color: t.accent }}>✓</Text>}
      </Pressable>

      {!noRepeat && (
        <>
          {/* Frequência */}
          <View>
            <Lbl t={t}>Frequência</Lbl>
            <View style={s.grid4}>
              {FREQ.map(([k, l]) => (
                <Pressable key={k} onPress={() => set({ freq: k })} style={[s.freqBtn, optStyle(rule.freq === k)]}>
                  <Text style={[{ fontSize: 12, fontWeight: "500" }, optTxt(rule.freq === k)]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Intervalo */}
          <View>
            <Lbl t={t}>Repetir a cada</Lbl>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <NumCtrl value={rule.interval} onChange={(v) => set({ interval: v })} />
              <Text style={{ fontSize: 13, color: t.txtSub }}>{unitLabel(rule.interval, rule.freq)}</Text>
            </View>
          </View>

          {/* Semanal: dias */}
          {rule.freq === "weekly" && (
            <View>
              <Lbl t={t}>Dias da semana</Lbl>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {DAYS_W.map((d) => {
                  const on = (rule.byDay ?? []).includes(d.k);
                  return (
                    <Pressable key={d.k}
                      onPress={() => set({ byDay: on ? rule.byDay.filter((x) => x !== d.k) : [...(rule.byDay ?? []), d.k] })}
                      style={[s.dayBtn, optStyle(on)]}>
                      <Text style={[{ fontSize: 11, fontWeight: "600" }, optTxt(on)]}>{d.l}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Mensal: dia fixo ou posição */}
          {rule.freq === "monthly" && (
            <View>
              <Lbl t={t}>Repetir no</Lbl>
              <Seg value={rule.byMonthDay != null ? "fixed" : "pos"}
                options={[["fixed", "Dia fixo"], ["pos", "Dia da semana"]]}
                onChange={(v) => set(v === "fixed"
                  ? { byMonthDay: 15, bySetPos: null, byDayOfWeek: null }
                  : { byMonthDay: null, bySetPos: 1, byDayOfWeek: "MO" })} />
              <View style={{ marginTop: 8 }}>
                {rule.byMonthDay != null ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ fontSize: 13, color: t.txtSub }}>Dia</Text>
                    <NumCtrl value={rule.byMonthDay} min={1} max={31} onChange={(v) => set({ byMonthDay: v })} />
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Picker value={String(rule.bySetPos ?? 1)}
                      options={SETPOS.map((p) => [String(p.v), p.l])}
                      onChange={(v) => set({ bySetPos: parseInt(v) })} />
                    <Picker value={rule.byDayOfWeek ?? "MO"}
                      options={Object.entries(DAYNAMES).map(([k, v]) => [k, v[0].toUpperCase() + v.slice(1)])}
                      onChange={(v) => set({ byDayOfWeek: v as DiaSemana })} />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Mais opções */}
          <Pressable onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setMore((v) => !v); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ transform: [{ rotate: more ? "180deg" : "0deg" }] }}>
              <Icon name="chevD" size={16} color={t.accent} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: "500", color: t.accent }}>
              {more ? "Menos opções" : "Mais opções"}
            </Text>
          </Pressable>

          {more && (
            <View style={{ gap: 10 }}>
              <Lbl t={t}>Término</Lbl>
              <Seg value={rule.until?.type ?? "never"}
                options={[["never", "Nunca"], ["date", "Data"], ["count", "Nº vezes"]]}
                onChange={(v) => set({ until: v === "never" ? { type: "never" } : v === "date" ? { type: "date", date: "" } : { type: "count", count: 10 } })} />
              {rule.until?.type === "date" && (
                <TextInput placeholder="AAAA-MM-DD" placeholderTextColor={t.txtHint}
                  value={rule.until.date} onChangeText={(d) => set({ until: { type: "date", date: d } })}
                  style={[s.dateInput, { borderColor: t.border, color: t.txt, backgroundColor: t.inputBg }]} />
              )}
              {rule.until?.type === "count" && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <NumCtrl value={rule.until.count} min={1} max={999} onChange={(v) => set({ until: { type: "count", count: v } })} />
                  <Text style={{ fontSize: 13, color: t.txtSub }}>ocorrência{rule.until.count !== 1 ? "s" : ""}</Text>
                </View>
              )}
            </View>
          )}

          {/* Resumo */}
          <View style={[s.resumo, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
            <Text style={{ fontSize: 10, fontWeight: "600", color: t.txtSub, textTransform: "uppercase", marginBottom: 2 }}>Resumo</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: t.txt }}>{recurrenceLabel(value)}</Text>
          </View>
        </>
      )}
    </View>
  );
}

// ── sub-componentes ──

function Lbl({ children, t }: { children: React.ReactNode; t: any }) {
  return <Text style={{ fontSize: 12, fontWeight: "600", color: t.txtSub, marginBottom: 6 }}>{children}</Text>;
}

function NumCtrl({ value, onChange, min = 1, max = 999 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const { t } = useTheme();
  const btn = { width: 28, height: 28, borderRadius: 8, backgroundColor: t.surfaceAlt, borderWidth: 1, borderColor: t.border, alignItems: "center" as const, justifyContent: "center" as const };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Pressable style={btn} onPress={() => onChange(Math.max(min, value - 1))}><Text style={{ color: t.txt, fontSize: 16 }}>−</Text></Pressable>
      <TextInput keyboardType="numeric" value={String(value)}
        onChangeText={(x) => { const n = parseInt(x) || min; onChange(Math.min(max, Math.max(min, n))); }}
        style={{ width: 44, borderWidth: 1, borderColor: t.border, borderRadius: 8, textAlign: "center", fontSize: 14, paddingVertical: 4, backgroundColor: t.inputBg, color: t.txt }} />
      <Pressable style={btn} onPress={() => onChange(Math.min(max, value + 1))}><Text style={{ color: t.txt, fontSize: 16 }}>+</Text></Pressable>
    </View>
  );
}

function Seg({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: t.surfaceAlt, borderRadius: 10, padding: 3, gap: 3 }}>
      {options.map(([k, l]) => (
        <Pressable key={k} onPress={() => onChange(k)}
          style={{ flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: "center", backgroundColor: value === k ? t.surface : "transparent" }}>
          <Text style={{ fontSize: 12, fontWeight: "500", color: value === k ? t.txt : t.txtSub }}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Picker simples: cicla as opções ao tocar (evita dependência de lib de picker)
function Picker({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const { t } = useTheme();
  const idx = options.findIndex(([k]) => k === value);
  const cur = options[idx] ?? options[0];
  const next = () => onChange(options[(idx + 1) % options.length][0]);
  return (
    <Pressable onPress={next} style={{ flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 8, backgroundColor: t.inputBg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ fontSize: 12, color: t.txt }}>{cur[1]}</Text>
      <Icon name="chevD" size={14} color={t.txtHint} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  noRepeat: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  grid4: { flexDirection: "row", gap: 6 },
  freqBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  dayBtn: { flex: 1, aspectRatio: 1, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dateInput: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, fontSize: 13 },
  resumo: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1 },
});