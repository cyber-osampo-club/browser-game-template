import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("GET /api/health", () => {
  it("ok を返す", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("/api/scores", () => {
  it("スコアを登録して上位から取得できる", async () => {
    const post = await app.request("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "テスター", score: 1200 }),
    });
    expect(post.status).toBe(201);
    const { entry } = (await post.json()) as { entry: { name: string; score: number } };
    expect(entry.name).toBe("テスター");

    const get = await app.request("/api/scores");
    expect(get.status).toBe(200);
    const { scores } = (await get.json()) as { scores: { score: number }[] };
    expect(scores.length).toBeGreaterThan(0);
    // 降順で返る
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    expect(scores).toEqual(sorted);
  });

  it("不正なボディは 400", async () => {
    const noBody = await app.request("/api/scores", { method: "POST" });
    expect(noBody.status).toBe(400);

    const invalid = await app.request("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", score: "high" }),
    });
    expect(invalid.status).toBe(400);

    const tooLong = await app.request("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(25), score: 1 }),
    });
    expect(tooLong.status).toBe(400);
  });
});
