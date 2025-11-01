"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "dark" | "system";
type Accent = "primary" | "blue" | "violet" | "green";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  fontSize: number; // px
  setFontSize: (px: number) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const resolved =
    theme === "system" ? (getSystemPrefersDark() ? "dark" : "light") : theme;
  html.classList.toggle("dark", resolved === "dark");
}

function applyAccentToDocument(accent: Accent) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-accent", accent);
}

function applyFontSizeToDocument(px: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--app-font-size", `${px}px`);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as ThemeMode) || "system";
  });

  const [accent, setAccentState] = useState<Accent>(() => {
    if (typeof window === "undefined") return "primary";
    return (localStorage.getItem("accent") as Accent) || "primary";
  });

  const [fontSize, setFontSizeState] = useState<number>(() => {
    if (typeof window === "undefined") return 16;
    const saved = localStorage.getItem("fontSize");
    return saved ? Number(saved) : 16;
  });

  // Inicializa DOM
  useEffect(() => {
    applyThemeToDocument(theme);
    applyAccentToDocument(accent);
    applyFontSizeToDocument(fontSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tema + listener do SO (se "system")
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("theme", theme);
    applyThemeToDocument(theme);

    let mq: MediaQueryList | null = null;
    const listener = () => applyThemeToDocument("system");

    if (theme === "system" && window.matchMedia) {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener?.("change", listener);
      // Safari legacy:
      mq.addListener?.(listener);
    }
    return () => {
      mq?.removeEventListener?.("change", listener);
      mq?.removeListener?.(listener);
    };
  }, [theme]);

  // Accent
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accent", accent);
    applyAccentToDocument(accent);
  }, [accent]);

  // Fonte
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("fontSize", String(fontSize));
    applyFontSizeToDocument(fontSize);
  }, [fontSize]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      accent,
      setAccent: setAccentState,
      fontSize,
      setFontSize: setFontSizeState,
    }),
    [theme, accent, fontSize],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
