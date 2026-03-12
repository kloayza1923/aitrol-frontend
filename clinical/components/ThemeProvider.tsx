'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface AccentColor {
  name: string;
  value: string;
  lightValue?: string;
}

export const accentColors: AccentColor[] = [
  { name: 'Verde Menta', value: '#4be3b6', lightValue: '#0d9488' },
  { name: 'Azul', value: '#60a5fa', lightValue: '#2563eb' },
  { name: 'Violeta', value: '#a78bfa', lightValue: '#7c3aed' },
  { name: 'Rosa', value: '#f472b6', lightValue: '#db2777' },
  { name: 'Naranja', value: '#fb923c', lightValue: '#ea580c' },
  { name: 'Amarillo', value: '#fbbf24', lightValue: '#d97706' },
  { name: 'Rojo', value: '#f87171', lightValue: '#dc2626' },
  { name: 'Cyan', value: '#22d3ee', lightValue: '#0891b2' },
];

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'clinical-theme-mode';
const THEME_ACCENT_KEY = 'clinical-theme-accent';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>(accentColors[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    const savedAccent = localStorage.getItem(THEME_ACCENT_KEY);

    if (savedMode) {
      setModeState(savedMode);
    }

    if (savedAccent) {
      const parsed = JSON.parse(savedAccent) as AccentColor;
      const found = accentColors.find((c) => c.value === parsed.value);
      if (found) {
        setAccentColorState(found);
      }
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    const effectiveAccent = mode === 'light' && accentColor.lightValue 
      ? accentColor.lightValue 
      : accentColor.value;
    
    root.style.setProperty('--color-accent', effectiveAccent);
    root.style.setProperty('--color-accent-base', accentColor.value);
  }, [mode, accentColor, mounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem(THEME_ACCENT_KEY, JSON.stringify(color));
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
