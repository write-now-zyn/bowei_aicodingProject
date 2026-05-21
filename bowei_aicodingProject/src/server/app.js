import { Hono } from "hono";

const EMPTY_MESSAGE = "请输入动态内容。";
const SUCCESS_MESSAGE = "发布成功。";

export function createApp() {
  const app = new Hono();
  const posts = [];

  app.get("/api/posts", (c) => {
    return c.json({ posts });
  });

  app.post("/api/posts", async (c) => {
    const body = await readJson(c);
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return c.json({ message: EMPTY_MESSAGE }, 400);
    }

    const post = {
      id: createPostId(),
      content,
      createdAt: new Date().toISOString(),
    };

    posts.unshift(post);

    return c.json({ message: SUCCESS_MESSAGE, post }, 201);
  });

  return app;
}

export const app = createApp();

async function readJson(c) {
  try {
    return await c.req.json();
  } catch (error) {
    return {};
  }
}

function createPostId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
