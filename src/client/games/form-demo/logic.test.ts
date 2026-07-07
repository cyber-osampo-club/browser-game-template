import { describe, expect, it } from "vitest";
import { createRng } from "../../../game/rng";
import { formatQuestion, generateQuestion, isCorrect, LEVELS } from "./logic";

describe("generateQuestion", () => {
  it("easy は 1 桁の足し算", () => {
    const rng = createRng(1);
    for (let i = 0; i < 100; i += 1) {
      const q = generateQuestion(rng, "easy");
      expect(q.op).toBe("+");
      expect(q.a).toBeGreaterThanOrEqual(1);
      expect(q.a).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(q.a + q.b);
    }
  });

  it("normal の引き算は答えが負にならない", () => {
    const rng = createRng(2);
    for (let i = 0; i < 200; i += 1) {
      const q = generateQuestion(rng, "normal");
      expect(q.answer).toBeGreaterThanOrEqual(0);
      if (q.op === "-") expect(q.answer).toBe(q.a - q.b);
    }
  });

  it("hard は掛け算", () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i += 1) {
      const q = generateQuestion(rng, "hard");
      expect(q.op).toBe("×");
      expect(q.answer).toBe(q.a * q.b);
    }
  });

  it("同じシードなら同じ問題列になる（決定論）", () => {
    for (const level of LEVELS) {
      const a = createRng(42);
      const b = createRng(42);
      const seqA = Array.from({ length: 10 }, () => generateQuestion(a, level));
      const seqB = Array.from({ length: 10 }, () => generateQuestion(b, level));
      expect(seqA).toEqual(seqB);
    }
  });
});

describe("isCorrect / formatQuestion", () => {
  it("正誤判定とフォーマット", () => {
    const q = { a: 3, b: 4, op: "+", answer: 7 } as const;
    expect(isCorrect(q, 7)).toBe(true);
    expect(isCorrect(q, 8)).toBe(false);
    expect(formatQuestion(q)).toBe("3 + 4 = ?");
  });
});
