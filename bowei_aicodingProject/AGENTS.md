# AGENTS.md

## 当前项目背景
- 项目目录：`D:\Document\aicoding\bowei_aicodingProject`。
- 技术栈：Vue 3、Pinia、Vite、Vitest、Hono、内存存储。
- 功能范围：发布动态、查看动态、通过 REST API 读写内存数据。
- 当前产品名：`即时动态`。
- 不要使用或恢复含有旧平台化风险的命名；界面统一使用“即时动态 / 动态 / Workspace Feed”等中性表达。
- `ui-design.md` 是当前 Apple 风 UI 参考文档，后续 UI 调整优先遵守它。

## 运行方式
常用命令必须在项目目录运行：

```powershell
cd D:\Document\aicoding\bowei_aicodingProject
npm install
npm run dev
npm test
npm run build
```

开发地址通常是：

```text
http://127.0.0.1:5173
```

如果端口被占用：

```powershell
npm run dev -- --port 5174
```

不要把端口占用误判为代码错误。必要时先用 `netstat -ano | Select-String ':5173'` 查占用进程。

## Vue / Pinia / TDD 约定
- 功能逻辑优先写在 Pinia store，UI 组件只做展示和交互编排。
- 新行为优先按 TDD 流程处理：先写或更新 Vitest 测试，再实现，再验证。
- Store 测试重点覆盖：
  - 通过 `GET /api/posts` 初始化。
  - 发布后调用 `POST /api/posts`。
  - 新动态置顶。
  - 空内容不调用 API。
  - 非法 API 数据兜底为空数组并返回明确错误。
  - API 失败或网络失败返回明确错误。
- 组件测试重点覆盖：
  - 空状态。
  - 字数计数。
  - 发布成功提示。
  - 挂载后从 API 读取数据。
- 不新增登录、删除、点赞、评论、图片上传或额外后端 API，除非用户明确要求。

## UI 设计约定
- 参考 `ui-design.md`。
- 当前视觉方向：Apple 风、Bento Grid、浅色玻璃卡片、蓝色主按钮、灰底输入框、清晰信息层级。
- 保持界面成熟、简洁、实际可用，不做练习页质感。
- UI 卡片圆角遵守当前工程约束，优先使用 8px；除非用户明确要求，不随意改成大圆角。
- 不恢复旧的橙色主视觉。
- 移动端必须检查布局不挤压、不重叠。
- 不为了美化增加新功能；美化只改结构、样式和文案层级。

## Git 和提交范围
- 当前主要分支：`codex/vue-pinia-tdd-local-feed`。
- GitHub remote：
  - `origin https://github.com/write-now-zyn/bowei_aicodingProject.git`
- 只提交当前项目相关文件。
- 不提交：
  - `node_modules/`
  - `dist/`
  - `coverage/`
  - `.vite/`
- 根目录的笔记文件通常不属于当前项目，不要顺手提交：
  - `2026-05-20-ai-coding.md`
  - `_note-template.md`
  - `index.md`

## 验证清单
每次涉及项目代码或 UI 修改，尽量执行：

```powershell
cd D:\Document\aicoding\bowei_aicodingProject
npm test
npm run build
```

网页验证至少检查：
- 页面能打开。
- 发布动态成功。
- 新动态置顶。
- 刷新后能从 API 重新读取数据。
- 空内容提示正常。
- 控制台无错误。
- 页面和代码中不含旧敏感词。

## GitHub 推送经验
- 如果 `git push` 报 `Failed to connect to github.com port 443`，这是网络连通问题，不是密码错误。
- 如果认证失败，通常会出现 `Authentication failed`、`Permission denied` 等信息。
- 推送失败时可先运行：

```powershell
git ls-remote --heads origin
```

- 如果 `ls-remote` 成功但 `push` 失败，可以重试一次。
- 推送成功后用：

```powershell
git ls-remote --heads origin <branch-name>
```

确认远程分支存在。

## 安全和隐私
- 不要把 secrets、tokens、private keys、`.env` values、credentials、账号密码或私密配置写进代码、日志、提交记录或回复。
- GitHub HTTPS 推送不能使用账号密码；如果需要认证，让用户通过浏览器授权或 Personal Access Token 自行输入。
- 不要让用户把 token 发到聊天里。
