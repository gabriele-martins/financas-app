// ════════════════════════════════════════════════
// src/theme/ThemeContext.tsx
// Provider do tema. Persiste a escolha no SQLite (settings).
// ════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeMode } from "../core/types";
import { Theme, THEMES } from "./tokens";
import { getSetting, setSetting } from "../db/repositories";

interface ThemeValue {
  mode: ThemeMode;
  t: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);
const SETTING_KEY = "theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  // Carrega a preferência salva
  useEffect(() => {
    getSetting(SETTING_KEY).then((v) => {
      if (v === "light" || v === "dark") setMode(v);
    });
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      setSetting(SETTING_KEY, next); // persiste (fire-and-forget)
      return next;
    });
  };

  const value: ThemeValue = { mode, t: THEMES[mode], toggle };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Hook de acesso ao tema. Use `const { t } = useTheme()` nos componentes. */
export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de <ThemeProvider>");
  return ctx;
}