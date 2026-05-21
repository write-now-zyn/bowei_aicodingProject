# 即时动态

一个使用 Vue 3、Pinia 和 Local Storage 实现的本地动态记录应用。项目用于记录进展、想法或待同步事项，数据只保存在当前浏览器本地。

## 技术栈

- Vue 3
- Pinia
- Vite
- Vitest
- Local Storage

## 功能

- 发布动态
- 查看动态列表
- 新动态置顶展示
- 空内容校验
- 刷新页面后保留本地数据

## 本地运行

```bash
npm install
npm run dev
```

## 测试和构建

```bash
npm test
npm run build
```

## 数据存储

动态数据保存在浏览器 `localStorage` 中，key 为 `local-feed-posts`。清理浏览器站点数据会删除本地动态。
