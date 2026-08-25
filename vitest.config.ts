import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "styled-system": fileURLToPath(new URL("./styled-system", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      // CI では端末幅が 80 桁扱いになりファイル名が省略されるため、text だけ幅を広げる
      reporter: [["text", { maxCols: process.env.CI ? 200 : 0 }], "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.bench.ts",
        // エントリポイント・配線のみのファイル（ロジックを持たせない）
        "src/client/main.tsx",
        "src/client/router.tsx",
        "src/client/routes/**",
        "src/server/main.ts",
        // canvas 描画（happy-dom に 2D コンテキストがないため実ブラウザで確認する）
        "src/client/games/*/render.ts",
        // デバッグパネル UI（実ブラウザ + chrome-devtools MCP で確認する）
        "src/client/debug/panel/**",
        "src/client/debug/index.ts",
        "src/client/debug/agent-bridge.ts",
        "src/client/debug/tokens.ts",
        "src/client/debug/snapshot.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    benchmark: {
      include: ["src/**/*.bench.ts"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/{game,server}/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "client",
          environment: "happy-dom",
          include: ["src/client/**/*.test.{ts,tsx}"],
          setupFiles: ["./src/client/test-setup.ts"],
        },
      },
    ],
  },
});
