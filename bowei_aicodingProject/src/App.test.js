import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.vue";

function mockJsonResponse(body, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  };
}

function mountApp() {
  return mount(App, {
    global: {
      plugins: [createPinia()],
    },
  });
}

function findButtonByText(wrapper, text) {
  return wrapper.findAll("button").find((button) => button.text() === text);
}

describe("App", () => {
  let fetchMock;

  beforeEach(() => {
    vi.unstubAllGlobals();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("renders the empty state and character counter", async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ posts: [] }));
    const wrapper = mountApp();
    await flushPromises();

    expect(wrapper.text()).toContain("即时动态");
    expect(wrapper.text()).toContain("还没有内容，发布第一条吧。");
    expect(wrapper.text()).toContain("0 / 280");
    expect(wrapper.text()).toContain("0 条");
  });

  it("updates the character counter while typing", async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ posts: [] }));
    const wrapper = mountApp();
    await flushPromises();

    await wrapper.get("textarea").setValue("同步今天的进展");

    expect(wrapper.text()).toContain("7 / 280");
  });

  it("publishes a post and shows it at the top", async () => {
    const apiPost = {
      id: "post-1",
      content: "完成 Vue 改写",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    };
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ posts: [] }))
      .mockResolvedValueOnce(
        mockJsonResponse(
          { message: "发布成功。", post: apiPost },
          { status: 201 },
        ),
      );
    const wrapper = mountApp();
    await flushPromises();

    await wrapper.get("textarea").setValue("完成 Vue 改写");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("发布成功。");
    expect(wrapper.text()).toContain("完成 Vue 改写");
    expect(wrapper.text()).toContain("1 条");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "完成 Vue 改写" }),
    });
  });

  it("loads posts from the API after mount", async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({
        posts: [
          {
            id: "post-1",
            content: "刷新后仍然存在",
            createdAt: "2026-05-21T01:00:00.000Z",
            liked: true,
            favorited: false,
            likeCount: 2,
            favoriteCount: 1,
          },
        ],
      }),
    );

    const wrapper = mountApp();
    await flushPromises();

    expect(wrapper.text()).toContain("刷新后仍然存在");
    expect(findButtonByText(wrapper, "点赞2").exists()).toBe(true);
    expect(findButtonByText(wrapper, "收藏1").exists()).toBe(true);
    expect(wrapper.text()).toContain("1 条");
  });

  it("renders action buttons and updates state after liking a post", async () => {
    const apiPost = {
      id: "post-1",
      content: "需要点赞的动态",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    };
    const likedPost = {
      ...apiPost,
      liked: true,
      likeCount: 1,
    };
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ posts: [apiPost] }))
      .mockResolvedValueOnce(mockJsonResponse({ post: likedPost }));
    const wrapper = mountApp();
    await flushPromises();

    const likeButton = findButtonByText(wrapper, "点赞0");

    expect(likeButton.exists()).toBe(true);
    expect(likeButton.attributes("aria-pressed")).toBe("false");

    await likeButton.trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenLastCalledWith("/api/posts/post-1/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked: true }),
    });
    expect(findButtonByText(wrapper, "点赞1").attributes("aria-pressed")).toBe(
      "true",
    );
  });

  it("updates state after favoriting a post", async () => {
    const apiPost = {
      id: "post-1",
      content: "需要收藏的动态",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    };
    const favoritedPost = {
      ...apiPost,
      favorited: true,
      favoriteCount: 1,
    };
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ posts: [apiPost] }))
      .mockResolvedValueOnce(mockJsonResponse({ post: favoritedPost }));
    const wrapper = mountApp();
    await flushPromises();

    const favoriteButton = findButtonByText(wrapper, "收藏0");

    await favoriteButton.trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenLastCalledWith("/api/posts/post-1/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorited: true }),
    });
    expect(
      findButtonByText(wrapper, "收藏1").attributes("aria-pressed"),
    ).toBe("true");
  });

  it("keeps action state unchanged when the API fails", async () => {
    const apiPost = {
      id: "post-1",
      content: "失败后保持原样",
      createdAt: "2026-05-21T01:00:00.000Z",
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0,
    };
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ posts: [apiPost] }))
      .mockResolvedValueOnce(
        mockJsonResponse({ message: "不能点赞。" }, { ok: false, status: 400 }),
      );
    const wrapper = mountApp();
    await flushPromises();

    const likeButton = findButtonByText(wrapper, "点赞0");

    await likeButton.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("不能点赞。");
    expect(findButtonByText(wrapper, "点赞0").exists()).toBe(true);
    expect(
      findButtonByText(wrapper, "点赞0").attributes("aria-pressed"),
    ).toBe("false");
  });

  it("shows an error for empty content", async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ posts: [] }));
    const wrapper = mountApp();
    await flushPromises();

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("请输入动态内容。");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
