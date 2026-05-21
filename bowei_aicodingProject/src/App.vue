<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useFeedStore } from "./stores/feed";

const MAX_LENGTH = 280;
const feedStore = useFeedStore();
const { posts, postCount } = storeToRefs(feedStore);

const draft = ref("");
const statusMessage = ref("");
const statusType = ref("");

const remainingLabel = computed(() => `${draft.value.length} / ${MAX_LENGTH}`);
const hasPosts = computed(() => postCount.value > 0);

function publishPost() {
  const result = feedStore.addPost(draft.value);
  statusMessage.value = result.message;
  statusType.value = result.ok ? "success" : "error";

  if (result.ok) {
    draft.value = "";
  }
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
</script>

<template>
  <main class="dashboard-shell">
    <section class="hero-card glass-card" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow">Workspace Feed</p>
        <h1 id="page-title">即时动态</h1>
        <p class="intro">记录进展、想法和需要同步的事项，让当前状态一眼清楚。</p>
      </div>

      <div class="stats-grid" aria-label="动态统计">
        <div class="stat-card mini-card">
          <span class="stat-value">{{ postCount }}</span>
          <span class="stat-label">条动态</span>
        </div>
        <div class="stat-card mini-card">
          <span class="stat-value">{{ hasPosts ? "已同步" : "待开始" }}</span>
          <span class="stat-label">当前状态</span>
        </div>
      </div>
    </section>

    <section class="bento-grid">
      <section class="composer glass-card" aria-labelledby="composer-title">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Compose</span>
            <h2 id="composer-title">发布动态</h2>
          </div>
          <span class="section-badge">280 字</span>
        </div>

        <form novalidate @submit.prevent="publishPost">
          <label class="sr-only" for="post-content">动态内容</label>
          <textarea
            id="post-content"
            v-model="draft"
            name="content"
            rows="6"
            :maxlength="MAX_LENGTH"
            placeholder="记录进展、想法或待同步事项..."
          />

          <div class="form-footer">
            <p
              class="message"
              :class="statusType"
              role="status"
              aria-live="polite"
            >
              {{ statusMessage }}
            </p>
            <div class="actions">
              <span class="counter">{{ remainingLabel }}</span>
              <button type="submit">发布</button>
            </div>
          </div>
        </form>
      </section>

      <section class="feed glass-card" aria-labelledby="feed-title">
        <div class="section-heading feed-heading">
          <div>
            <span class="section-kicker">Timeline</span>
            <h2 id="feed-title">动态列表</h2>
          </div>
          <span class="feed-count">{{ postCount }} 条</span>
        </div>

        <p v-if="!hasPosts" class="empty-state">还没有内容，发布第一条吧。</p>

        <ul v-else class="post-list">
          <li v-for="post in posts" :key="post.id" class="post-card">
            <div class="avatar" aria-hidden="true">我</div>
            <article class="post-body">
              <header class="post-meta">
                <span class="post-author">我</span>
                <time class="post-time" :datetime="post.createdAt">
                  {{ formatTime(post.createdAt) }}
                </time>
              </header>
              <p class="post-content">{{ post.content }}</p>
            </article>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>
