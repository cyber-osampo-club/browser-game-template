/**
 * ボール避けゲームの純粋ロジック。
 *
 * DOM・canvas に依存しないため Node 環境の vitest でそのままテストでき、
 * AI エージェントはヘッドレスの決定論シミュレーション（logic.test.ts 参照）で
 * バランス検証できる。
 */

import type { Rng } from "../../../game/rng";

export interface CanvasGameConfig {
  fieldWidth: number;
  fieldHeight: number;
  playerSpeed: number;
  obstacleSpeed: number;
  spawnIntervalMs: number;
  obstacleSize: number;
}

export interface Obstacle {
  x: number;
  y: number;
  size: number;
}

export interface CanvasGameState {
  status: "ready" | "playing" | "gameover";
  playerX: number;
  score: number;
  elapsedMs: number;
  spawnTimerMs: number;
  obstacles: Obstacle[];
}

export interface FrameInput {
  left: boolean;
  right: boolean;
}

export interface GameEvent {
  type: "gameover" | "score";
  score: number;
}

export const PLAYER_SIZE = 28;
export const PLAYER_BOTTOM_MARGIN = 24;

export function createInitialState(config: CanvasGameConfig): CanvasGameState {
  return {
    status: "ready",
    playerX: config.fieldWidth / 2,
    score: 0,
    elapsedMs: 0,
    spawnTimerMs: 0,
    obstacles: [],
  };
}

function intersects(state: CanvasGameState, obstacle: Obstacle, config: CanvasGameConfig): boolean {
  const half = PLAYER_SIZE / 2;
  const playerTop = config.fieldHeight - PLAYER_BOTTOM_MARGIN - PLAYER_SIZE;
  const playerLeft = state.playerX - half;
  return (
    obstacle.x < playerLeft + PLAYER_SIZE &&
    obstacle.x + obstacle.size > playerLeft &&
    obstacle.y < playerTop + PLAYER_SIZE &&
    obstacle.y + obstacle.size > playerTop
  );
}

/**
 * 1 ステップぶん状態を進める（in-place 更新）。
 * 発生したイベント（スコア加算・ゲームオーバー）を返す。
 */
export function updateGame(
  state: CanvasGameState,
  input: FrameInput,
  dtMs: number,
  rng: Rng,
  config: CanvasGameConfig,
): GameEvent[] {
  if (state.status !== "playing") return [];

  const events: GameEvent[] = [];
  const dtSec = dtMs / 1000;
  state.elapsedMs += dtMs;

  // プレイヤー移動
  const half = PLAYER_SIZE / 2;
  if (input.left) state.playerX -= config.playerSpeed * dtSec;
  if (input.right) state.playerX += config.playerSpeed * dtSec;
  state.playerX = Math.min(config.fieldWidth - half, Math.max(half, state.playerX));

  // 障害物のスポーン
  state.spawnTimerMs += dtMs;
  while (state.spawnTimerMs >= config.spawnIntervalMs) {
    state.spawnTimerMs -= config.spawnIntervalMs;
    state.obstacles.push({
      x: rng.range(0, config.fieldWidth - config.obstacleSize),
      y: -config.obstacleSize,
      size: config.obstacleSize,
    });
  }

  // 落下・画面外の除去（通過 = スコア加算）
  for (const obstacle of state.obstacles) {
    obstacle.y += config.obstacleSpeed * dtSec;
  }
  const remaining: Obstacle[] = [];
  for (const obstacle of state.obstacles) {
    if (obstacle.y > config.fieldHeight) {
      state.score += 10;
      events.push({ type: "score", score: state.score });
    } else {
      remaining.push(obstacle);
    }
  }
  state.obstacles = remaining;

  // 衝突判定
  for (const obstacle of state.obstacles) {
    if (intersects(state, obstacle, config)) {
      state.status = "gameover";
      events.push({ type: "gameover", score: state.score });
      break;
    }
  }

  return events;
}
