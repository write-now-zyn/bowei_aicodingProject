import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const STORAGE_KEY = "local-feed-posts";
const EMPTY_MESSAGE = "请输入动态内容。";
const SAVE_ERROR_MESSAGE = "保存失败，请检查浏览器存储权限。";

export const useFeedStore = defineStore("feed", () => {
  const posts = ref(loadPosts());
  const postCount = computed(() => posts.value.length);

  function addPost(content) {
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      return { ok: false, message: EMPTY_MESSAGE };
    }

    const nextPost = {
      id: createPostId(),
      content: normalizedContent,
      createdAt: new Date().toISOString(),
    };
    const previousPosts = posts.value;

    posts.value = [nextPost, ...posts.value];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.value));
      return { ok: true, message: "发布成功。", post: nextPost };
    } catch (error) {
      posts.value = previousPosts;
      return { ok: false, message: SAVE_ERROR_MESSAGE };
    }
  }

  return {
    posts,
    postCount,
    addPost,
  };
});

function loadPosts() {
  try {
    const storedPosts = localStorage.getItem(STORAGE_KEY);
    if (!storedPosts) {
      return [];
    }

    const parsedPosts = JSON.parse(storedPosts);
    if (!Array.isArray(parsedPosts)) {
      return [];
    }

    return parsedPosts.filter(isValidPost);
  } catch (error) {
    return [];
  }
}

function isValidPost(post) {
  return (
    post &&
    typeof post.id === "string" &&
    typeof post.content === "string" &&
    typeof post.createdAt === "string"
  );
}

function createPostId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
