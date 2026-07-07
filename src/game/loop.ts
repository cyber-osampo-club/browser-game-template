/**
 * 固定タイムステップのゲームループ。
 *
 * - update は常に一定の dt で呼ばれる（決定論的な再現・テストプレイの前提）
 * - render はフレーム毎に補間係数 alpha 付きで呼ばれる
 * - pause / step / setTimeScale は AI テストプレイやデバッグパネルの窓口になる
 * - requestAnimationFrame は注入可能（Node 環境でのテスト・ヘッドレス実行のため
 *   DOM 型には依存しない）
 */

export type FrameRequester = (callback: (timeMs: number) => void) => number;
export type FrameCanceler = (id: number) => void;

export interface LoopOptions {
  /** 固定タイムステップで呼ばれる状態更新 */
  update: (dtMs: number) => void;
  /** フレーム毎の描画。alpha は次ステップまでの補間係数 [0, 1) */
  render?: (alpha: number) => void;
  /** 1 ステップのミリ秒数。デフォルト 1000/60 */
  stepMs?: number;
  /** requestAnimationFrame の注入ポイント（テスト用） */
  requestFrame?: FrameRequester;
  cancelFrame?: FrameCanceler;
}

export interface GameLoop {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  /** pause 中に n フレーム（update 呼び出し）だけ進める */
  step(frames?: number): void;
  /** 時間の進みの倍率（0.1〜10 にクランプ）。スローモーション/早送り */
  setTimeScale(scale: number): void;
  getTimeScale(): number;
  readonly running: boolean;
  readonly paused: boolean;
  /** 累計 update 回数 */
  readonly frame: number;
}

/** 1 フレームに処理する経過時間の上限（タブ非アクティブ復帰時の暴走防止） */
const MAX_ELAPSED_MS = 250;
const MIN_TIME_SCALE = 0.1;
const MAX_TIME_SCALE = 10;

function defaultRequestFrame(): FrameRequester {
  const g = globalThis as unknown as { requestAnimationFrame?: FrameRequester };
  const raf = g.requestAnimationFrame;
  if (!raf) {
    throw new Error(
      "requestAnimationFrame がありません。Node 環境では options.requestFrame を注入してください",
    );
  }
  return raf.bind(globalThis);
}

function defaultCancelFrame(): FrameCanceler {
  const g = globalThis as unknown as { cancelAnimationFrame?: FrameCanceler };
  return g.cancelAnimationFrame?.bind(globalThis) ?? (() => {});
}

export function createGameLoop(options: LoopOptions): GameLoop {
  const stepMs = options.stepMs ?? 1000 / 60;
  let running = false;
  let paused = false;
  let timeScale = 1;
  let frame = 0;
  let accumulatorMs = 0;
  let lastTimeMs: number | undefined;
  let frameId = 0;

  const runStep = () => {
    options.update(stepMs);
    frame += 1;
  };

  const tick = (nowMs: number) => {
    if (!running) return;
    if (lastTimeMs !== undefined && !paused) {
      const elapsed = Math.min(nowMs - lastTimeMs, MAX_ELAPSED_MS);
      accumulatorMs += elapsed * timeScale;
      while (accumulatorMs >= stepMs) {
        runStep();
        accumulatorMs -= stepMs;
      }
    }
    lastTimeMs = nowMs;
    options.render?.(paused ? 0 : accumulatorMs / stepMs);
    frameId = (options.requestFrame ?? defaultRequestFrame())(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      lastTimeMs = undefined;
      accumulatorMs = 0;
      frameId = (options.requestFrame ?? defaultRequestFrame())(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      (options.cancelFrame ?? defaultCancelFrame())(frameId);
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      accumulatorMs = 0;
    },
    step(frames = 1) {
      if (!paused) return;
      for (let i = 0; i < frames; i += 1) {
        runStep();
      }
      options.render?.(0);
    },
    setTimeScale(scale: number) {
      timeScale = Math.min(MAX_TIME_SCALE, Math.max(MIN_TIME_SCALE, scale));
    },
    getTimeScale() {
      return timeScale;
    },
    get running() {
      return running;
    },
    get paused() {
      return paused;
    },
    get frame() {
      return frame;
    },
  };
}
