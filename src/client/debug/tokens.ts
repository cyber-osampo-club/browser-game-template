/**
 * Panda CSS デザイントークンのランタイム上書き。
 *
 * Panda は panda.config.ts の cssVarRoot: ":root" 設定により全トークンを
 * CSS variables として出力する。ここでは document.documentElement への
 * style.setProperty() で上書きし、見た目を即時確認できるようにする。
 * 確定した値は panda.config.ts の theme.extend.tokens へ貼り戻す
 * （docs/knowledge/runbooks/debug-panel.md 参照）。
 *
 * このモジュールはデバッグパネル専用（dynamic import 経由でのみ読み込まれる）。
 */

import type { Token } from "styled-system/tokens";
import { token } from "styled-system/tokens";

/**
 * パネルで調整対象にするトークン。
 * panda.config.ts の theme.extend.tokens に追加したらここにも追加する。
 */
export const EDITABLE_TOKENS: readonly Token[] = [
  "colors.primary",
  "colors.primaryHover",
  "colors.surface",
  "colors.surfaceAlt",
  "colors.text",
  "colors.textMuted",
  "colors.danger",
  "colors.success",
  "colors.gameBackground",
  "colors.player",
  "colors.obstacle",
  "radii.card",
  "radii.control",
  "spacing.panel",
];

export interface TokenEntry {
  path: Token;
  cssVar: string;
  defaultValue: string;
  currentValue: string;
  isColor: boolean;
}

/** "var(--colors-primary)" → "--colors-primary" */
function cssVarOf(path: Token): string {
  return token.var(path).replace(/^var\((.+)\)$/, "$1");
}

const overrides = new Map<string, string>();

export function listTokens(): TokenEntry[] {
  return EDITABLE_TOKENS.map((path) => {
    const cssVar = cssVarOf(path);
    const defaultValue = token(path);
    return {
      path,
      cssVar,
      defaultValue,
      currentValue: overrides.get(path) ?? defaultValue,
      isColor: path.startsWith("colors."),
    };
  });
}

export function overrideToken(path: Token, value: string): void {
  overrides.set(path, value);
  document.documentElement.style.setProperty(cssVarOf(path), value);
}

export function resetToken(path: Token): void {
  overrides.delete(path);
  document.documentElement.style.removeProperty(cssVarOf(path));
}

export function resetAllTokens(): void {
  for (const path of [...overrides.keys()]) {
    resetToken(path as Token);
  }
}

/** 変更分のみ（path → value）。スナップショット・エクスポート用 */
export function exportTokenOverrides(): Record<string, string> {
  return Object.fromEntries(overrides);
}
