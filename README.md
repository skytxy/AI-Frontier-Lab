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
