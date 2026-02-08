---
description: 通过双Agent协作验证并并并完善章节内容。Learner Agent 尝试完成实战场景，发现知识缺口；Author Agent 负责补充内容。

parameters:
  chapter:
    description: 章节目录路径（如 agent/mcp-deep-dive）
    type: string
    required: true

  scenario:
    description: 实战场景类型
    type: string
    enum: [tool, integration, data]
    default: tool

  simple_scenario:
    description: 简单场景描述（如"实现一个文件批量重命名Server"）
    type: string
    required: false

  complex_scenario:
    description: 复杂场景描述（如"实现一个GitHub API集成Server"）
    type: string
    required: false

  max_iterations:
    description: 最大迭代次数（默认5，防止无限循环）
    type: number
    default: 5
---

# Chapter Content Validator

通过双 Agent 协作验证并完善章节内容的 Skill。

## 核心理念：持续改进反馈循环

> **"Skill 本身也在学习中"** — 每次验证执行都是对 Skill 本身的测试和改进机会。

本 Skill 处于早期创建阶段，难免存在未考虑到的边界情况。因此，我们在验证流程中加入了**反馈循环机制**：

### 反馈收集机制

每次执行验证时，主 Agent 会：
1. 收集 Learner Agent 的执行反馈（哪些步骤顺利、哪些卡住）
2. 收集 Author Agent 的修复反馈（哪些类型的缺口容易/难修复）
3. 记录发现的 Skill 自身问题（提示词不够清晰、流程有缺陷等）

### 反馈格式

执行后生成的报告会包含：

```markdown
## Skill 自身反馈

### Learner 反馈
- [ ] 提示词清晰度：能否准确理解"零基础"约束？
- [ ] 场景定义：场景描述是否足够具体？
- [ ] 缺口识别：是否正确识别了真正的知识缺口？

### Author 反馈
- [ ] 缺口分类：当前4种分类是否足够？
- [ ] 修复策略：哪些类型的缺口修复困难？
- [ ] 工具调用：是否需要更多 Skill 辅助？

### 流程改进建议
- [ ] 发现的新问题
- [ ] 建议的新功能
- [ ] 需要调整的参数
```

### 版本迭代

- **v1.0.0** (当前): 初始版本，基础双 Agent 协作
- **v1.1.0**: 根据首次 MCP 验证反馈改进
- **v1.2.0**: 根据其他章节验证反馈改进

---

## 工作原理

```
+-------------------------------------------------------------------+
|                   Chapter Content Validator                     |
+-------------------------------------------------------------------+
|                                                                   |
|  +--------------+          +--------------+                       |
|  | Learner Agent|  -------> | Author Agent |                       |
|  | (零基础程序员) |  发现缺口  |  (内容作者)  |                       |
|  +--------------+          +--------------+                       |
|         |                        |                               |
|         v                        v                               |
|  +-------------------------------------------------------+        |
|  |           Chapter Content                              |        |
|  |  - README.md                                           |        |
|  |  - concepts/*.md (知识库)                              |        |
|  |  - experiments/*/README.md (实验)                     |        |
|  +-------------------------------------------------------+        |
+-------------------------------------------------------------------+
```

## 使用方法

### 基础用法

```bash
# 验证 MCP 章节
/chapter-content-validator --chapter=agent/mcp-deep-dive

# 指定场景类型
/chapter-content-validator --chapter=agent/mcp-deep-dive --scenario=integration
```

### 自定义场景

```bash
/chapter-content-validator \
  --chapter=agent/mcp-deep-dive \
  --simple-scenario="实现一个文件批量处理 Server" \
  --complex-scenario="实现一个 GitHub API 集成 Server"
```

## Agent 角色

### Learner Agent (零基础程序员)

**约束**:
- 不能搜索互联网
- 不能使用外部知识
- 只能查阅 Chapter 内的文档

**输出**: 知识缺口报告
- 缺失点位置 (哪个文件、哪一步)
- 缺失信息类型 (概念/步骤/代码)
- 影响说明 (导致无法完成哪个场景)

### Author Agent (内容作者)

**能力**:
- 分析 Learner 的缺口报告
- 补充缺失的概念文档
- 完善实验步骤
- 修复代码示例

## 输出格式

### 知识缺口报告

```markdown
## 知识缺口报告

### 缺失点 1: XXX
- **位置**: concepts/xxx.md
- **问题**: 当前内容只解释了概念 X，但没有说明如何应用
- **影响**: 无法完成 Simple Scenario 的第 3 步
- **建议**: 添加一个代码示例展示...
```

### 验证结果摘要

```
=== Chapter Validation Summary ===
Status: PASSED/FAILED
Iterations: 3
Simple Scenario: PASSED
Complex Scenario: PASSED
Gaps Resolved: 5
Gaps Remaining: 0
```

## 章节配置文件

每个章节可以定义 `.chapter-validator.yaml`:

```yaml
validation:
  experiments:
    - experiments/01-protocol-inspector
    - experiments/02-mcp-server

  prerequisites:
    - TypeScript
    - Node.js
    - "Reading concepts/*.md"

  scenarios:
    simple:
      type: tool
      description: "实现一个文件批量处理 Server"
      verify: "Server 能响应 tools/list 并返回自定义工具"

    complex:
      type: integration
      description: "实现一个 GitHub API 集成 Server"
      verify: "能调用 GitHub API 并返回 issue 列表"
```

## 相关文档

- [完整范式文档](/docs/frameworks/chapter-validation-paradigm.md)
- [MCP 章节示例](/agent/mcp-deep-dive/.chapter-validator.yaml)
