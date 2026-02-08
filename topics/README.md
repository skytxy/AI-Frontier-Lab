# Topics Index

本目录包含所有探索主题。每个 topic 是一个自治的子项目。

## 目录

| # | Topic | Category | Status | Description |
|---|-------|----------|--------|-------------|
| 001 | [MCP Deep Dive](mcp-deep-dive/) | agent-infrastructure | draft | Model Context Protocol 深度解构 |
| 002 | [Agent Workflows](002-agent-workflows/) | agent-infrastructure | draft | Multi-Agent 协作工作流探索 |
| 003 | [LSP Enhancement](003-lsp-enhancement/) | dev-tools | draft | Language Server Protocol AI 增强 |

## 创建新 Topic

```bash
./shared/scripts/new-topic.sh <number> "<topic-name>"
```

## Topic 结构

```
NNN-topic-name/
├── README.md           # Blog-style 探索文章（含 frontmatter）
├── experiments/        # 实验代码
├── tools/              # 产出的可复用工具
├── assets/             # 图片、图表
└── .agents/            # 主题级 agent 配置覆盖（可选）
```
