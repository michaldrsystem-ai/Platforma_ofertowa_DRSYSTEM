// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss,
// tsConfigPaths and nitro. Do NOT add them manually (duplicate plugins break the app).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Wdrożenie na Vercel (domyślnie konfiguracja celuje w Cloudflare).
  nitro: { preset: "vercel" },
  tanstackStart: {
    server: { entry: "server" },
  },
});
