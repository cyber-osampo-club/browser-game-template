import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: ["./src/client/**/*.{ts,tsx}"],
  outdir: "styled-system",
  // 全トークンを :root の CSS variables として出力する。
  // デバッグパネル（src/client/debug/tokens.ts）が
  // document.documentElement.style.setProperty() でランタイム上書きする前提。
  cssVarRoot: ":root",
  theme: {
    extend: {
      tokens: {
        colors: {
          // ゲーム全体の基調色。デバッグパネルの Tokens タブから調整 → 確定値を
          // ここへ貼り戻す運用（docs/knowledge/runbooks/debug-panel.md 参照）
          primary: { value: "#6366f1" },
          primaryHover: { value: "#4f46e5" },
          surface: { value: "#0f172a" },
          surfaceAlt: { value: "#1e293b" },
          text: { value: "#e2e8f0" },
          textMuted: { value: "#94a3b8" },
          danger: { value: "#f87171" },
          success: { value: "#4ade80" },
          gameBackground: { value: "#020617" },
          player: { value: "#38bdf8" },
          obstacle: { value: "#fb7185" },
        },
        radii: {
          card: { value: "12px" },
          control: { value: "8px" },
        },
        spacing: {
          panel: { value: "16px" },
        },
      },
    },
  },
});
