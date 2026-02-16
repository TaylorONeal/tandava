import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("recharts")) return "charts-vendor";
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("@sentry")) return "sentry-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (
            id.includes("react-router") ||
            id.includes("@tanstack/react-query") ||
            id.includes("i18next")
          ) {
            return "app-vendor";
          }
          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
  plugins: [
    react(),
    // Upload source maps to Sentry on production builds (when configured)
    mode === "production" &&
      process.env.SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
