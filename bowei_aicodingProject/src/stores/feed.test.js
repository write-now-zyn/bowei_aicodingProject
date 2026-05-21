import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useFeedStore } from "./feed";

function mockJsonResponse(body, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("feed store", () => {
  let fetchMock;

  beforeEach(() => {
    vi.unstubAllGlobals();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setActivePinia(createPinia());
  });

  it("loads posts from the REST API", async () => {
    const apiPost = {
      id: "post-1",
      content: "已有动态",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    };
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ posts: [apiPost] }));

    const store = useFeedStore();
    const result = await store.loadPosts();

    expect(fetchMock).toHaveBeenCalledWith("/api/posts");
    expect(result).toEqual({ ok: true, posts: [apiPost] });
    expect(store.posts).toEqual([apiPost]);
    expect(store.postCount).toBe(1);
  });

  it("reports a load failure for invalid API data", async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ invalid: true }));

    const store = useFeedStore();
    const result = await store.loadPosts();

    expect(store.posts).toEqual([]);
    expect(store.postCount).toBe(0);
    expect(result).toEqual({ ok: false, message: "加载动态失败。" });
  });

  it("posts content to the REST API and adds the returned post to the top", async () => {
    const apiPost = {
      id: "post-1",
      content: "第一条动态",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    };
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(
        { message: "发布成功。", post: apiPost },
        { status: 201 },
      ),
    );
    const store = useFeedStore();

    const result = await store.addPost("  第一条动态  ");

    expect(fetchMock).toHaveBeenCalledWith("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "第一条动态" }),
    });
    expect(result).toEqual({ ok: true, message: "发布成功。", post: apiPost });
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0]).toEqual(apiPost);
  });

  it("rejects empty content without calling the API", async () => {
    const store = useFeedStore();

    const result = await store.addPost("   ");

    expect(result).toEqual({ ok: false, message: "请输入动态内容。" });
    expect(store.posts).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports the API error message without adding a post", async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({ message: "内容过长。" }, { ok: false, status: 400 }),
    );
    const store = useFeedStore();

    const result = await store.addPost("无法保存的动态");

    expect(result).toEqual({ ok: false, message: "内容过长。" });
    expect(store.posts).toEqual([]);
  });

  it("reports a network failure without adding a post", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const store = useFeedStore();

    const result = await store.addPost("网络失败的动态");

    expect(result).toEqual({ ok: false, message: "发布失败，请稍后重试。" });
    expect(store.posts).toEqual([]);
  });

  it("posts an explicit liked boolean and replaces the matching post", async () => {
    const originalPost = {
      id: "post-1",
      content: "已有动态",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    };
    const updatedPost = {
      ...originalPost,
      liked: true,
      likeCount: 1,
    };
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ post: updatedPost }));
    const store = useFeedStore();
    store.posts = [originalPost];

    const result = await store.setPostLike("post-1", true);

    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked: true }),
    });
    expect(result).toEqual({ ok: true, post: updatedPost });
    expect(store.posts).toEqual([updatedPost]);
  });

  it("posts an explicit favorited boolean and replaces the matching post", async () => {
    const originalPost = {
      id: "post-1",
      content: "已有动态",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      favorited: true,
      likeCount: 0,
      favoriteCount: 1,
    };
    const updatedPost = {
      ...originalPost,
      favorited: false,
      favoriteCount: 0,
    };
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ post: updatedPost }));
    const store = useFeedStore();
    store.posts = [originalPost];

    const result = await store.setPostFavorite("post-1", false);

    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorited: false }),
    });
    expect(result).toEqual({ ok: true, post: updatedPost });
    expect(store.posts).toEqual([updatedPost]);
  });

  it("keeps local posts unchanged when the like API fails", async () => {
    const originalPost = {
      id: "post-1",
      content: "已有动态",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      likeCount: 0,
    };
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({ message: "不能点赞。" }, { ok: false, status: 400 }),
    );
    const store = useFeedStore();
    store.posts = [originalPost];

    const result = await store.setPostLike("post-1", true);

    expect(result).toEqual({ ok: false, message: "不能点赞。" });
    expect(store.posts).toEqual([originalPost]);
  });

  it("keeps local posts unchanged when the favorite API has a network failure", async () => {
    const originalPost = {
      id: "post-1",
      content: "已有动态",
      createdAt: "2026-05-21T01:00:00.000Z",
      favorited: false,
      favoriteCount: 0,
    };
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const store = useFeedStore();
    store.posts = [originalPost];

    const result = await store.setPostFavorite("post-1", true);

    expect(result).toEqual({ ok: false, message: "收藏失败，请稍后重试。" });
    expect(store.posts).toEqual([originalPost]);
  });
});
