import { serve } from "@hono/node-server";
import { app } from "./app.js";

const hostname = process.env.API_HOST ?? process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

serve({ fetch: app.fetch, hostname, port }, (info) => {
  console.log(`API server listening on http://${hostname}:${info.port}`);
});
