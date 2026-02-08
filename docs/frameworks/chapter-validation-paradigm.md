# Chapter Content Validation Paradigm

> **通用方法论文档** - 本文定义了一套可复用的章节内容验证范式，适用于 `agent/` 下的所有子章节（MCP、Skills、Agent Workflows、LSP 等），以及 `algo/` 下的论文解读章节。

## Project Structure

```
AI-Frontier-Lab/
├── agent/                      # Agent 技术大类
│   ├── mcp-deep-dive/         # 子类：协议 (MCP)
│   ├── skills/                # 子类：技能系统
│   ├── agent-workflows/       # 子类：多 Agent 协作
│   └── lsp-enhancement/        # 子类：开发工具
│
└── algo/                       # 算法大类（与 agent 平级）
    ├── foundations/            # 通用基础知识
    │   ├── gradient-descent/
    │   ├── backpropagation/
    │   └── optimization/
    │
    ├── cnn/                   # 大领域目录
    │   ├── lenet/
    │   ├── alexnet/
    │   ├── resnet/
    │   └── ...
    │
    ├── transformer/           # 大领域目录
    │   ├── original/
    │   ├── encoder/
    │   └── decoder/
    │
    ├── rl/                    # 大领域目录
    │   ├── dqn/
    │   ├── policy-gradient/
    │   └── ppo/
    │
    ├── attention/             # 跨领域技术（独立目录）
    │   ├── bahdanau/
    │   ├── self-attention/
    │   └── efficient/
    │
    └── diffusion/             # 跨领域技术
        ├── ddpm/
        ├── stable-diffusion/
        └── diffusion-lm/
```

## Relationship with Skill Implementation

```
+-------------------------------------------------------------------+
|                    Paradigm (通用方法论)                         |
|    docs/frameworks/chapter-validation-paradigm.md                |
|                                                                   |
|  适用于 agent/ 和 algo/ 下所有章节的验证范式                          |
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
|    algo/<chapter>/.chapter-validator.yaml                         |
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
| **1** | Chapter content (concepts/, experiments/, paper-summary/, etc.) | Single chapter | Apply directly | Missing concept, unclear step, formula derivation |
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
| `formula_unclear` | Math derivation missing | Add explanation to paper-summary/ | 1 (algo) |
| `implementation_gap` | Paper to code mapping unclear | Add bridge explanation | 1 (algo) |
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
  # List of content sections to validate
  sections:
    - concepts/
    - experiments/
    - paper-summary/

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

## Adapting for Different Chapter Types

### Agent Chapters (agent/**)

The paradigm works directly for all agent sub-categories:

| Chapter | Typical Structure | Example Scenario |
|---------|------------------|------------------|
| **mcp-deep-dive** | concepts/, experiments/ | Implement MCP Server |
| **skills** | platform comparison, experiments/ | Develop custom Skill |
| **agent-workflows** | framework调研, experiments/ | Build multi-agent system |
| **lsp-enhancement** | protocol analysis, prototypes/ | Build AI LSP prototype |

No adaptation needed — use the same `.chapter-validator.yaml` format.

### Algo Chapters (algo/**)

Algo chapters are organized by domain (cnn, transformer, rl, attention, diffusion, etc.) and specific technique within that domain:

```yaml
# algo/attention/self-attention/.chapter-validator.yaml
validation:
  sections:
    - paper-summary/      # 论文解读
    - implementation/     # 算法实现
    - experiments/        # 实验验证

  prerequisites:
    - "algo/foundations/backprop"
    - "Math: Linear algebra, calculus"
    - "Framework: PyTorch / JAX"

  scenarios:
    reproduction:
      type: paper
      description: "复现论文中的核心实验"
      verify: "能实现算法并获得与论文相近的结果"

    application:
      type: apply
      description: "将算法应用到实际问题"
      verify: "能修改代码解决自己的任务"

    visualization:
      type: demo
      description: "可视化 Attention 权重"
      verify: "能生成注意力热力图"
```

### Key Differences

| Aspect | Agent Chapters | Algo Chapters |
|--------|---------------|---------------|
| **Content Source** | Technical docs, APIs | Research papers |
| **Learner's Task** | Build/integrate tools | Reproduce/apply algorithms |
| **Common Gaps** | Protocol details, API usage | Formula derivation, math implementation |
| **Output** | Working tool/server | Reproducible experiment |

### Step 1: Create `.chapter-validator.yaml`

Define sections, prerequisites, and scenarios specific to your chapter.

### Step 2: Run Validation

```bash
# For agent chapters
/chapter-content-validator --chapter=agent/mcp-deep-dive

# For algo chapters (domain/technique format)
/chapter-content-validator --chapter=algo/attention/self-attention

# Or for foundations
/chapter-content-validator --chapter=algo/foundations/backprop
```

### Step 3: Review Results

The validator produces:
- `validation-log.md` - Iteration history in chapter directory
- Applied updates (Level 1-2) - Directly modified
- Suggestions (Level 3-4) - Recorded for review

## Case Studies

### Case 1: MCP Deep Dive (Agent)

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

### Case 2: Self-Attention (Algo)

**Location**: `algo/attention/self-attention/`

### Typical Gaps

1. **Gap**: Formula derivation from 1 to N attention unclear
   - **Fix**: Add bridge section in paper-summary/
   - **Level**: 1

2. **Gap**: Matrix dimensions in code don't match paper notation
   - **Fix**: Add notation-to-code mapping in implementation/
   - **Level**: 1

3. **Gap**: How to compute attention weights for variable-length sequences
   - **Fix**: Add padding/masking explanation
   - **Level**: 1

## Extending the Framework

### Adding New Gap Types

When a new gap category emerges during validation:

1. Recognize it as a Level 3 feedback (paradigm update)
2. Add to `Gap Categories` section in this document
3. Document fix strategy

### Chapter-Specific Adaptations

For chapter-specific learning patterns, the Learner behavior can be extended in `lib/learner.ts` without modifying the core Skill:

```typescript
// For algo chapters: paper-aware learning
async attemptPaperScenario(scenario: PaperScenario): Promise<AttemptResult> {
  // Paper-specific logic
}

// For agent chapters: tool-based learning
async attemptToolScenario(scenario: ToolScenario): Promise<AttemptResult> {
  // Tool-specific logic
}
```

## Related Resources

- [Skill Implementation](/.claude/skills/chapter-content-validator/) - The actual Skill code
- [Capability Building Mandate](/.claude/rules/capability-building.md) - Project quality standards
- [MCP Deep Dive Example](/agent/mcp-deep-dive/) - Agent chapter with validator config
- [Skills Chapter](/agent/skills/) - Agent Skills comparison and implementation

---

**Version**: 2.1.0 (Multi-Category Support)
**Last Updated**: 2026-02-08
