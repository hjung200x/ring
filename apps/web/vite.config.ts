import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/ring/" : "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/internal": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/ring/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ring/, ""),
      },
      "/ring/internal": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ring/, ""),
      },
    },
  },
}));
