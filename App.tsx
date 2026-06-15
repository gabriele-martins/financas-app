// ════════════════════════════════════════════════
// App.tsx
// Shell: providers + header (mês/saldos) + topbar + telas + menu.
// ════════════════════════════════════════════════

import React, { useState } from "react";
import {
  View, Text, Pressable, ActivityIndicator, StatusBar,
  Platform, UIManager, StyleSheet,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { StoreProvider, useStore } from "./src/state/store";
import { Icon } from "./src/components/Icon";
import { SideMenu } from "./src/components/SideMenu";
import { DistribuicaoScreen } from "./src/screens/DistribuicaoScreen";
import { PrevistoScreen } from "./src/screens/PrevistoScreen";
import { RealizadoScreen } from "./src/screens/RealizadoScreen";
import { EntradaFormScreen } from "./src/screens/EntradaFormScreen";
import { formatBRL } from "./src/core/finance";
import { MONTH_NAMES } from "./src/core/date";
import { Template } from "./src/core/types";

// LayoutAnimation no Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Tab = "distribuicao" | "previsto" | "realizado";
const TABS: { key: Tab; icon: string }[] = [
  { key: "distribuicao", icon: "grid" },
  { key: "previsto", icon: "list" },
  { key: "realizado", icon: "check" },
];

function Shell() {
  const { t } = useTheme();
  const {
    loading, viewY, viewM, isPast, goMonth, templates, totais, reload,
  } = useStore();
  const [tab, setTab] = useState<Tab>("distribuicao");
  const [menu, setMenu] = useState(false);
  const [form, setForm] = useState<{ open: boolean; editing?: Template }>({ open: false });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={t.accent} size="large" />
      </View>
    );
  }

  const abrirNovo = () => setForm({ open: true });
  const abrirEdicao = (id: number) => {
    const tpl = templates.find((x: Template) => x.id === id);
    if (tpl) setForm({ open: true, editing: tpl });
  };
  const fecharForm = () => setForm({ open: false });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.statusBar }} edges={["top", "bottom"]}>
      <StatusBar barStyle={t.bg === "#0e1726" ? "light-content" : "dark-content"} backgroundColor={t.header} />

      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {/* ── Header ── */}
        <View style={[s.header, { backgroundColor: t.header }]}>
          <View style={s.monthRow}>
            <Pressable onPress={() => goMonth(-1)} style={s.navBtn}>
              <Icon name="chevL" size={20} color={t.headerTxt} />
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: t.headerTxt }}>
                {MONTH_NAMES[viewM - 1]} {viewY}
              </Text>
              {isPast && (
                <Text style={[s.hist, { backgroundColor: t.chipA.bg, color: t.chipA.txt }]}>Histórico</Text>
              )}
            </View>
            <View style={{ flexDirection: "row" }}>
              <Pressable onPress={() => goMonth(1)} style={s.navBtn}>
                <Icon name="chevR" size={20} color={t.headerTxt} />
              </Pressable>
              <Pressable onPress={() => setMenu(true)} style={s.navBtn}>
                <Icon name="menu" size={20} color={t.headerTxt} />
              </Pressable>
            </View>
          </View>

          {/* Cards de saldo por período */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <SaldoCard titulo="Adiantamento · 15" receita={totais.receitaPrevA} despesa={totais.totalDespA} saldo={totais.saldoPrevA} />
            <SaldoCard titulo="Salário · 30" receita={totais.receitaPrevS} despesa={totais.totalDespS} saldo={totais.saldoPrevS} />
          </View>
        </View>

        {/* ── Topbar ── */}
        <View style={[s.topbar, { backgroundColor: t.tabBg, borderBottomColor: t.navBorder }]}>
          {TABS.map(({ key, icon }) => {
            const active = tab === key && !form.open;
            return (
              <Pressable key={key} onPress={() => { setForm({ open: false }); setTab(key); }} style={s.tabBtn}>
                <Icon name={icon} size={20} color={active ? t.tabActive : t.tabInact} />
                {active && <View style={[s.tabBar, { backgroundColor: t.tabActive }]} />}
              </Pressable>
            );
          })}
          {!isPast && (
            <Pressable onPress={abrirNovo} style={s.tabBtn}>
              <Icon name="plus" size={22} color={form.open ? t.tabActive : t.tabInact} />
            </Pressable>
          )}
        </View>

        {/* ── Conteúdo ── */}
        <View style={{ flex: 1 }}>
          {form.open ? (
            <EntradaFormScreen editing={form.editing} onDone={fecharForm} />
          ) : tab === "distribuicao" ? (
            <DistribuicaoScreen onEditTemplate={abrirEdicao} />
          ) : tab === "previsto" ? (
            <PrevistoScreen onEditTemplate={abrirEdicao} />
          ) : (
            <RealizadoScreen />
          )}
        </View>
      </View>

      <SideMenu visible={menu} onClose={() => setMenu(false)} onDataChanged={reload} />
    </SafeAreaView>
  );
}

function SaldoCard({ titulo, receita, despesa, saldo }: { titulo: string; receita: number; despesa: number; saldo: number }) {
  const { t } = useTheme();
  return (
    <View style={[s.saldoCard, { backgroundColor: t.surface }]}>
      <Text style={{ fontSize: 10, color: t.headerSub, marginBottom: 4 }}>{titulo}</Text>
      <View style={s.saldoLine}>
        <Text style={{ fontSize: 10, color: t.headerSub }}>Receita</Text>
        <Text style={{ fontSize: 11, fontWeight: "600", color: t.incomeC }}>{formatBRL(receita)}</Text>
      </View>
      <View style={s.saldoLine}>
        <Text style={{ fontSize: 10, color: t.headerSub }}>Despesas</Text>
        <Text style={{ fontSize: 11, fontWeight: "600", color: t.expenseTxt }}>- {formatBRL(despesa)}</Text>
      </View>
      <View style={[s.saldoLine, { borderTopWidth: 1, borderTopColor: t.border, marginTop: 5, paddingTop: 5 }]}>
        <Text style={{ fontSize: 11, fontWeight: "500", color: t.headerSub }}>Saldo</Text>
        <Text style={{ fontSize: 16, fontWeight: "700", color: saldo < 0 ? t.expenseTxt : t.incomeC }}>{formatBRL(saldo)}</Text>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  hist: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 20, overflow: "hidden", marginTop: 2 },
  topbar: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, paddingHorizontal: 6 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center" },
  tabBar: { position: "absolute", bottom: 0, left: "30%", right: "30%", height: 2, borderRadius: 2 },
  saldoCard: { flex: 1, borderRadius: 12, padding: 10 },
  saldoLine: { flexDirection: "row", justifyContent: "space-between" },
});