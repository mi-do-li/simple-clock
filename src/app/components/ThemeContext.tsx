"use client";

import React, { createContext, useContext } from "react";

// テーマ型
export interface Theme {
  bg: string;
  color: string;
  sec: string;
  font: string;
  name?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const defaultTheme: Theme = {
  bg: "#fff",
  color: "#222",
  sec: "#bbb",
  font: "Arial, sans-serif",
  name: "auto"
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);
  const [loaded, setLoaded] = React.useState(false);

  // 初回マウント時に localStorage から復元
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) {
        try {
          setTheme(JSON.parse(saved));
        } catch {}
      }
      setLoaded(true);
    }
  }, []);

  // theme が変わったら保存
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", JSON.stringify(theme));
    }
  }, [theme]);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme]);

  // localStorage 読み込み前は描画しない（default がチラつくのを防ぐ）
  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  return useContext(ThemeContext);
} 