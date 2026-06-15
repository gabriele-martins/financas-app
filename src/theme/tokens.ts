// ════════════════════════════════════════════════
// src/theme/tokens.ts
// Paleta azul. Verde/vermelho só para valores financeiros.
// ════════════════════════════════════════════════

import { ThemeMode } from "../core/types";

export interface Theme {
  bg: string; surface: string; surfaceAlt: string; border: string;
  header: string; headerTxt: string; headerSub: string;
  accent: string; accentTxt: string;
  incomeC: string; expenseC: string; expenseBg: string; expenseTxt: string; incomeBg: string;
  txt: string; txtSub: string; txtHint: string;
  chipA: { bg: string; txt: string }; chipS: { bg: string; txt: string };
  tabBg: string; tabActive: string; tabInact: string;
  warn: string; warnBg: string;
  totalBg: string; totalTxt: string;
  paidBg: string; paidTxt: string; pendBg: string; pendTxt: string;
  menuBg: string; overlay: string; statusBar: string;
  navBorder: string; inputBg: string; inputBorder: string; segActive: string;
}

const light: Theme = {
  bg: "#eef4fb", surface: "#ffffff", surfaceAlt: "#e2ecf8", border: "#cfddee",
  header: "#cfe0f5", headerTxt: "#1e3a5f", headerSub: "#4a6890",
  accent: "#3b6fb5", accentTxt: "#ffffff",
  incomeC: "#2e7d4f", expenseC: "#b5453a", expenseBg: "#f7e4e2", expenseTxt: "#b5453a", incomeBg: "#e4f1e9",
  txt: "#1e2a3a", txtSub: "#5a6b80", txtHint: "#93a2b5",
  chipA: { bg: "#dce8f7", txt: "#2d4a78" }, chipS: { bg: "#e2e9f5", txt: "#3d4a78" },
  tabBg: "#ffffff", tabActive: "#3b6fb5", tabInact: "#93a2b5",
  warn: "#a07020", warnBg: "#fbf2dd",
  totalBg: "#cfe0f5", totalTxt: "#1e3a5f",
  paidBg: "#e4f1e9", paidTxt: "#2e7d4f", pendBg: "#f7e4e2", pendTxt: "#b5453a",
  menuBg: "#ffffff", overlay: "rgba(20,40,70,0.3)", statusBar: "#cfe0f5",
  navBorder: "#cfddee", inputBg: "#eef4fb", inputBorder: "#bcd0e8", segActive: "#dce8f7",
};

const dark: Theme = {
  bg: "#0e1726", surface: "#18253a", surfaceAlt: "#13202f", border: "#27384f",
  header: "#13202f", headerTxt: "#e3ecf7", headerSub: "#7d92ad",
  accent: "#4c9be8", accentTxt: "#ffffff",
  incomeC: "#4fc38a", expenseC: "#e05c5c", expenseBg: "#2a1a1e", expenseTxt: "#e88080", incomeBg: "#162820",
  txt: "#e3ecf7", txtSub: "#8a9bb3", txtHint: "#566880",
  chipA: { bg: "#19314f", txt: "#6aaee8" }, chipS: { bg: "#1c2c44", txt: "#7e9fd0" },
  tabBg: "#13202f", tabActive: "#4c9be8", tabInact: "#566880",
  warn: "#d4a84b", warnBg: "#221d0f",
  totalBg: "#18253a", totalTxt: "#9cc4ee",
  paidBg: "#162820", paidTxt: "#4fc38a", pendBg: "#2a1a1e", pendTxt: "#e88080",
  menuBg: "#18253a", overlay: "rgba(0,0,0,0.6)", statusBar: "#0e1726",
  navBorder: "#27384f", inputBg: "#13202f", inputBorder: "#27384f", segActive: "#22354f",
};

export const THEMES: Record<ThemeMode, Theme> = { light, dark };