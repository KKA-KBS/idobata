import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // ステージングは ALB が /admin だけをこの画面へ送る。ローカル開発はルートのまま。
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5175,
    host: "0.0.0.0",
    allowedHosts:
      process.env.VITE_ADMIN_FRONTEND_ALLOWED_HOSTS?.split(",") || [],
  },
});
