import { Hono } from "hono";

const EMPTY_MESSAGE = "请输入动态内容。";
const SUCCESS_MESSAGE = "发布成功。";
const NOT_FOUND_MESSAGE = "动态不存在。";
const INVALID_PARAMS_MESSAGE = "参数无效。";

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
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    };

    posts.unshift(post);

    return c.json({ message: SUCCESS_MESSAGE, post }, 201);
  });

  app.post("/api/posts/:id/like", async (c) => {
    const post = findPost(posts, c.req.param("id"));
    if (!post) {
      return c.json({ message: NOT_FOUND_MESSAGE }, 404);
    }

    const body = await readJson(c);
    if (typeof body.liked !== "boolean") {
      return c.json({ message: INVALID_PARAMS_MESSAGE }, 400);
    }

    if (body.liked && !post.liked) {
      post.likeCount += 1;
    }

    if (!body.liked && post.liked) {
      post.likeCount = Math.max(0, post.likeCount - 1);
    }

    post.liked = body.liked;

    return c.json({ message: "操作成功。", post });
  });

  app.post("/api/posts/:id/favorite", async (c) => {
    const post = findPost(posts, c.req.param("id"));
    if (!post) {
      return c.json({ message: NOT_FOUND_MESSAGE }, 404);
    }

    const body = await readJson(c);
    if (typeof body.favorited !== "boolean") {
      return c.json({ message: INVALID_PARAMS_MESSAGE }, 400);
    }

    if (body.favorited && !post.favorited) {
      post.favoriteCount += 1;
    }

    if (!body.favorited && post.favorited) {
      post.favoriteCount = Math.max(0, post.favoriteCount - 1);
    }

    post.favorited = body.favorited;

    return c.json({ message: "操作成功。", post });
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

function findPost(posts, id) {
  return posts.find((post) => post.id === id);
}

function createPostId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
