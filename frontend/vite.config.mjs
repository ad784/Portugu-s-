import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: frontendRoot,
  plugins: [reactRouter()],
  publicDir: "public",
  server: {
    proxy: {
      "/api": "http://localhost:3000"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
