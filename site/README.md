# AI-Frontier-Lab Site

展示站点，汇集所有 topics 的内容，以丰富的前端效果对外呈现。

## 设计原则

- **汇集性**: 一个站点展示所有 topic，不是每个 topic 一个站点
- **插件式架构**: 核心骨架稳定，展示能力通过 plugins/ 扩展
- **低耦合**: 插件之间互不依赖，新增展示需求 = 新增一个 plugin 目录
- **可演进**: 技术栈不锁死，整个渲染引擎可被替换

## 内容来源

站点通过 Astro Content Collections 从 `topics/*/README.md` 拉取内容。

内容契约是 frontmatter：

```yaml
---
title: "主题标题"
tags: [tag1, tag2]
category: category-name
difficulty: beginner | intermediate | advanced
date: YYYY-MM-DD
status: draft | in-progress | published
---
```

## 技术栈

- **Astro 5** — 内容驱动型静态站点框架
- **React** — 交互组件（通过 @astrojs/react 集成）
- **Content Collections** — 消费 topics/*/README.md 的 frontmatter + Markdown

### 开发

```bash
cd site
npm install
npm run dev      # 本地开发 http://localhost:4321
npm run build    # 静态构建到 dist/
npm run preview  # 预览构建结果
```

## 演进历史

| 日期 | 变更 |
|------|------|
| 2026-02-07 | 初始架构设计，预留目录结构 |
| 2026-02-07 | 技术栈确认：Astro + React，完成基础骨架搭建 |
