import { useEffect, useRef } from "react";
import { css } from "styled-system/css";
import { createInputManager } from "../../../game/input";
import { createGameLoop } from "../../../game/loop";
import { createRng } from "../../../game/rng";
import { debugEvent, registerGame } from "../../debug/registry";
import { type CanvasGameConfig, createInitialState, updateGame } from "./logic";
import { canvasParams } from "./params";
import { drawGame } from "./render";

const FIELD_WIDTH = 480;
const FIELD_HEIGHT = 640;
const KEYS = new Set(["ArrowLeft", "ArrowRight", "Space"]);

/** パラメーターのライブ値から毎フレームの設定を組み立てる */
function currentConfig(): CanvasGameConfig {
  return {
    fieldWidth: FIELD_WIDTH,
    fieldHeight: FIELD_HEIGHT,
    ...canvasParams.values,
  };
}

export function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const input = createInputManager();
    let rng = createRng(Date.now() >>> 0);
    let state = createInitialState(currentConfig());

    const start = (seed?: number) => {
      // 押しっぱなしのキーが持ち越されると同一シードでも結果が変わるため入力もリセットする
      input.reset();
      rng = createRng(seed ?? Date.now() >>> 0);
      state = createInitialState(currentConfig());
      state.status = "playing";
      debugEvent("start", { seed: rng.seed });
    };

    const loop = createGameLoop({
      update: (dtMs) => {
        if (input.consumePressed("Space") && state.status !== "playing") {
          start();
        }
        const events = updateGame(
          state,
          { left: input.isDown("ArrowLeft"), right: input.isDown("ArrowRight") },
          dtMs,
          rng,
          currentConfig(),
        );
        for (const event of events) {
          debugEvent(event.type, { score: event.score });
        }
      },
      render: () => drawGame(ctx, state),
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (KEYS.has(event.code)) {
        event.preventDefault();
        input.press(event.code);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (KEYS.has(event.code)) input.release(event.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // AI テストプレイの窓口: 状態取得・シード付きリスタート・入力注入を差し込む
    const unregister = registerGame({
      loop,
      getState: () => JSON.parse(JSON.stringify(state)) as unknown,
      restart: (seed) => start(seed),
      sendInput: ({ type, button }) => {
        if (type === "press") input.press(button);
        else input.release(button);
      },
    });

    loop.start();
    return () => {
      loop.stop();
      unregister();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div
      data-testid="game-root"
      className={css({ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "480px" })}
    >
      <canvas
        data-testid="game-canvas"
        ref={canvasRef}
        width={FIELD_WIDTH}
        height={FIELD_HEIGHT}
        className={css({ borderRadius: "card", maxWidth: "100%" })}
      />
      <p className={css({ color: "textMuted", fontSize: "sm" })}>
        ←→ で移動、Space で開始/リトライ。落ちてくるボールを避け続けるとスコアが増えます。
      </p>
    </div>
  );
}
