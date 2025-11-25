import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte"; 
import { viteSingleFile } from "vite-plugin-singlefile";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(), 
    viteSingleFile(),
    tailwindcss(),
  ],
  server: {
    port: 8081,
  },
  build: {
    outDir: "../public/webview-ui",
  },
});
