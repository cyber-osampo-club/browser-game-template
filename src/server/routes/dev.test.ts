import { mkdtemp, readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { devRoutes } from "./dev.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "feedback-test-"));
  process.env.FEEDBACK_DIR = tmpDir;
});

afterEach(() => {
  delete process.env.FEEDBACK_DIR;
});

describe("POST /feedback", () => {
  it("frontmatter 付き Markdown として保存される", async () => {
    const res = await devRoutes.request("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "balance",
        message: "敵の弾が速すぎる",
        route: "/games/canvas",
        snapshot: { params: { physics: { timeScale: 0.8 } } },
      }),
    });
    expect(res.status).toBe(201);

    const files = await readdir(tmpDir);
    expect(files).toHaveLength(1);
    const fileName = files[0];
    expect(fileName).toMatch(/_balance\.md$/);

    const content = await readFile(path.join(tmpDir, fileName ?? ""), "utf8");
    expect(content).toContain("category: balance");
    expect(content).toContain("status: open");
    expect(content).toContain("route: /games/canvas");
    expect(content).toContain("敵の弾が速すぎる");
    expect(content).toContain('"timeScale": 0.8');
  });

  it("snapshot なしでも保存できる", async () => {
    const res = await devRoutes.request("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "idea", message: "コンボシステムがほしい" }),
    });
    expect(res.status).toBe(201);
    const files = await readdir(tmpDir);
    const content = await readFile(path.join(tmpDir, files[0] ?? ""), "utf8");
    expect(content).not.toContain("## snapshot");
  });

  it("不正なカテゴリ・空メッセージ・非JSONは 400", async () => {
    const badCategory = await devRoutes.request("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "other", message: "x" }),
    });
    expect(badCategory.status).toBe(400);

    const emptyMessage = await devRoutes.request("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "bug", message: "  " }),
    });
    expect(emptyMessage.status).toBe(400);

    const notJson = await devRoutes.request("/feedback", { method: "POST", body: "plain" });
    expect(notJson.status).toBe(400);
  });

  it("256KB を超えるボディは 413", async () => {
    const res = await devRoutes.request("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "bug", message: "a".repeat(300 * 1024) }),
    });
    expect(res.status).toBe(413);
  });
});

describe("POST /snapshot", () => {
  it("snapshots/ に JSON として保存される", async () => {
    const res = await devRoutes.request("/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params: { physics: { gravity: 20 } }, tokens: {} }),
    });
    expect(res.status).toBe(201);

    const files = await readdir(path.join(tmpDir, "snapshots"));
    expect(files).toHaveLength(1);
    const content = await readFile(path.join(tmpDir, "snapshots", files[0] ?? ""), "utf8");
    expect(JSON.parse(content)).toEqual({ params: { physics: { gravity: 20 } }, tokens: {} });
  });

  it("オブジェクト以外は 400", async () => {
    const res = await devRoutes.request("/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("text"),
    });
    expect(res.status).toBe(400);
  });
});
