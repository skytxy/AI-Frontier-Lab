# AI-Frontier-Lab

> 一个持续演进的 AI 前沿技术探索实验室，涵盖 Agent 基础设施与核心算法研究。

## Vision

As a senior C++ systems engineer following the **75/25 principle** (75% deepening existing skills, 25% exploring new frontiers), this repository is dedicated entirely to that 25% — an intensive, hands-on space for tracking, experimenting with, and deconstructing the latest AI technologies.

**Goal: Keep up with AI speed.**

## 项目结构

```
AI-Frontier-Lab/
├── agent/              # Agent 方向：MCP、Workflows、LSP、Hooks
│   ├── 001-mcp-deep-dive/
│   ├── 002-agent-workflows/
│   ├── 003-lsp-enhancement/
│   └── 004-hooks/
│
├── algo/               # Algo 方向：深度学习、Transformer、RL
│   ├── foundations/    # 通用基础知识
│   ├── cnn/            # 卷积神经网络
│   ├── transformer/    # Transformer 架构
│   ├── rl/             # 强化学习
│   ├── attention/      # 注意力机制
│   └── diffusion/      # 扩散模型
│
├── site/               # 展示站点（Astro）
├── docs/               # 文档与设计
│   ├── plans/          # 设计文档
│   ├── evolution/      # 技术演进图谱数据
│   ├── proposals/      # 论文提案
│   └── candidates/     # 候选论文
│
└── shared/scripts/     # 共享脚本
    ├── new-agent-topic.sh   # 创建 Agent 主题
    └── new-algo-topic.sh    # 创建 Algo 主题
```

## 快速开始

### Prerequisites

See [.agents/PREREQUISITES.md](.agents/PREREQUISITES.md) for required tools and environment setup.

### Setup

```bash
git clone https://github.com/skytxy/AI-Frontier-Lab.git
cd AI-Frontier-Lab
cp .env.example .env
# Edit .env with your API keys
```

### 查看网站

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

### 创建新主题

**Agent 主题：**
```bash
./shared/scripts/new-agent-topic.sh 005 "langchain-integration"
```

**Algo 主题：**
```bash
./shared/scripts/new-algo-topic.sh transformer original 2017
```

### 论文发现流程

```bash
# 1. 运行发现脚本
./shared/scripts/papers/discover-papers.sh

# 2. 审查候选并创建提案
cp docs/proposals/_template.md docs/proposals/PROPO-2026-001-title.md

# 3. 接受后执行提案
./shared/scripts/papers/promote-proposal.sh PROPO-2026-001
```

## 两个方向

### Agent 方向

专注于 AI Agent 基础设施技术：
- **MCP (Model Context Protocol)** - 深入协议原理
- **Agent Workflows** - 编排模式与实践
- **LSP Enhancement** - 语言服务器协议增强
- **Hooks** - 事件驱动架构

### Algo 方向

专注于核心算法与模型研究：
- **Foundations** - 梯度下降、反向传播、优化
- **CNN** - LeNet、AlexNet、VGG、ResNet
- **Transformer** - 架构原理、编码器/解码器
- **RL** - DQN、Policy Gradient、PPO
- **Attention** - 注意力机制演进
- **Diffusion** - 扩散模型

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architectural overview.

**Key ideas:**
- **`agent/`** — Agent 方向主题，编号前缀 (001-, 002-, ...)
- **`algo/`** — Algo 方向主题，按领域子目录组织
- **`site/`** — A plugin-based presentation layer that aggregates all topics into a rich, interactive showcase
- **`.agents/`** — Multi-agent configuration (Claude, Gemini, Codex) with repo-level baseline + topic-level overrides
- **`shared/`** — Cross-topic utilities and templates

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.

## 技术栈

- **站点**: Astro 5 + React
- **公式**: KaTeX
- **可视化**: D3.js
- **脚本**: Bash + Python

## License

[MIT](LICENSE)
