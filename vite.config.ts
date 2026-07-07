import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // index.html を src/client に置き、リポジトリ直下を散らかさない
  root: "src/client",
  publicDir: "../../public",
  plugins: [react()],
  resolve: {
    alias: {
      "styled-system": new URL("./styled-system", import.meta.url).pathname,
    },
  },
  server: {
    host: true, // devcontainer / Docker 内からのアクセス用
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
    sourcemap: true,
  },
});
