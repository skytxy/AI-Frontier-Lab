# Contributing to AI-Frontier-Lab

感谢你对本项目的关注！

## 如何参与

### 1. 提出想法

通过 [Issues](../../issues) 提出你感兴趣的 AI 前沿技术话题，或对现有 topic 的改进建议。

### 2. 贡献新 Topic

```bash
# Fork 并 clone 本仓库
git clone https://github.com/skytxy/AI-Frontier-Lab.git
cd AI-Frontier-Lab

# 创建新 topic
./shared/scripts/new-topic.sh <number> "<topic-name>"

# 在新 topic 目录下开始你的探索
# 完成后提交 PR
```

### 3. Topic 规范

每个 topic 的 README.md **必须**包含 frontmatter：

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

内容风格：
- **Blog-style 结构化文章**：有明确主题、背景、过程、结论
- **不以丢失内容深度为代价**：宁可长一些，也要讲清楚
- 实验代码放 `experiments/`，可复用工具放 `tools/`

### 4. 代码规范

- 本仓库是多语言项目，每个 topic 可以使用最适合的语言/框架
- 每个 topic 应在自己的 README.md 中说明如何运行其代码
- 不要在仓库内提交任何 API Key 或密钥

## 项目结构

参考 [docs/ARCHITECTURE.md](ARCHITECTURE.md) 了解完整架构。
