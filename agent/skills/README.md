---
title: "AI Agent Skills: Claude Code, OpenAI, Custom Tools"
tags: [skills, agents, claude-code, openai, tools]
category: agent-infrastructure
difficulty: intermediate
date: 2026-02-08
status: draft
sort: 5
---

# Skills: AI Agent Skills: Claude Code, OpenAI, Custom Tools

## Background

随着 Claude Code、OpenAI Agents、Cline 等工具的兴起，"Agent Skills" 成为 AI Agent 领域最热门的方向之一。本章节深入探索各种 Agent Skill 系统的设计理念和最佳实践。

## Goals

- [ ] 理解 Claude Code 的 Skill 系统架构
- [ ] 掌握 OpenAI Agents 的 Function Calling
- [ ] 学习自定义 Agent Tool/Skill 的开发
- [ ] 对比不同平台的设计权衡
- [ ] 实战：开发一个生产级 Agent Skill

## Exploration

### 核心平台对比

| 平台 | Skill 形式 | 定义方式 | 调用机制 |
|------|-----------|---------|---------|
| **Claude Code** | `.claude/skills/` 目录下的 Markdown 文件 | YAML frontmatter + 嵌入式代码 | `/skill-name` 命令触发 |
| **OpenAI** | JSON Schema 定义的 Functions | API 注册 | Agent 决策调用 |
| **Cline** | TypeScript 函数 | `src/skills/` 目录 | 自动发现和调用 |

### 关键概念

#### 1. Skill vs Tool vs Function

虽然术语不同，但本质相似：

| 术语 | 平台 | 特点 |
|------|------|------|
| Skill | Claude Code | 文档+代码一体，人类可读 |
| Tool | OpenAI | 纯 JSON Schema，API 友好 |
| Function | 通用编程 | 函数式调用，最灵活 |

#### 2. Skill 生命周期

```
定义 -> 注册 -> 发现 -> 调用 -> 执行 -> 返回
```

## Experiments

### Exp-01: Claude Code Skill 剖析

**目标**: 理解 Claude Code 的 Skill 系统设计

**内容**:
- 分析 `.claude/skills/` 目录结构
- Skill frontmatter 字段详解
- 参数传递和返回值处理
- Skill 之间的依赖关系

### Exp-02: OpenAI Function Calling

**目标**: 掌握 OpenAI 的函数调用机制

**内容**:
- 定义 Function 的 JSON Schema
- 并发函数调用 vs 串行
- 工具选择策略 (Tool Choice)
- 流式响应中的函数调用

### Exp-03: 自定义 Agent Skill 开发

**目标**: 开发一个生产级 Agent Skill

**实战场景**: 实现一个「代码审查 Skill」
- 静态分析集成
- 安全漏洞检测
- 性能优化建议

### Exp-04: Skill 评测体系

**目标**: 建立 Agent Skill 的质量评估标准

**内容**:
- 准确率测试
- 成本/性能基准
- 安全性审查
- 用户体验评估

## Key Findings

（待探索后填充）

## References

- [Claude Code Skills Documentation](https://github.com/anthropics/claude-code)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Cline Documentation](https://github.com/cline/cline)
