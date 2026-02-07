# AI-Frontier-Lab

> A continuously evolving laboratory for exploring bleeding-edge AI technologies.

## Vision

As a senior C++ systems engineer following the **75/25 principle** (75% deepening existing skills, 25% exploring new frontiers), this repository is dedicated entirely to that 25% — an intensive, hands-on space for tracking, experimenting with, and deconstructing the latest AI technologies.

**Goal: Keep up with AI speed.**

## Current Topics

| # | Topic | Status | Description |
|---|-------|--------|-------------|
| 001 | [MCP Deep Dive](topics/001-mcp-deep-dive/) | Draft | Model Context Protocol 深度解构 |
| 002 | [Agent Workflows](topics/002-agent-workflows/) | Draft | Multi-Agent 协作工作流探索 |
| 003 | [LSP Enhancement](topics/003-lsp-enhancement/) | Draft | Language Server Protocol AI 增强 |

## Quick Start

### Prerequisites

See [.agents/PREREQUISITES.md](.agents/PREREQUISITES.md) for required tools and environment setup.

### Setup

```bash
git clone https://github.com/skytxy/AI-Frontier-Lab.git
cd AI-Frontier-Lab
cp .env.example .env
# Edit .env with your API keys
```

### Create a New Topic

```bash
./shared/scripts/new-topic.sh 004 "your-topic-name"
```

### Start the Website

```bash
# 方式一：快捷启动（推荐）
./start-web.sh            # 自动安装依赖并启动开发服务器

# 方式二：手动启动
cd site
npm install              # 首次运行需要安装依赖
npm run dev              # 启动开发服务器，默认 http://localhost:4321

# 方式三：预览构建产物
npm run build            # 构建静态网站
npm run preview          # 预览构建后的网站
```

**网站入口**：
- 开发模式：http://localhost:4321
- 构建产物：`site/dist/` 目录（可部署到任何静态托管服务）

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architectural overview.

**Key ideas:**
- **`topics/`** — Each topic is a self-contained sub-project with its own code, docs, and optional agent configs
- **`site/`** — A plugin-based presentation layer that aggregates all topics into a rich, interactive showcase
- **`.agents/`** — Multi-agent configuration (Claude, Gemini, Codex) with repo-level baseline + topic-level overrides
- **`shared/`** — Cross-topic utilities and templates

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.

## License

[MIT](LICENSE)
