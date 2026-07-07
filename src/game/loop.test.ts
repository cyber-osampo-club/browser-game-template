import { describe, expect, it } from "vitest";
import { createGameLoop, type FrameRequester } from "./loop.js";

/** requestAnimationFrame を手動で進められるテストドライバー */
function createFrameDriver() {
  let callback: ((timeMs: number) => void) | undefined;
  let nowMs = 0;
  const requestFrame: FrameRequester = (cb) => {
    callback = cb;
    return 1;
  };
  return {
    requestFrame,
    cancelFrame: () => {
      callback = undefined;
    },
    /** elapsedMs だけ時間を進めて 1 フレーム描画する */
    advance(elapsedMs: number) {
      nowMs += elapsedMs;
      callback?.(nowMs);
    },
  };
}

describe("createGameLoop", () => {
  it("経過時間に応じて固定タイムステップで update を呼ぶ", () => {
    const driver = createFrameDriver();
    const dts: number[] = [];
    const loop = createGameLoop({
      update: (dt) => dts.push(dt),
      stepMs: 10,
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });

    loop.start();
    driver.advance(0); // 初回フレーム（基準時刻の確定のみ）
    driver.advance(35); // 35ms 経過 → 10ms ステップ x3
    expect(dts).toEqual([10, 10, 10]);
    expect(loop.frame).toBe(3);

    driver.advance(5); // 累積 10ms → x1
    expect(loop.frame).toBe(4);
  });

  it("余りは accumulator に持ち越され、render に alpha として渡る", () => {
    const driver = createFrameDriver();
    const alphas: number[] = [];
    const loop = createGameLoop({
      update: () => {},
      render: (alpha) => alphas.push(alpha),
      stepMs: 10,
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });

    loop.start();
    driver.advance(0);
    driver.advance(15); // 1 ステップ + 5ms 余り → alpha 0.5
    expect(alphas.at(-1)).toBeCloseTo(0.5);
  });

  it("巨大な経過時間はクランプされ update が暴走しない", () => {
    const driver = createFrameDriver();
    let updates = 0;
    const loop = createGameLoop({
      update: () => {
        updates += 1;
      },
      stepMs: 10,
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });

    loop.start();
    driver.advance(0);
    driver.advance(10_000); // タブ復帰想定 → 250ms 相当まで
    expect(updates).toBe(25);
  });

  it("pause 中は update されず、step で任意フレーム進められる", () => {
    const driver = createFrameDriver();
    let updates = 0;
    const loop = createGameLoop({
      update: () => {
        updates += 1;
      },
      stepMs: 10,
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });

    loop.start();
    driver.advance(0);
    loop.pause();
    driver.advance(100);
    expect(updates).toBe(0);

    loop.step(3);
    expect(updates).toBe(3);
    expect(loop.frame).toBe(3);

    loop.resume();
    driver.advance(20);
    expect(updates).toBe(5);
  });

  it("resume 時に accumulator がリセットされ pause 中の時間が加算されない", () => {
    const driver = createFrameDriver();
    let updates = 0;
    const loop = createGameLoop({
      update: () => {
        updates += 1;
      },
      stepMs: 10,
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });

    loop.start();
    driver.advance(0);
    loop.pause();
    driver.advance(200); // pause 中の経過
    loop.resume();
    driver.advance(10);
    expect(updates).toBe(1);
  });

  it("step は pause 中でなければ何もしない", () => {
    const driver = createFrameDriver();
    let updates = 0;
    const loop = createGameLoop({
      update: () => {
        updates += 1;
      },
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });

    loop.start();
    loop.step(5);
    expect(updates).toBe(0);
  });

  it("timeScale で時間の進みが変わる（クランプ込み）", () => {
    const driver = createFrameDriver();
    let updates = 0;
    const loop = createGameLoop({
      update: () => {
        updates += 1;
      },
      stepMs: 10,
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });

    loop.start();
    driver.advance(0);
    loop.setTimeScale(2);
    driver.advance(10); // 実時間 10ms x2 → 2 ステップ
    expect(updates).toBe(2);

    loop.setTimeScale(100); // 上限 10 にクランプ
    expect(loop.getTimeScale()).toBe(10);
    loop.setTimeScale(0.001); // 下限 0.1 にクランプ
    expect(loop.getTimeScale()).toBe(0.1);
  });

  it("stop 後は tick が回らない", () => {
    const driver = createFrameDriver();
    let updates = 0;
    const loop = createGameLoop({
      update: () => {
        updates += 1;
      },
      stepMs: 10,
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });

    loop.start();
    driver.advance(0);
    loop.stop();
    expect(loop.running).toBe(false);
    driver.advance(100);
    expect(updates).toBe(0);
  });

  it("start は二重起動しない", () => {
    const driver = createFrameDriver();
    const loop = createGameLoop({
      update: () => {},
      requestFrame: driver.requestFrame,
      cancelFrame: driver.cancelFrame,
    });
    loop.start();
    loop.start();
    expect(loop.running).toBe(true);
  });
});
