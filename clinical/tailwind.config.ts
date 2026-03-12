import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        "ink-2": "var(--color-ink-2)",
        panel: "var(--color-panel)",
        "panel-2": "var(--color-panel-2)",
        "ink-contrast": "var(--color-ink-contrast)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        "accent-2": "var(--color-accent-2)",
        danger: "var(--color-danger)",
        "badge-cie": "var(--color-badge-cie)",
        "badge-med": "var(--color-badge-med)",
        "badge-lab": "var(--color-badge-lab)",
        "badge-rx": "var(--color-badge-rx)",
        border: "var(--color-border)",
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        panelLg: "var(--shadow-panel-lg)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
