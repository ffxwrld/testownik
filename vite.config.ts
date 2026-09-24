import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    checker({ typescript: true })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: 'es2019',
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('katex')) {
              return 'vendor-katex';
            }
            if (id.includes('react-big-calendar') || id.includes('date-fns')) {
              return 'vendor-calendar';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (
              id.includes('react-markdown') ||
              id.includes('remark-math') ||
              id.includes('rehype-katex') ||
              id.includes('micromark') ||
              id.includes('unist') ||
              id.includes('mdast') ||
              id.includes('hast')
            ) {
              return 'vendor-markdown';
            }
            if (id.includes('jszip')) {
              return 'vendor-jszip';
            }
            if (id.includes('react') || id.includes('wouter') || id.includes('swr')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
  base: "./",
});
