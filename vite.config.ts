import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { zipSourcePlugin } from "./scripts/zip-source";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()].filter(Boolean),
  optimizeDeps: {
    include: ["lucide-react", "react", "react-dom", "react-router-dom"],
  },
  build: {
    target: "esnext",
    sourcemap: false,
    minify: "esbuild",
    cssMinify: "esbuild",
    reportCompressedSize: false,
    chunkSizeWarningLimit: 3000,
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
    legalComments: "none",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
