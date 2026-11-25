import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// الواجهة تنادي /api فقط، وVite يمررها للخادم (لا مشاكل CORS أثناء التطوير)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
});
