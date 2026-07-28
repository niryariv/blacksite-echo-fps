import { defineConfig } from "vite";
import { mkdir, writeFile } from "node:fs/promises";

function sitesStaticWorker() {
  return {
    name: "sites-static-worker",
    apply: "build",
    async closeBundle() {
      await mkdir("dist/server", { recursive: true });
      await writeFile(
        "dist/server/index.js",
        `export default {
  async fetch(request, env) {
    if (env?.ASSETS?.fetch) return env.ASSETS.fetch(request);
    return new Response("Static asset binding unavailable", { status: 503 });
  }
};
`,
      );
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [sitesStaticWorker()],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
        },
      },
    },
  },
});
