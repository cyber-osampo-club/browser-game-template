import { describe, expect, it } from "vitest";
import { createRng } from "../../../game/rng";
import { type CanvasGameConfig, createInitialState, PLAYER_SIZE, updateGame } from "./logic";

const config: CanvasGameConfig = {
  fieldWidth: 480,
  fieldHeight: 640,
  playerSpeed: 320,
  obstacleSpeed: 180,
  spawnIntervalMs: 700,
  obstacleSize: 24,
};

const STEP_MS = 1000 / 60;

describe("updateGame", () => {
  it("ready / gameover 状態では何も起きない", () => {
    const state = createInitialState(config);
    const events = updateGame(state, { left: false, right: false }, STEP_MS, createRng(1), config);
    expect(events).toEqual([]);
    expect(state.elapsedMs).toBe(0);
  });

  it("入力でプレイヤーが移動し、フィールド外へは出ない", () => {
    const state = createInitialState(config);
    state.status = "playing";
    const rng = createRng(1);

    const x0 = state.playerX;
    updateGame(state, { left: true, right: false }, STEP_MS, rng, config);
    expect(state.playerX).toBeLessThan(x0);

    // 左端まで移動し続けてもはみ出さない
    for (let i = 0; i < 1000; i += 1) {
      updateGame(state, { left: true, right: false }, STEP_MS, rng, config);
    }
    expect(state.playerX).toBe(PLAYER_SIZE / 2);
  });

  it("spawnIntervalMs ごとに障害物が出現する", () => {
    const state = createInitialState(config);
    state.status = "playing";
    const rng = createRng(42);

    updateGame(state, { left: false, right: false }, 700, rng, config);
    expect(state.obstacles).toHaveLength(1);

    updateGame(state, { left: false, right: false }, 1400, rng, config);
    expect(state.obstacles).toHaveLength(3);
  });

  it("画面外まで落ちた障害物はスコアになる", () => {
    const state = createInitialState(config);
    state.status = "playing";
    state.obstacles.push({ x: 0, y: config.fieldHeight - 1, size: 24 });

    const events = updateGame(state, { left: false, right: false }, STEP_MS, createRng(1), config);
    expect(state.score).toBe(10);
    expect(events).toContainEqual({ type: "score", score: 10 });
    expect(state.obstacles.filter((o) => o.y > config.fieldHeight)).toHaveLength(0);
  });

  it("プレイヤーに衝突するとゲームオーバー", () => {
    const state = createInitialState(config);
    state.status = "playing";
    // プレイヤーの真上ぎりぎりに配置
    state.obstacles.push({
      x: state.playerX - 5,
      y: config.fieldHeight - 24 - PLAYER_SIZE,
      size: 24,
    });

    const events = updateGame(state, { left: false, right: false }, STEP_MS, createRng(1), config);
    expect(state.status).toBe("gameover");
    expect(events.some((e) => e.type === "gameover")).toBe(true);
  });

  it("同じシードなら同じ結果になる（決定論シミュレーション）", () => {
    const run = (seed: number) => {
      const state = createInitialState(config);
      state.status = "playing";
      const rng = createRng(seed);
      // 30 秒ぶん、左右交互に動くだけの bot でプレイ
      for (let frame = 0; frame < 60 * 30 && state.status === "playing"; frame += 1) {
        const goLeft = Math.floor(frame / 30) % 2 === 0;
        updateGame(state, { left: goLeft, right: !goLeft }, STEP_MS, rng, config);
      }
      return { score: state.score, status: state.status, elapsedMs: state.elapsedMs };
    };

    expect(run(42)).toEqual(run(42));
  });
});
