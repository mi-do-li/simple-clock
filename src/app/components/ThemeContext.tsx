"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

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
  name: "default"
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => {},
});

export const ThemeProvider = ({ children, initialTheme }: { children: React.ReactNode, initialTheme?: Theme }) => {
  const [theme, setTheme] = useState<Theme>(initialTheme || defaultTheme);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  return useContext(ThemeContext);
} 