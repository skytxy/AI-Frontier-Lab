# AI-Frontier-Lab 仓库架构设计

> 日期: 2026-02-07
> 状态: 已确认

## 1. 战略定位

本仓库是一个**持续演进的 AI 前沿技术探索实验室**。

- **所有者背景**: 资深 C++ 系统工程师，遵循 75/25 原则（75% 存量精进，25% 增量探索）
- **仓库定位**: 完全属于 25% 的探索领域，专门用于高强度跟进、实验和解构 AI 领域最新技术
- **核心目标**: Keep up with AI speed —— 通过实战将 AI 新技术转化为核心技能

## 2. 设计原则

### 2.1 流动架构，而非静态分类

不按技术类别（mcp/、agents/、lsp/）做顶层分类，而是采用**编号主题（Topic）模型**。新主题加入零摩擦，自然反映探索的时间顺序和技能演进。

### 2.2 主题自治

每个 topic 是一个独立的子项目，可以有自己的语言、依赖、构建方式和 agent 配置。仓库级基础设施提供共享能力，但不强制约束。

### 2.3 配置可复现 + 文档化前提

- 仓库内的 agent 配置只管行为层（指令、规则、MCP 设置），不涉及任何密钥
- API Key 等敏感信息通过 `.env.example` 模板 + `.gitignore` 管理
- 环境前提（CLI 工具、全局配置）通过 `PREREQUISITES.md` 显式声明

### 2.4 多 Agent 兼容

通过 `.agents/` 目录统一收纳不同 AI 工具的配置，避免根目录散落。支持仓库级基线 + 主题级覆盖的分层策略。

### 2.5 站点可演进

展示站点的技术栈不锁死，插件式架构保证核心骨架稳定、展示能力可扩展，整个渲染引擎可被替换。

## 3. 目录结构

```
AI-Frontier-Lab/
├── README.md                       # 项目主页（愿景、导航、快速开始）
├── LICENSE
├── .gitignore
├── .env.example                    # API Key 模板
│
├── .agents/                        # 仓库级 Agent 配置（行为层，无密钥）
│   ├── PREREQUISITES.md            # 环境前提声明
│   ├── claude/
│   │   ├── CLAUDE.md               # Claude Code 仓库级指令
│   │   └── settings.json           # 项目级 MCP 等配置
│   ├── gemini/                     # Gemini CLI 配置（预留）
│   └── codex/                      # Codex 配置（预留）
│
├── docs/                           # 仓库级文档
│   ├── CONTRIBUTING.md             # 贡献指南
│   ├── ARCHITECTURE.md             # 架构说明
│   └── plans/                      # 设计文档
│
├── shared/                         # 跨主题共享资源
│   ├── scripts/                    # 通用脚本
│   └── templates/                  # 模板文件
│
├── topics/                         # 所有探索主题（核心内容区）
│   ├── README.md                   # 主题索引目录
│   ├── _template/                  # 新主题模板
│   │   ├── README.md               # 含 frontmatter 模板
│   │   ├── experiments/            # 实验代码
│   │   ├── tools/                  # 产出的可复用工具
│   │   ├── assets/                 # 图片、图表
│   │   └── .agents/                # 主题级 agent 配置覆盖（可选）
│   ├── 001-mcp-deep-dive/
│   ├── 002-agent-workflows/
│   └── 003-lsp-enhancement/
│
├── site/                           # 展示站点（可演进）
│   ├── README.md                   # 当前技术栈 + 演进历史
│   ├── package.json
│   └── src/
│       ├── app/                    # 最小骨架
│       ├── plugins/                # 插件系统
│       ├── components/             # 通用 UI
│       └── content/
│           ├── config.ts           # 分类配置
│           └── adapters/           # topics/ 内容适配器
```

## 4. 内容流转

```
topics/*/README.md  ──→  site/  ──→  部署到线上
   （内容源头）        （渲染引擎）     （对外展示）
```

- 每个 topic 的 `README.md` 是内容的单一真相源 (Single Source of Truth)
- `site/` 通过 adapters 消费 topics 的内容，以丰富的前端效果呈现
- 大型独立项目通过外链形式留存记录

## 5. Topic Frontmatter 契约

每个 topic 的 README.md 头部必须包含以下 frontmatter：

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

站点根据 frontmatter 自动生成分类页、标签页、时间线。新增分类只需在新 topic 的 frontmatter 里写一个新 category 值。

## 6. Agent 配置分层

```
.agents/claude/CLAUDE.md          ← 仓库级基线（所有 topic 继承）
topics/001-xxx/.agents/claude/CLAUDE.md  ← 主题级覆盖（可选）
```

密钥管理：
- `.env.example` 列出所有需要的 key（值为空）
- `.env` 存放实际密钥，被 `.gitignore` 排除
- `PREREQUISITES.md` 说明如何获取和配置

## 7. 对外身份

本仓库定位为**社区开源项目**：
- 结构清晰，陌生人可快速理解
- 文档是一等公民
- 提供完善的贡献指南
- Blog-style 深度文章，不以丢失内容深度为代价
- 借助 React 等前端技术丰富展示效果
