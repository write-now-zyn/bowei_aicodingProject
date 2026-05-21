import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const apiPort = process.env.API_PORT ?? process.env.PORT ?? "3000";
const apiHost = process.env.API_HOST ?? process.env.HOST ?? "127.0.0.1";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": `http://${apiHost}:${apiPort}`,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
