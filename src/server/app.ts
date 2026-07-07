import { Hono } from "hono";

/**
 * Hono アプリ本体。listen は main.ts が行う分離構成
 * （テストは app.request() でサーバー起動なしに実行できる）。
 */

export interface ScoreEntry {
  name: string;
  score: number;
  createdAt: string;
}

const MAX_NAME_LENGTH = 24;
const MAX_SCORES = 100;

/** スコアボード（インメモリのデモ実装。永続化する場合はここを DB 等に差し替える） */
const scores: ScoreEntry[] = [];

function isValidScorePayload(body: unknown): body is { name: string; score: number } {
  if (typeof body !== "object" || body === null) return false;
  const { name, score } = body as Record<string, unknown>;
  if (typeof name !== "string" || typeof score !== "number" || !Number.isFinite(score)) {
    return false;
  }
  // 保存されるのは trim 後の値なので、長さ検証も trim 後に対して行う
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH;
}

export const app = new Hono()
  .get("/api/health", (c) => c.json({ ok: true }))
  .get("/api/scores", (c) => {
    const top = [...scores].sort((a, b) => b.score - a.score).slice(0, 10);
    return c.json({ scores: top });
  })
  .post("/api/scores", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "JSON ボディが必要です" }, 400);
    }
    if (!isValidScorePayload(body)) {
      return c.json({ error: "name（24文字以内）と score（数値）が必要です" }, 400);
    }
    const entry: ScoreEntry = {
      name: body.name.trim(),
      score: body.score,
      createdAt: new Date().toISOString(),
    };
    scores.push(entry);
    if (scores.length > MAX_SCORES) {
      scores.sort((a, b) => b.score - a.score).length = MAX_SCORES;
    }
    return c.json({ entry }, 201);
  });

export type AppType = typeof app;
