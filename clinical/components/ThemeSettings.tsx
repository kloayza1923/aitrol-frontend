'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme, accentColors, AccentColor } from './ThemeProvider';

export default function ThemeSettings() {
  const { mode, toggleMode, accentColor, setAccentColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-border transition-colors"
        title="Configuración de tema"
      >
        <svg
          className="w-5 h-5 text-muted hover:text-ink-contrast transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-panel shadow-panelLg overflow-hidden animate-rise z-50">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-ink-contrast">Personalizar tema</h3>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Modo
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => mode !== 'light' && toggleMode()}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                    mode === 'light'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:border-muted text-muted hover:text-ink-contrast'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Claro</span>
                </button>
                <button
                  onClick={() => mode !== 'dark' && toggleMode()}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                    mode === 'dark'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:border-muted text-muted hover:text-ink-contrast'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Oscuro</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Color de acento
              </label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setAccentColor(color)}
                    className={`group relative aspect-square rounded-lg transition-all ${
                      accentColor.value === color.value
                        ? 'ring-2 ring-ink-contrast ring-offset-2 ring-offset-panel'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {accentColor.value === color.value && (
                      <svg
                        className="absolute inset-0 m-auto w-4 h-4 text-ink drop-shadow-sm"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted text-center">{accentColor.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
