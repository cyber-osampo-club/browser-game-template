import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { CanvasGamePage } from "./routes/canvas-game";
import { FormGamePage } from "./routes/form-game";
import { HomePage } from "./routes/index";
import { RootLayout } from "./routes/root";

// code-based routing を採用（ルートが少ないうちは codegen 不要でシンプル）。
// ルートが増えて file-based に移行したくなったら @tanstack/router-plugin を導入する。

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const canvasGameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games/canvas",
  component: CanvasGamePage,
});

const formGameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games/form",
  component: FormGamePage,
});

const routeTree = rootRoute.addChildren([indexRoute, canvasGameRoute, formGameRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
