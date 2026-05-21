import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { STORAGE_KEY, useFeedStore } from "./feed";

describe("feed store", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("loads valid posts from localStorage", () => {
    const storedPost = {
      id: "post-1",
      content: "已有动态",
      createdAt: "2026-05-21T01:00:00.000Z",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedPost]));

    const store = useFeedStore();

    expect(store.posts).toEqual([storedPost]);
    expect(store.postCount).toBe(1);
  });

  it("falls back to an empty list for invalid localStorage data", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: true }));

    const store = useFeedStore();

    expect(store.posts).toEqual([]);
    expect(store.postCount).toBe(0);
  });

  it("adds a post to the top and persists it", () => {
    const store = useFeedStore();

    const result = store.addPost("第一条动态");

    expect(result.ok).toBe(true);
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0]).toMatchObject({ content: "第一条动态" });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
  });

  it("rejects empty content without writing", () => {
    const store = useFeedStore();

    const result = store.addPost("   ");

    expect(result).toEqual({ ok: false, message: "请输入动态内容。" });
    expect(store.posts).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("rolls back when localStorage write fails", () => {
    const store = useFeedStore();
    const writeSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage denied");
      });

    const result = store.addPost("无法保存的动态");

    expect(result).toEqual({
      ok: false,
      message: "保存失败，请检查浏览器存储权限。",
    });
    expect(store.posts).toEqual([]);
    writeSpy.mockRestore();
  });
});
