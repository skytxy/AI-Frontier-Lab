# Chapter Content Validation Paradigm

> **通用方法论文档** - 本文定义了一套可复用的章节内容验证范式，不仅限于 MCP 章节，也可应用于 Agent Teams、LSP、Skills 等所有章节。

## Relationship with Skill Implementation

```
+-------------------------------------------------------------------+
|                    Paradigm (通用方法论)                         |
|    docs/frameworks/chapter-validation-paradigm.md                |
|                                                                   |
|  可复用的设计思想、最佳实践、迁移指南                              |
+-------------------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------------------+
|                 Skill Implementation (具体实现)                  |
|    .claude/skills/chapter-content-validator/                      |
|                                                                   |
|  Learner/Author Agent, Coordinator, FeedbackProcessor             |
+-------------------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------------------+
|               Chapter Config (章节配置)                          |
|    agent/<chapter>/.chapter-validator.yaml                        |
|                                                                   |
|  场景定义、验证标准、知识检查点                                    |
+-------------------------------------------------------------------+
```

## Overview

The Chapter Content Validator is a **dual-agent collaboration framework** for validating and improving educational content. It simulates a zero-knowledge learner attempting to complete practical scenarios, then iteratively fixes content gaps based on discovered issues.

## Core Philosophy

> **"Give a man a fish, and you feed him for a day. Teach a man to fish, and you feed him for a lifetime."**

This is not a document validation tool — it's a learning assistant that helps users truly master knowledge through practical scenarios.

### Design Principles

1. **User-Defined Scenarios** - Users can describe their actual application needs, not limited to predefined easy/hard scenarios
2. **Preserve Learning Artifacts** - Learner's implementation code is available for user reference (though not committed to repo)
3. **Layered Feedback** - Automatically apply document fixes, carefully handle global changes
4. **Continuous Improvement** - Every execution makes the Skill and paradigm smarter

## Layered Feedback Mechanism

The core innovation is a **layer-level feedback system** that automatically routes feedback based on its impact scope:

```
+---------------------------------------------------------------+
|                    Each Validation Run                       |
+---------------------------------------------------------------+
           |                    |                    |
           v                    v                    v
+----------------+    +----------------+    +------------------+
| Level 1:       |    | Level 2:       |    | Level 3-4:       |
| Chapter Content |    | Chapter Config |    | Paradigm/Skill    |
|                |    |                |    |                  |
| Impact: Single  |    | Impact: Single  |    | Impact: Multi/    |
|         Chapter |    |         Chapter |    |         Global    |
| Action: Apply   |    | Action: Apply   |    | Action: Record    |
+----------------+    +----------------+    +------------------+
```

### Feedback Levels

| Level | Target | Impact Scope | Action | Examples |
|-------|--------|-------------|--------|----------|
| **1** | Chapter content (concepts/, experiments/) | Single chapter | Apply directly | Missing concept, unclear step |
| **2** | Chapter config (.chapter-validator.yaml) | Single chapter | Apply directly | Validation criteria wrong |
| **3** | Paradigm document (this file) | Cross-chapter | Record suggestions | New gap type needed |
| **4** | Skill code (lib/*.ts, skill.md) | Global | Record suggestions | Prompt clarity issues |

### Output Example

```markdown
## 验证完成

### 直接应用的修改 (Level 1-2)
- [x] concepts/stdio-transport.md: 添加 console.error 日志说明
- [x] .chapter-validator.yaml: 将验证标准从"能启动"调整为"能响应 tools/list"

### 记录的建议 (Level 3-4)
- [ ] paradigm.md: 添加新缺口类型 "dependency_missing"
- [ ] skill.md: 优化 Learner 约束描述，强调"不能搜索互联网"

### 查看详情
运行 /chapter-content-validator --review=iteration-1 查看建议详情并决定是否应用
```

## Validation Loop

```
for iteration in 1..max_iterations:
    1. User defines scenario (template / freeform / brainstorming)
    2. Learner reads chapter content
    3. Learner attempts scenario
    4. If success: VALIDATION COMPLETE
       If stuck: Learner generates gap report
    5. Author fixes gaps
    6. Collect feedback from Learner and Author
    7. Classify feedback by impact level
    8. Apply Level 1-2 updates directly
    9. Record Level 3-4 suggestions for review
    10. Continue loop
```

## Gap Categories

| Category | Description | Example Fix | Level |
|----------|-------------|-------------|-------|
| `concept_missing` | Concept not explained | Add to concepts/*.md | 1 |
| `step_unclear` | Step instructions vague | Add detail/examples | 1 |
| `code_error` | Code has bugs | Fix syntax/logic | 1 |
| `context_missing` | Why/when unclear | Add motivation | 1 |
| `validation_criteria` | Success criteria wrong | Update .chapter-validator.yaml | 2 |
| `new_gap_type` | New category needed | Add to paradigm.md | 3 |
| `prompt_issue` | Prompt not clear | Update skill.md | 4 |

## Scenario Modes

### 1. Template Mode (预设模板)

Use predefined scenarios from chapter config:

```bash
/chapter-content-validator --chapter=agent/mcp-deep-dive --scenario_mode=template --preset_scenario=basic-tool
```

### 2. Freeform Mode (自由描述)

Describe your actual needs directly:

```bash
/chapter-content-validator \
  --chapter=agent/mcp-deep-dive \
  --scenario_mode=freeform \
  --scenario="我需要实现一个能批量重命名文件的 MCP Server，支持正则匹配模式"
```

### 3. Brainstorming Mode (引导细化)

When scenario is unclear, the Skill refines through Q&A:

```bash
/chapter-content-validator \
  --chapter=agent/mcp-deep-dive \
  --scenario_mode=brainstorming \
  --scenario="我想做一个 MCP Server"
```

The Skill will then ask:
- What is the main purpose of this Server?
- What tools are needed?
- Any special validation requirements?

## Chapter Configuration

Each chapter can define a `.chapter-validator.yaml`:

```yaml
validation:
  experiments:
    - experiments/01-basics
    - experiments/02-advanced

  prerequisites:
    - "Language: TypeScript"
    - "Reading: concepts/foundations.md"

  # Preset scenarios for template mode
  scenarios:
    basic-tool:
      type: tool
      description: "Build a basic server"
      requirements:
        - "Server starts"
        - "Returns expected response"
      verify: "Learner can complete from content alone"

    api-integration:
      type: integration
      description: "Integrate with external API"
      requirements:
        - "Authenticates successfully"
        - "Handles API errors"
```

## Adapting for Other Chapters

### Step 1: Create `.chapter-validator.yaml`

Define experiments, prerequisites, and scenarios specific to your chapter.

### Step 2: Run Validation

```bash
/chapter-content-validator --chapter=your/chapter
```

### Step 3: Review Results

The validator produces:
- `validation-log.md` - Iteration history in chapter directory
- Applied updates (Level 1-2) - Directly modified
- Suggestions (Level 3-4) - Recorded for review

## Case Study: MCP Deep Dive

### Initial Issues Found

1. **Gap**: stdio transport logging not explained
   - **Fix**: Added section on why `console.log` breaks protocol
   - **Level**: 1 (concepts/)

2. **Gap**: Zod schema usage unclear
   - **Fix**: Added schema examples with explanations
   - **Level**: 1 (experiments/)

3. **Gap**: New gap type "api_integration_pattern" discovered
   - **Action**: Recorded suggestion for paradigm.md
   - **Level**: 3

### Results

- Zero-knowledge learner completed scenario after 2 iterations
- validation-log.md shows complete iteration history
- One Level 3 suggestion recorded for paradigm improvement

## Extending the Framework

### Adding New Gap Types

When a new gap category emerges during validation:

1. Recognize it as a Level 3 feedback (paradigm update)
2. Add to `common_gaps` section in this document
3. Document fix strategy

### Custom Learner Behaviors

For chapter-specific learning patterns, extend `lib/learner.ts`:

```typescript
async attemptScenario(scenario: Scenario): Promise<AttemptResult> {
  // Your custom attempt logic
}
```

## Related Resources

- [Skill Implementation](/.claude/skills/chapter-content-validator/) - The actual Skill code
- [Capability Building Mandate](/.claude/rules/capability-building.md) - Project quality standards
- [MCP Deep Dive Chapter](/agent/mcp-deep-dive/) - Example chapter with validator config

---

**Version**: 2.0.0 (Layered Feedback)
**Last Updated**: 2026-02-08
