import { describe, expect, it } from "vitest";
import { createInputManager } from "./input.js";

describe("createInputManager", () => {
  it("press / release で isDown が切り替わる", () => {
    const input = createInputManager();
    expect(input.isDown("ArrowLeft")).toBe(false);

    input.press("ArrowLeft");
    expect(input.isDown("ArrowLeft")).toBe(true);

    input.release("ArrowLeft");
    expect(input.isDown("ArrowLeft")).toBe(false);
  });

  it("consumePressed は 1 回押しにつき 1 回だけ true", () => {
    const input = createInputManager();
    input.press("Space");
    expect(input.consumePressed("Space")).toBe(true);
    expect(input.consumePressed("Space")).toBe(false);

    // キーリピート（押しっぱなしの連続 press）では再発火しない
    input.press("Space");
    expect(input.consumePressed("Space")).toBe(false);

    input.release("Space");
    input.press("Space");
    expect(input.consumePressed("Space")).toBe(true);
  });

  it("reset で全状態がクリアされる", () => {
    const input = createInputManager();
    input.press("KeyA");
    input.press("KeyB");
    input.reset();
    expect(input.isDown("KeyA")).toBe(false);
    expect(input.consumePressed("KeyB")).toBe(false);
  });
});
