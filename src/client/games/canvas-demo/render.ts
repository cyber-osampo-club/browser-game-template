/**
 * canvas への描画のみを担当（ロジックとテスト対象から分離。coverage 除外）。
 * 色は Panda CSS のデザイントークン（CSS variables）から解決するため、
 * デバッグパネルの Tokens タブでの上書きが canvas 描画にも即時反映される。
 */

import type { CanvasGameState } from "./logic";
import { PLAYER_BOTTOM_MARGIN, PLAYER_SIZE } from "./logic";

function tokenColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function drawGame(ctx: CanvasRenderingContext2D, state: CanvasGameState): void {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = tokenColor("--colors-game-background", "#020617");
  ctx.fillRect(0, 0, width, height);

  // 障害物
  ctx.fillStyle = tokenColor("--colors-obstacle", "#fb7185");
  for (const obstacle of state.obstacles) {
    ctx.beginPath();
    ctx.arc(
      obstacle.x + obstacle.size / 2,
      obstacle.y + obstacle.size / 2,
      obstacle.size / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // プレイヤー
  ctx.fillStyle = tokenColor("--colors-player", "#38bdf8");
  ctx.fillRect(
    state.playerX - PLAYER_SIZE / 2,
    height - PLAYER_BOTTOM_MARGIN - PLAYER_SIZE,
    PLAYER_SIZE,
    PLAYER_SIZE,
  );

  // HUD
  ctx.fillStyle = tokenColor("--colors-text", "#e2e8f0");
  ctx.font = "16px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${state.score}`, 12, 24);

  if (state.status !== "playing") {
    ctx.textAlign = "center";
    ctx.font = "bold 24px system-ui, sans-serif";
    if (state.status === "ready") {
      ctx.fillText("Space で開始", width / 2, height / 2);
    } else {
      ctx.fillStyle = tokenColor("--colors-danger", "#f87171");
      ctx.fillText("GAME OVER", width / 2, height / 2 - 16);
      ctx.fillStyle = tokenColor("--colors-text", "#e2e8f0");
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("Space でリトライ", width / 2, height / 2 + 16);
    }
  }
}
