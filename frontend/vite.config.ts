import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Env-driven base path: "/" for local dev / Owner Mode, "/<repo>/" for GitHub Pages (set in CI).
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  build: {
    // The lazily-loaded mock-exam feature bundles recharts + katex + the Gemini SDK; it's one shared
    // chunk across all six exams, loaded only when an exam page is opened.
    chunkSizeWarningLimit: 1200,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
