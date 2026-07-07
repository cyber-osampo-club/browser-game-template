import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { app } from "./app.js";

/**
 * サーバーエントリポイント。
 *
 * - 開発時: API のみ（:3000）。画面は Vite dev server（:5173）が配信し、
 *   /api を Vite の proxy がここへ中継する
 * - 本番時: dist/client（Vite ビルド成果物）の静的配信 + SPA フォールバックも担う。
 *   /api/dev/* はマウントされない
 */

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  const { devRoutes } = await import("./routes/dev.js");
  app.route("/api/dev", devRoutes);
  console.log("開発モード: /api/dev/*（フィードバック・スナップショット保存）を有効化");
}

if (isProduction) {
  app.use("*", serveStatic({ root: "./dist/client" }));
  app.get("*", serveStatic({ path: "./dist/client/index.html" }));
}

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`サーバー起動: http://localhost:${info.port}`);
});
