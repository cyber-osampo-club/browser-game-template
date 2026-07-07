import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActiveGame } from "../../debug/registry";
import { CanvasGame } from "./CanvasGame";
import type { CanvasGameState } from "./logic";

// happy-dom には canvas 2D コンテキストがないためスタブする（描画呼び出しの受け皿）
function stubCanvasContext() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    return {
      canvas: this,
      fillStyle: "",
      font: "",
      textAlign: "left",
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  });
}

beforeEach(() => {
  stubCanvasContext();
});

describe("CanvasGame", () => {
  it("マウントすると AI テストプレイ用フックが登録され、アンマウントで解除される", () => {
    const { unmount } = render(<CanvasGame />);
    const game = getActiveGame();
    expect(game).toBeDefined();
    expect(game?.loop).toBeDefined();

    unmount();
    expect(getActiveGame()).toBeUndefined();
  });

  it("シード固定 + 入力注入で決定論的にテストプレイできる（__GAME_DEBUG__ と同じ経路）", () => {
    const playRun = () => {
      const { unmount } = render(<CanvasGame />);
      const game = getActiveGame();
      if (!game?.loop || !game.restart || !game.sendInput) {
        throw new Error("テストプレイ用フックが不足しています");
      }

      game.loop.pause();
      game.restart(42);

      // 左へ 30 フレーム移動 → 右へ 30 フレーム移動
      game.sendInput({ type: "press", button: "ArrowLeft" });
      game.loop.step(30);
      game.sendInput({ type: "release", button: "ArrowLeft" });
      game.sendInput({ type: "press", button: "ArrowRight" });
      game.loop.step(30);
      game.sendInput({ type: "release", button: "ArrowRight" });
      game.loop.step(60);

      const state = game.getState() as CanvasGameState;
      unmount();
      return state;
    };

    const first = playRun();
    const second = playRun();

    expect(first.status).toBe("playing");
    expect(first.elapsedMs).toBeGreaterThan(0);
    // 同じシード・同じ入力列なら状態が完全一致する
    expect(second).toEqual(first);
  });

  it("restart は押しっぱなしの入力をリセットする（決定論の担保）", () => {
    const { unmount } = render(<CanvasGame />);
    const game = getActiveGame();
    if (!game?.loop || !game.restart || !game.sendInput) throw new Error("フック不足");

    game.loop.pause();

    // キーを押したまま restart しても、離してから restart した場合と同じ結果になる
    game.sendInput({ type: "press", button: "ArrowLeft" });
    game.restart(42);
    game.loop.step(60);
    const withHeldKey = game.getState() as CanvasGameState;

    game.restart(42);
    game.loop.step(60);
    const withoutHeldKey = game.getState() as CanvasGameState;

    expect(withHeldKey).toEqual(withoutHeldKey);
    unmount();
  });

  it("Space の合成入力でゲームが開始する", () => {
    const { unmount } = render(<CanvasGame />);
    const game = getActiveGame();
    if (!game?.loop || !game.sendInput) throw new Error("フック不足");

    game.loop.pause();
    expect((game.getState() as CanvasGameState).status).toBe("ready");

    game.sendInput({ type: "press", button: "Space" });
    game.loop.step(1);
    expect((game.getState() as CanvasGameState).status).toBe("playing");
    unmount();
  });
});
