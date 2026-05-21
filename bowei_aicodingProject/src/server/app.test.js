import { describe, expect, it } from "vitest";
import { createApp } from "./app";

function postJson(app, body) {
  return app.request("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("posts API", () => {
  it("returns posts wrapped in an object", async () => {
    const app = createApp();

    const response = await app.request("/api/posts");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ posts: [] });
  });

  it("rejects empty trimmed content", async () => {
    const app = createApp();

    const response = await postJson(app, { content: "   " });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "请输入动态内容。" });
  });

  it("creates a post with trimmed content", async () => {
    const app = createApp();

    const response = await postJson(app, { content: "  第一条动态  " });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.message).toBe("发布成功。");
    expect(body.post).toMatchObject({ content: "第一条动态" });
    expect(typeof body.post.id).toBe("string");
    expect(typeof body.post.createdAt).toBe("string");
  });

  it("keeps new posts at the top of the list", async () => {
    const app = createApp();

    await postJson(app, { content: "第一条动态" });
    const secondResponse = await postJson(app, { content: "第二条动态" });

    const { post } = await secondResponse.json();
    const listResponse = await app.request("/api/posts");
    const body = await listResponse.json();

    expect(body.posts).toHaveLength(2);
    expect(body.posts[0]).toEqual(post);
    expect(body.posts.map((item) => item.content)).toEqual([
      "第二条动态",
      "第一条动态",
    ]);
  });
});
