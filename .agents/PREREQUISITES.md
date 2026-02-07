# Prerequisites

本文档列出运行 AI-Frontier-Lab 中各实验所需的环境前提。

## 必需

| 工具 | 用途 | 安装方式 |
|------|------|----------|
| Git | 版本控制 | `brew install git` |
| Node.js >= 20 | 展示站点 & JS/TS 类实验 | `brew install node` 或 [nvm](https://github.com/nvm-sh/nvm) |

## AI CLI 工具（按需安装）

| 工具 | 用途 | 安装参考 |
|------|------|----------|
| Claude Code | Claude AI 编程助手 | `npm install -g @anthropic-ai/claude-code` |
| Gemini CLI | Google Gemini 编程助手 | 参考 Google 官方文档 |
| Codex CLI | OpenAI Codex 编程助手 | 参考 OpenAI 官方文档 |

## API Keys

参考 `.env.example`，将所需 key 填入本地 `.env` 文件：

```bash
cp .env.example .env
# 编辑 .env，填入你的 API keys
```

获取方式：
- **ANTHROPIC_API_KEY**: [Anthropic Console](https://console.anthropic.com/)
- **OPENAI_API_KEY**: [OpenAI Platform](https://platform.openai.com/)
- **GOOGLE_AI_API_KEY**: [Google AI Studio](https://aistudio.google.com/)

## 全局配置说明

部分 AI 工具会加载全局配置（如 `~/.claude/`），这些配置不在本仓库管理范围内。仓库内 `.agents/` 目录下的配置仅管理**项目级行为**，与全局配置互不冲突。

如果某个 topic 需要特殊的全局配置前提，会在该 topic 自己的 README.md 中说明。
