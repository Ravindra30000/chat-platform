// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ["src/**/*"],
      exclude: ["src/**/*.test.*", "src/**/*.spec.*", "src/**/*.stories.*"],
      rollupTypes: true,
    }),
    // Bundle analyzer in build mode
    mode === "production" &&
      visualizer({
        filename: "dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "TechSurfChatSDK",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "esm" : format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "index.css";
          }
          return assetInfo.name || "[name].[ext]";
        },
      },
    },
    cssCodeSplit: false,
    minify: mode === "production" ? "terser" : false,
    sourcemap: true,
    target: "es2018",
    reportCompressedSize: true,
  },

  css: {
    modules: false,
    postcss: {},
  },

  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  // Development server for testing
  server: {
    port: 5173,
    open: false,
  },
}));
