import { computed, ref } from "vue";
import { defineStore } from "pinia";

const EMPTY_MESSAGE = "请输入动态内容。";
const LOAD_ERROR_MESSAGE = "加载动态失败。";
const PUBLISH_ERROR_MESSAGE = "发布失败，请稍后重试。";
const LIKE_ERROR_MESSAGE = "点赞失败，请稍后重试。";
const FAVORITE_ERROR_MESSAGE = "收藏失败，请稍后重试。";

export const useFeedStore = defineStore("feed", () => {
  const posts = ref([]);
  const isLoading = ref(false);
  const isPosting = ref(false);
  const postCount = computed(() => posts.value.length);

  async function loadPosts() {
    isLoading.value = true;

    try {
      const response = await fetch("/api/posts");
      const data = await readResponseJson(response);

      if (!response.ok) {
        return { ok: false, message: getResponseMessage(data, LOAD_ERROR_MESSAGE) };
      }

      if (!isValidPostsPayload(data)) {
        posts.value = [];
        return { ok: false, message: LOAD_ERROR_MESSAGE };
      }

      posts.value = data.posts;
      return { ok: true, posts: posts.value };
    } catch (error) {
      return { ok: false, message: LOAD_ERROR_MESSAGE };
    } finally {
      isLoading.value = false;
    }
  }

  async function addPost(content) {
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      return { ok: false, message: EMPTY_MESSAGE };
    }

    isPosting.value = true;

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: normalizedContent }),
      });
      const data = await readResponseJson(response);

      if (!response.ok) {
        return {
          ok: false,
          message: getResponseMessage(data, PUBLISH_ERROR_MESSAGE),
        };
      }

      if (!isValidPost(data?.post)) {
        return { ok: false, message: PUBLISH_ERROR_MESSAGE };
      }

      posts.value = [data.post, ...posts.value];
      return {
        ok: true,
        message: getResponseMessage(data, "发布成功。"),
        post: data.post,
      };
    } catch (error) {
      return { ok: false, message: PUBLISH_ERROR_MESSAGE };
    } finally {
      isPosting.value = false;
    }
  }

  async function setPostLike(postId, liked) {
    return updatePostFlag(
      postId,
      "/like",
      { liked },
      LIKE_ERROR_MESSAGE,
    );
  }

  async function setPostFavorite(postId, favorited) {
    return updatePostFlag(
      postId,
      "/favorite",
      { favorited },
      FAVORITE_ERROR_MESSAGE,
    );
  }

  async function updatePostFlag(postId, endpoint, body, fallbackMessage) {
    try {
      const response = await fetch(`/api/posts/${postId}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readResponseJson(response);

      if (!response.ok) {
        return { ok: false, message: getResponseMessage(data, fallbackMessage) };
      }

      if (!isValidPost(data?.post)) {
        return { ok: false, message: fallbackMessage };
      }

      posts.value = posts.value.map((post) =>
        post.id === postId ? data.post : post,
      );
      return { ok: true, post: data.post };
    } catch (error) {
      return { ok: false, message: fallbackMessage };
    }
  }

  return {
    posts,
    isLoading,
    isPosting,
    postCount,
    loadPosts,
    addPost,
    setPostLike,
    setPostFavorite,
  };
});

async function readResponseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function isValidPost(post) {
  return (
    post &&
    (typeof post.id === "string" || typeof post.id === "number") &&
    typeof post.content === "string" &&
    typeof post.createdAt === "string" &&
    typeof post.liked === "boolean" &&
    typeof post.favorited === "boolean" &&
    isCount(post.likeCount) &&
    isCount(post.favoriteCount)
  );
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0;
}

function isValidPostsPayload(data) {
  return Array.isArray(data?.posts) && data.posts.every(isValidPost);
}

function getResponseMessage(data, fallback) {
  return typeof data?.message === "string" && data.message ? data.message : fallback;
}
