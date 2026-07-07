import { afterEach, describe, expect, it, vi } from "vitest";
import { buildIssueUrl, configuredRepoUrl, MAX_URL_LENGTH } from "./issue-url";
import type { Snapshot } from "./snapshot";

const snapshot: Snapshot = {
  createdAt: "2026-07-07T00:00:00.000Z",
  route: "/games/canvas",
  gameState: { score: 120 },
  params: { "canvas-demo": { obstacleSpeed: 240 } },
  tokens: {},
  recentEvents: [],
  userAgent: "test-agent",
  viewport: { width: 1280, height: 720 },
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildIssueUrl", () => {
  it("bug テンプレートのフィールドへ事前入力する URL を組み立てる", () => {
    const result = buildIssueUrl("https://github.com/owner/repo/", {
      template: "bug",
      title: "障害物をすり抜ける",
      body: "端で連打すると衝突しない",
      snapshot,
    });

    expect(result.bodyOmitted).toBe(false);
    const url = new URL(result.url);
    expect(url.origin + url.pathname).toBe("https://github.com/owner/repo/issues/new");
    expect(url.searchParams.get("template")).toBe("bug.yml");
    expect(url.searchParams.get("title")).toBe("障害物をすり抜ける");
    expect(url.searchParams.get("current-behavior")).toContain("端で連打すると衝突しない");
    expect(url.searchParams.get("current-behavior")).toContain('"score": 120');
    expect(url.searchParams.get("environment")).toContain("route: /games/canvas");
  });

  it("enhancement テンプレートは purpose / reference へ割り当てる", () => {
    const result = buildIssueUrl("https://github.com/owner/repo", {
      template: "enhancement",
      title: "コンボがほしい",
      body: "連続回避でスコア倍率",
      snapshot,
    });
    const url = new URL(result.url);
    expect(url.searchParams.get("template")).toBe("enhancement.yml");
    expect(url.searchParams.get("purpose")).toBe("連続回避でスコア倍率");
    expect(url.searchParams.get("reference")).toContain("スナップショット");
  });

  it("configuredRepoUrl は github.com の owner/repo のみ受理し正規化する", () => {
    const cases: [string, string | undefined][] = [
      ["https://github.com/owner/repo", "https://github.com/owner/repo"],
      ["https://github.com/owner/repo/", "https://github.com/owner/repo"],
      ["https://github.com/owner/repo?x=1", undefined],
      ["https://github.com/owner/repo#frag", undefined],
      ["https://github.com/owner", undefined],
      ["https://github.com/owner/repo/issues", undefined],
      ["https://example.com/owner/repo", undefined],
      ["http://github.com/owner/repo", undefined],
      ["not-a-url", undefined],
    ];
    for (const [input, expected] of cases) {
      vi.stubEnv("VITE_REPO_URL", input);
      expect(configuredRepoUrl(), input).toBe(expected);
    }
  });

  it("URL が長すぎる場合は本文を省略して全文を返す", () => {
    const result = buildIssueUrl("https://github.com/owner/repo", {
      template: "bug",
      title: "長大な報告",
      body: "あ".repeat(MAX_URL_LENGTH),
      snapshot,
    });
    expect(result.bodyOmitted).toBe(true);
    expect(result.url.length).toBeLessThanOrEqual(MAX_URL_LENGTH);
    expect(result.fullText).toContain("あ".repeat(100));
  });
});
