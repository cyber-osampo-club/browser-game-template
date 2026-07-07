import { describe, expect, it } from "vitest";
import { defineParams, exportParamDiffs, listParamGroups } from "./params";

describe("defineParams", () => {
  it("デフォルト値で初期化され、set で更新・subscribe で通知される", () => {
    const params = defineParams("test-basic", {
      speed: { kind: "number", label: "速度", default: 100, min: 0, max: 200, step: 10 },
      hardMode: { kind: "boolean", label: "ハード", default: false },
    });

    expect(params.values.speed).toBe(100);
    expect(params.values.hardMode).toBe(false);

    let notified = 0;
    const unsubscribe = params.subscribe(() => {
      notified += 1;
    });
    params.set("speed", 150);
    expect(params.values.speed).toBe(150);
    expect(notified).toBe(1);
    unsubscribe();
  });

  it("number は min/max にクランプされる", () => {
    const params = defineParams("test-clamp", {
      speed: { kind: "number", label: "速度", default: 100, min: 0, max: 200 },
    });
    params.set("speed", 9999);
    expect(params.values.speed).toBe(200);
    params.set("speed", -5);
    expect(params.values.speed).toBe(0);
  });

  it("setUnchecked は不正値を拒否して false を返す", () => {
    const params = defineParams("test-unchecked", {
      speed: { kind: "number", label: "速度", default: 100, min: 0, max: 200 },
      mode: { kind: "select", label: "モード", default: "a", options: ["a", "b"] },
      tint: { kind: "color", label: "色", default: "#ff0000" },
    });

    expect(params.setUnchecked("speed", "fast")).toBe(false);
    expect(params.setUnchecked("speed", Number.NaN)).toBe(false);
    expect(params.setUnchecked("mode", "c")).toBe(false);
    expect(params.setUnchecked("tint", "red")).toBe(false);
    expect(params.setUnchecked("unknown", 1)).toBe(false);

    expect(params.setUnchecked("mode", "b")).toBe(true);
    expect(params.values.mode).toBe("b");
    expect(params.setUnchecked("tint", "#00ff00")).toBe(true);
  });

  it("diff は変更分のみ、reset で全て戻る", () => {
    const params = defineParams("test-diff", {
      speed: { kind: "number", label: "速度", default: 100, min: 0, max: 200 },
      hardMode: { kind: "boolean", label: "ハード", default: false },
    });

    expect(params.diff()).toEqual({});
    params.set("speed", 120);
    expect(params.diff()).toEqual({ speed: 120 });

    params.reset();
    expect(params.diff()).toEqual({});
    expect(params.values.speed).toBe(100);
  });

  it("同じ id の二重定義は既存グループを返す（HMR 対策）", () => {
    const a = defineParams("test-dup", {
      speed: { kind: "number", label: "速度", default: 1, min: 0, max: 10 },
    });
    a.set("speed", 5);
    const b = defineParams("test-dup", {
      speed: { kind: "number", label: "速度", default: 1, min: 0, max: 10 },
    });
    expect(b.values.speed).toBe(5);
    expect(listParamGroups().filter((g) => g.id === "test-dup")).toHaveLength(1);
  });

  it("exportParamDiffs は変更のあるグループだけ含む", () => {
    defineParams("test-export-untouched", {
      x: { kind: "number", label: "x", default: 1, min: 0, max: 10 },
    });
    const touched = defineParams("test-export-touched", {
      y: { kind: "number", label: "y", default: 1, min: 0, max: 10 },
    });
    touched.set("y", 2);

    const diffs = exportParamDiffs();
    expect(diffs["test-export-touched"]).toEqual({ y: 2 });
    expect(diffs["test-export-untouched"]).toBeUndefined();
  });
});
