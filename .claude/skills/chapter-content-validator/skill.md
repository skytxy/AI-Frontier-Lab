---
description: 通过双Agent协作验证并完善章节内容。Learner Agent 尝试完成实战场景，发现知识缺口；Author Agent 负责补充内容。

parameters:
  chapter:
    description: 章节目录路径（如 agent/mcp-deep-dive）
    type: string
    required: true

  scenario_mode:
    description: 场景模式：template(预设模板), freeform(自由描述), brainstorming(引导细化)
    type: string
    enum: [template, freeform, brainstorming]
    default: template

  scenario:
    description: 场景描述（freeform/brainstorming 模式）或场景名称（template 模式）
    type: string
    required: false

  preset_scenario:
    description: 预设场景名称（当 scenario_mode=template 时使用）
    type: string
    required: false

  max_iterations:
    description: 最大迭代次数（默认5，防止无限循环）
    type: number
    default: 5

  review:
    description: 查看指定迭代的建议详情（如 --review=iteration-1）
    type: string
    required: false
---

# Chapter Content Validator

通过双 Agent 协作验证并完善章节内容的 Skill。让零基础学习者在实战中发现知识缺口，动态补全文档。

## 核心理念

> **"授人以鱼，不如授人以渔"** — 这不是一个文档验证工具，而是通过实战场景帮助学习者真正掌握知识的助手。

### 设计特点

1. **用户自定义场景** - 不限制难/易场景，用户可以描述自己遇到的实际应用需求
2. **保留学习产物** - Learner 实际实现的代码可供用户参考（虽然不提交到仓库）
3. **分层级反馈** - 自动应用文档修复，谨慎处理全局性修改
4. **持续改进** - 每次执行都让 Skill 和范式变得更聪明

## 工作流程

```
+-------------------------------------------------------------------+
|                   Chapter Content Validator                     |
+-------------------------------------------------------------------+
|                                                                   |
|  1. 用户定义场景 (template / freeform / brainstorming)           |
|                                                                   |
|  +--------------+          +--------------+                       |
|  | Learner Agent|  -------> | Author Agent |                       |
|  | (零基础学习者) |  发现缺口  |  (内容作者)  |                       |
|  +--------------+          +--------------+                       |
|         |                        |                               |
|         v                        v                               |
|  +-------------------------------------------------------+        |
|  |           Chapter Content                              |        |
|  |  - README.md, concepts/, experiments/                    |        |
|  +-------------------------------------------------------+        |
|                                                                   |
|  2. 分层级反馈更新                                              |
|     Level 1-2: 直接修改章节内容/配置                              |
|     Level 3-4: 记录建议，等待确认                                |
|                                                                   |
+-------------------------------------------------------------------+
```

## 场景模式

### 1. Template 模式（预设模板）

使用章节配置文件中定义的预设场景：

```bash
/chapter-content-validator --chapter=agent/mcp-deep-dive --scenario_mode=template --preset_scenario=basic-tool
```

### 2. Freeform 模式（自由描述）

直接描述你的实际需求：

```bash
/chapter-content-validator \
  --chapter=agent/mcp-deep-dive \
  --scenario_mode=freeform \
  --scenario="我需要实现一个能批量重命名文件的 MCP Server，支持正则匹配模式"
```

### 3. Brainstorming 模式（引导细化）

场景不清晰时，Skill 会通过自动化、上下文感知的问答逐步细化需求：

```bash
/chapter-content-validator \
  --chapter=agent/mcp-deep-dive \
  --scenario_mode=brainstorming \
  --scenario="我想做一个 MCP Server"
```

Skill 会根据章节类型（如 MCP、Skills、Algo 等）自动生成针对性的问题：
- 这个 Server 主要用来做什么？
- 需要哪些工具？
- 有什么特殊的验证需求？

**自动化特性**：问题生成是上下文感知的，不是僵硬的规则列表，会根据章节类型动态调整。

## 分层级反馈机制

每次执行后，Skill 会自动分类并处理反馈：

| 级别 | 更新目标 | 影响范围 | 处理方式 |
|------|----------|----------|----------|
| **Level 1** | 章节内容 (concepts/, experiments/) | 单章节 | 直接修改，记录日志 |
| **Level 2** | 章节配置 (.chapter-validator.yaml) | 单章节 | 直接修改，记录日志 |
| **Level 3** | 范式文档 (paradigm.md) | 跨章节 | 记录建议，批量应用 |
| **Level 4** | Skill 代码 (lib/*.ts) | 全局 | 记录建议，等待确认 |

### 输出示例

```markdown
## 验证完成

### 直接应用的修改 (Level 1-2)
- [x] concepts/stdio-transport.md: 添加 console.error 日志说明
- [x] .chapter-validator.yaml: 将验证标准从"能启动"调整为"能响应 tools/list"

### 记录的建议 (Level 3-4)
- [ ] paradigm.md: 添加新缺口类型 "dependency_missing"
- [ ] skill.md: 优化 Learner 约束描述，强调"不能搜索互联网"

### Level 3-4 重要建议自动提示
对于高优先级的 Level 3-4 建议（如 prompt_clarity < 3），Agent 会主动提示并询问是否直接应用。
较低优先级的建议仅记录在 validation-log.md 中供后续查看。

### 查看详情
运行 /chapter-content-validator --review=iteration-1 查看建议详情并决定是否应用
```

## Agent 角色

### Learner Agent (零基础学习者)

**角色定位**：一个真正不懂当前章节主题的开发者

**约束**：
- 不能搜索互联网
- 不能使用外部知识
- 只能查阅 Chapter 内的文档

**输出**：
- 场景执行结果（成功/部分/失败）
- 知识缺口报告（缺少什么、在哪里缺少）

### Author Agent (内容作者)

**角色定位**：负责章节内容质量的作者

**能力**：
- 分析 Learner 的缺口报告
- 补充缺失的概念文档
- 完善实验步骤
- 修复代码示例

## 输出文件

### validation-log.md

在验证流程**结束时一次性生成**，记录在章节目录下，包含完整的迭代脉络：

```markdown
# Chapter Validation Log

## Iteration 1: 实现文件批量重命名 Server

### Gaps Found
- stdio 传输日志方式未说明 (concepts/stdio-transport.md)
- Zod schema 用法不清晰 (experiments/02-mcp-server/README.md)

### Fixes Applied (Level 1-2)
- [x] concepts/stdio-transport.md: 添加"为什么不能用 console.log"章节
- [x] experiments/02-mcp-server/README.md: 补充 Zod schema 定义示例

### Suggestions Recorded (Level 3-4)
- [ ] paradigm.md: 新增缺口类型 "api_integration_pattern"
- [ ] skill.md: Learner 提示词需要更明确"零基础"的定义
```

## 相关文档

- [范式文档](/docs/frameworks/chapter-validation-paradigm.md) - 通用方法论，可复用到其他章节
- [MCP 章节配置示例](/agent/mcp-deep-dive/.chapter-validator.yaml)
