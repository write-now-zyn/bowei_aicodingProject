# 即时动态

一个使用 Vue 3、Pinia、Hono 和内存存储实现的动态记录应用。项目用于记录进展、想法或待同步事项。

## 技术栈

- Vue 3
- Pinia
- Vite
- Vitest
- Hono
- 内存存储

## 功能

- 发布动态
- 查看动态列表
- 新动态置顶展示
- 空内容校验
- 通过 REST API 读取和发布动态

## 本地运行

```bash
npm install
npm run dev
```

`npm run dev` 会同时启动 Hono API 服务和 Vite 前端。API 默认监听 `http://127.0.0.1:3000`，前端通过 Vite 代理访问 `/api`。
如果默认端口被占用，开发脚本会自动从 API `3000`、前端 `5173` 开始向后查找空闲端口，适合多个 git worktree 同时运行。

也可以手动指定端口：

```powershell
npm run dev -- --port 5174
$env:API_PORT=3001; npm run dev
```

## 测试和构建

```bash
npm test
npm run build
```

## 数据存储

动态数据保存在 Hono 服务进程的内存中。重启 API 服务会清空当前动态。
