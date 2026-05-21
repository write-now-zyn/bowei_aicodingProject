const STORAGE_KEY = "local-feed-posts";
const MAX_LENGTH = 280;

const form = document.querySelector("#post-form");
const contentInput = document.querySelector("#post-content");
const message = document.querySelector("#form-message");
const counter = document.querySelector("#content-counter");
const postList = document.querySelector("#post-list");
const emptyState = document.querySelector("#empty-state");
const postCount = document.querySelector("#post-count");

let posts = loadPosts();

renderPosts();
updateCounter();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const content = contentInput.value.trim();
  if (!content) {
    setMessage("请输入动态内容。", "error");
    contentInput.focus();
    return;
  }

  const post = {
    id: globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : String(Date.now()),
    content,
    createdAt: new Date().toISOString(),
  };

  posts = [post, ...posts];
  const saved = savePosts(posts);
  if (!saved) {
    return;
  }

  renderPosts();
  form.reset();
  updateCounter();
  setMessage("发布成功。", "success");
  contentInput.focus();
});

contentInput.addEventListener("input", updateCounter);

function loadPosts() {
  try {
    const rawPosts = localStorage.getItem(STORAGE_KEY);
    if (!rawPosts) {
      return [];
    }

    const parsedPosts = JSON.parse(rawPosts);
    if (!Array.isArray(parsedPosts)) {
      return [];
    }

    return parsedPosts.filter(isValidPost);
  } catch (error) {
    setMessage("读取本地数据失败。", "error");
    return [];
  }
}

function savePosts(nextPosts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPosts));
    return true;
  } catch (error) {
    posts = posts.slice(1);
    renderPosts();
    setMessage("保存失败，请检查浏览器存储权限。", "error");
    return false;
  }
}

function renderPosts() {
  postList.replaceChildren();
  emptyState.hidden = posts.length > 0;
  postCount.textContent = `${posts.length} 条`;

  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    const item = document.createElement("li");
    item.className = "post-card";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "我";

    const body = document.createElement("div");

    const meta = document.createElement("div");
    meta.className = "post-meta";

    const author = document.createElement("span");
    author.className = "post-author";
    author.textContent = "我";

    const time = document.createElement("time");
    time.className = "post-time";
    time.dateTime = post.createdAt;
    time.textContent = formatTime(post.createdAt);

    const content = document.createElement("p");
    content.className = "post-content";
    content.textContent = post.content;

    meta.append(author, time);
    body.append(meta, content);
    item.append(avatar, body);
    fragment.append(item);
  });

  postList.append(fragment);
}

function updateCounter() {
  counter.textContent = `${contentInput.value.length} / ${MAX_LENGTH}`;
}

function setMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type || ""}`.trim();
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

function isValidPost(post) {
  return (
    post &&
    typeof post.id === "string" &&
    typeof post.content === "string" &&
    typeof post.createdAt === "string"
  );
}
