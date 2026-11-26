import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: frontendRoot,
  plugins: [reactRouter()],
  publicDir: "public",
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    fs: {
      // Dependencies and shared modules live alongside the frontend directory.
      allow: [resolve(frontendRoot, "..")],
    },
    proxy: {
      "/api": "http://127.0.0.1:3000",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
