/**
 * 計算クイズの純粋ロジック（出題・採点）。DOM 非依存でテスト可能。
 */

import type { Rng } from "../../../game/rng";

export type Level = "easy" | "normal" | "hard";
export const LEVELS: readonly Level[] = ["easy", "normal", "hard"];
export const LEVEL_LABELS: Record<Level, string> = {
  easy: "かんたん",
  normal: "ふつう",
  hard: "むずかしい",
};

export interface Question {
  a: number;
  b: number;
  op: "+" | "-" | "×";
  answer: number;
}

export function generateQuestion(rng: Rng, level: Level): Question {
  switch (level) {
    case "easy": {
      const a = 1 + rng.int(9);
      const b = 1 + rng.int(9);
      return { a, b, op: "+", answer: a + b };
    }
    case "normal": {
      const a = 1 + rng.int(20);
      const b = 1 + rng.int(20);
      if (rng.next() < 0.5) return { a, b, op: "+", answer: a + b };
      // 引き算は答えが負にならないよう大きい方から引く
      const [large, small] = a >= b ? [a, b] : [b, a];
      return { a: large, b: small, op: "-", answer: large - small };
    }
    case "hard": {
      const a = 2 + rng.int(11);
      const b = 2 + rng.int(11);
      return { a, b, op: "×", answer: a * b };
    }
  }
}

export function formatQuestion(question: Question): string {
  return `${question.a} ${question.op} ${question.b} = ?`;
}

export function isCorrect(question: Question, value: number): boolean {
  return question.answer === value;
}

export const SCORE_PER_CORRECT = 100;
