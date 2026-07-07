/**
 * デバッグ機構のエントリポイント（開発時のみ、main.tsx から dynamic import される）。
 *
 * - デバッグパネル（パラメーター / トークン / フィードバック / Issue）をマウント
 * - window.__GAME_DEBUG__（AI テストプレイの窓口）をインストール
 *
 * 不要な機能はここから該当行と対応ディレクトリを消せば個別に削除できる
 * （docs/knowledge/runbooks/debug-panel.md 参照）。
 */

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { installAgentBridge } from "./agent-bridge";
import { DebugPanel } from "./panel/DebugPanel";

export { defineParams } from "./params";
export { debugEvent, registerGame } from "./registry";

export function initDebug(): void {
  installAgentBridge();

  const container = document.createElement("div");
  container.id = "debug-root";
  document.body.appendChild(container);
  createRoot(container).render(createElement(DebugPanel));

  console.info(
    "[debug] デバッグパネル(🐞 / Ctrl+Shift+D) と window.__GAME_DEBUG__ を有効化しました",
  );
}
