import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App.vue";
import { STORAGE_KEY } from "./stores/feed";

function mountApp() {
  return mount(App, {
    global: {
      plugins: [createPinia()],
    },
  });
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the empty state and character counter", () => {
    const wrapper = mountApp();

    expect(wrapper.text()).toContain("即时动态");
    expect(wrapper.text()).toContain("还没有内容，发布第一条吧。");
    expect(wrapper.text()).toContain("0 / 280");
    expect(wrapper.text()).toContain("0 条");
  });

  it("updates the character counter while typing", async () => {
    const wrapper = mountApp();

    await wrapper.get("textarea").setValue("同步今天的进展");

    expect(wrapper.text()).toContain("7 / 280");
  });

  it("publishes a post and shows it at the top", async () => {
    const wrapper = mountApp();

    await wrapper.get("textarea").setValue("完成 Vue 改写");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.text()).toContain("发布成功。");
    expect(wrapper.text()).toContain("完成 Vue 改写");
    expect(wrapper.text()).toContain("1 条");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
  });

  it("keeps stored posts after remount", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "post-1",
          content: "刷新后仍然存在",
          createdAt: "2026-05-21T01:00:00.000Z",
        },
      ]),
    );

    const wrapper = mountApp();

    expect(wrapper.text()).toContain("刷新后仍然存在");
    expect(wrapper.text()).toContain("1 条");
  });

  it("shows an error for empty content", async () => {
    const wrapper = mountApp();

    await wrapper.get("form").trigger("submit");

    expect(wrapper.text()).toContain("请输入动态内容。");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
