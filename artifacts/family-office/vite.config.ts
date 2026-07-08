import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { apiMiddlewarePlugin } from "./vite-api-plugin.mjs";

const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    apiMiddlewarePlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    fs: {
      strict: true,
    },
    // Local dev only: proxy /api to the standalone api-dev-server (scripts/api-dev-server.mjs).
    // On Vercel, /api/* is served natively by the serverless functions — this proxy is ignored.
    proxy: {
      "/api": {
        target: process.env.API_DEV_TARGET || "http://localhost:4001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
  },
});
