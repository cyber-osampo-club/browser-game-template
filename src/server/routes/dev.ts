import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

/**
 * 開発時専用 API（/api/dev/*）。
 *
 * main.ts が NODE_ENV !== "production" のときだけマウントする。
 * ここで受けたフィードバック・スナップショットはローカルファイルに保存され、
 * AI エージェントが次のセッションで読んで対応する（AGENTS.md の運用規約を参照）。
 *
 * セキュリティ: 保存先は feedback/ 配下に固定し、ファイル名はサーバー側で
 * 生成する（クライアント入力をパスに使わない）。ボディは 256KB まで。
 */

const FEEDBACK_CATEGORIES = ["bug", "balance", "ux", "idea"] as const;
type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

interface FeedbackPayload {
  category: FeedbackCategory;
  message: string;
  route?: string;
  snapshot?: unknown;
}

function isFeedbackPayload(body: unknown): body is FeedbackPayload {
  if (typeof body !== "object" || body === null) return false;
  const { category, message, route } = body as Record<string, unknown>;
  return (
    typeof category === "string" &&
    (FEEDBACK_CATEGORIES as readonly string[]).includes(category) &&
    typeof message === "string" &&
    message.trim().length > 0 &&
    (route === undefined || typeof route === "string")
  );
}

function feedbackDir(): string {
  return path.resolve(process.env.FEEDBACK_DIR ?? "feedback");
}

/** ISO 時刻をファイル名に使える形式へ（例: 2026-07-07T12-34-56-789Z） */
function timestampSlug(date: Date): string {
  return date.toISOString().replaceAll(":", "-").replace(".", "-");
}

export const devRoutes = new Hono()
  .use("*", bodyLimit({ maxSize: 256 * 1024 }))
  .post("/feedback", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "JSON ボディが必要です" }, 400);
    }
    if (!isFeedbackPayload(body)) {
      return c.json(
        { error: `category（${FEEDBACK_CATEGORIES.join(" | ")}）と message が必要です` },
        400,
      );
    }

    const now = new Date();
    const fileName = `${timestampSlug(now)}_${body.category}.md`;
    const dir = feedbackDir();
    await mkdir(dir, { recursive: true });

    const frontmatter = [
      "---",
      `category: ${body.category}`,
      `created: ${now.toISOString()}`,
      `route: ${body.route ?? "unknown"}`,
      "status: open",
      "---",
    ].join("\n");
    const snapshotSection =
      body.snapshot === undefined
        ? ""
        : `\n\n## snapshot\n\n\`\`\`json\n${JSON.stringify(body.snapshot, null, 2)}\n\`\`\`\n`;
    await writeFile(
      path.join(dir, fileName),
      `${frontmatter}\n\n${body.message.trim()}\n${snapshotSection}`,
    );

    return c.json({ saved: path.join("feedback", fileName) }, 201);
  })
  .post("/snapshot", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "JSON ボディが必要です" }, 400);
    }
    if (typeof body !== "object" || body === null) {
      return c.json({ error: "オブジェクトが必要です" }, 400);
    }

    const now = new Date();
    const fileName = `${timestampSlug(now)}.json`;
    const dir = path.join(feedbackDir(), "snapshots");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), JSON.stringify(body, null, 2));

    return c.json({ saved: path.join("feedback", "snapshots", fileName) }, 201);
  });

export type DevRoutesType = typeof devRoutes;
