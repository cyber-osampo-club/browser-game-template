import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import "./styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root が見つかりません");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// デバッグ機構（パネル + window.__GAME_DEBUG__）は開発時のみ。
// dynamic import なので本番バンドルには src/client/debug/ のパネル系チャンクが含まれない。
if (import.meta.env.DEV) {
  void import("./debug").then((debug) => debug.initDebug());
}
