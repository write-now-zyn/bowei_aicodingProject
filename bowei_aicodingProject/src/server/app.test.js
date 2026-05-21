import { describe, expect, it } from "vitest";
import { createApp } from "./app";

function postJson(app, body) {
  return app.request("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createPost(app, content = "第一条动态") {
  const response = await postJson(app, { content });
  const body = await response.json();
  return body.post;
}

function likePost(app, id, body) {
  return app.request(`/api/posts/${id}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function favoritePost(app, id, body) {
  return app.request(`/api/posts/${id}/favorite`, {
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
    expect(body.post).toMatchObject({
      content: "第一条动态",
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    });
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

  it("sets, repeats, and cancels like idempotently", async () => {
    const app = createApp();
    const post = await createPost(app);

    const likedResponse = await likePost(app, post.id, { liked: true });
    expect(likedResponse.status).toBe(200);
    const likedBody = await likedResponse.json();
    expect(likedBody).toMatchObject({
      message: "操作成功。",
      post: { liked: true, likeCount: 1 },
    });

    const repeatedResponse = await likePost(app, post.id, { liked: true });
    expect(repeatedResponse.status).toBe(200);
    const repeatedBody = await repeatedResponse.json();
    expect(repeatedBody.post).toMatchObject({ liked: true, likeCount: 1 });

    const canceledResponse = await likePost(app, post.id, { liked: false });
    expect(canceledResponse.status).toBe(200);
    const canceledBody = await canceledResponse.json();
    expect(canceledBody.post).toMatchObject({ liked: false, likeCount: 0 });

    const repeatedCancelResponse = await likePost(app, post.id, { liked: false });
    expect(repeatedCancelResponse.status).toBe(200);
    const repeatedCancelBody = await repeatedCancelResponse.json();
    expect(repeatedCancelBody.post).toMatchObject({
      liked: false,
      likeCount: 0,
    });
  });

  it("sets, repeats, and cancels favorite idempotently", async () => {
    const app = createApp();
    const post = await createPost(app);

    const favoritedResponse = await favoritePost(app, post.id, {
      favorited: true,
    });
    expect(favoritedResponse.status).toBe(200);
    const favoritedBody = await favoritedResponse.json();
    expect(favoritedBody).toMatchObject({
      message: "操作成功。",
      post: { favorited: true, favoriteCount: 1 },
    });

    const repeatedResponse = await favoritePost(app, post.id, {
      favorited: true,
    });
    expect(repeatedResponse.status).toBe(200);
    const repeatedBody = await repeatedResponse.json();
    expect(repeatedBody.post).toMatchObject({
      favorited: true,
      favoriteCount: 1,
    });

    const canceledResponse = await favoritePost(app, post.id, {
      favorited: false,
    });
    expect(canceledResponse.status).toBe(200);
    const canceledBody = await canceledResponse.json();
    expect(canceledBody.post).toMatchObject({
      favorited: false,
      favoriteCount: 0,
    });

    const repeatedCancelResponse = await favoritePost(app, post.id, {
      favorited: false,
    });
    expect(repeatedCancelResponse.status).toBe(200);
    const repeatedCancelBody = await repeatedCancelResponse.json();
    expect(repeatedCancelBody.post).toMatchObject({
      favorited: false,
      favoriteCount: 0,
    });
  });

  it("returns 404 when setting like or favorite for a missing post", async () => {
    const app = createApp();

    const likeResponse = await likePost(app, "missing-id", { liked: true });
    expect(likeResponse.status).toBe(404);
    expect(await likeResponse.json()).toEqual({ message: "动态不存在。" });

    const favoriteResponse = await favoritePost(app, "missing-id", {
      favorited: true,
    });
    expect(favoriteResponse.status).toBe(404);
    expect(await favoriteResponse.json()).toEqual({ message: "动态不存在。" });
  });

  it("returns 400 for invalid like or favorite payloads", async () => {
    const app = createApp();
    const post = await createPost(app);

    const missingLikeResponse = await likePost(app, post.id, {});
    expect(missingLikeResponse.status).toBe(400);
    expect(await missingLikeResponse.json()).toEqual({ message: "参数无效。" });

    const invalidLikeResponse = await likePost(app, post.id, { liked: "true" });
    expect(invalidLikeResponse.status).toBe(400);
    expect(await invalidLikeResponse.json()).toEqual({ message: "参数无效。" });

    const missingFavoriteResponse = await favoritePost(app, post.id, {});
    expect(missingFavoriteResponse.status).toBe(400);
    expect(await missingFavoriteResponse.json()).toEqual({
      message: "参数无效。",
    });

    const invalidFavoriteResponse = await favoritePost(app, post.id, {
      favorited: "true",
    });
    expect(invalidFavoriteResponse.status).toBe(400);
    expect(await invalidFavoriteResponse.json()).toEqual({
      message: "参数无效。",
    });
  });

  it("returns updated like and favorite state from GET posts", async () => {
    const app = createApp();
    const post = await createPost(app);

    await likePost(app, post.id, { liked: true });
    await favoritePost(app, post.id, { favorited: true });

    const response = await app.request("/api/posts");
    const body = await response.json();

    expect(body.posts[0]).toMatchObject({
      id: post.id,
      liked: true,
      favorited: true,
      likeCount: 1,
      favoriteCount: 1,
    });
  });
});
