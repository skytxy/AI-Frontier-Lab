# Architecture

本文档描述 AI-Frontier-Lab 的架构设计。完整设计文档见 [docs/plans/2026-02-07-repo-architecture-design.md](plans/2026-02-07-repo-architecture-design.md)。

## 核心理念

**流动架构** — 不按技术类别做顶层分类，而是以编号主题（Topic）为单位组织内容。新主题加入零摩擦，自然反映探索的时间顺序和技能演进。

## 目录职责

| 目录 | 职责 | 稳定性 |
|------|------|--------|
| `agent/` | Agent 方向核心内容区，每个 topic 是自自治的子项目 | 结构稳定，内容持续增长 |
| `algo/` | Algo 方向核心内容区，按领域子目录组织 | 规划中，结构待定 |
| `site/` | 展示站点，汇集所有 topic 的内容 | 技术栈可演进，内容契约稳定 |
| `.agents/` | 多 Agent 行为配置（无密钥） | 随工具生态变化而扩展 |
| `shared/` | 跨主题共享的脚本和模板 | 按需增长 |
| `docs/` | 仓库自自自文档（贡献指南、架构、设计） | 稳定 |

## 内容流转

```
agent/[0-9]*/README.md  ──→  site/  ──→  部署到线上
   （内容源头）          （渲染引擎）     （对外展示）
algo/**/README.md       ──→  site/  ──→  （规划中）
```

- Topic 的 README.md 是 **Single Source of Truth**
- site/ 通过 adapters 消费 topics 的 frontmatter 和内容
- 大型独立项目通过外链留存记录

## Agent 配置分层

```
.agents/claude/CLAUDE.md                    ← 仓库级基线
agent/001-xxx/.agents/claude/CLAUDE.md     ← 主题级覆盖（可选）
```

## 内容契约：Frontmatter

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
