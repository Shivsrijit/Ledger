import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://ledger-u9p6.onrender.com",
        // target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});
