# AI-Frontier-Lab — Claude Code 仓库级指令

## 项目概述

这是一个持续演进的 AI 前沿技术探索实验室。仓库采用 topics/ 模型组织内容，每个 topic 是一个自治的子项目。

## 仓库结构

- `topics/` — 所有探索主题，编号排序，每个 topic 自治
- `site/` — 展示站点，插件式架构
- `.agents/` — 多 Agent 配置（仓库级基线）
- `shared/` — 跨主题共享资源
- `docs/` — 仓库级文档

## 工作规范

- 新建 topic 使用 `shared/scripts/new-topic.sh` 脚本
- 每个 topic 的 README.md 必须包含 frontmatter（title, tags, category, difficulty, date, status）
- 实验代码放在 topic 的 `experiments/` 目录下
- 可复用工具放在 topic 的 `tools/` 目录下
- 不要在仓库内存放任何 API Key 或密钥
- 多语言项目，不假设特定语言或构建工具
