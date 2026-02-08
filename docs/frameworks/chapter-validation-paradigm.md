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
2. **Preserve Learning Artifacts** - Learner's implementation code is stored in chapter path (not committed to git) for user reference
3. **Layered Feedback** - Automatically apply document fixes, carefully handle global changes
4. **Automated Brainstorming** - Scenario refinement is automated and context-aware, not rigid rule-based
5. **End-of-Process Log** - validation-log.md is generated once at the end to maintain coherence, avoiding incremental redundancy

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
| **1** | Chapter content files (defined in .chapter-validator.yaml) | Single chapter | Apply directly | Missing concept, unclear step, formula derivation |
| **2** | Chapter config (.chapter-validator.yaml) | Single chapter | Apply directly | Validation criteria wrong |
| **3** | Paradigm document (this file) | Cross-chapter | Record (prompt if significant) | New gap type needed |
| **4** | Skill code (lib/*.ts, skill.md) | Global | Record (prompt if significant) | Prompt clarity issues |

**Significant Suggestions**: High-priority Level 3-4 suggestions are prompted to the user/agent for potential direct application. Lower priority suggestions are only recorded in validation-log.md.

### Output Example

```markdown
## 验证完成

### 直接应用的修改 (Level 1-2)
- [x] concepts/stdio-transport.md: 添加 console.error 日志说明
- [x] .chapter-validator.yaml: 将验证标准从"能启动"调整为"能响应 tools/list"

### 记录的建议 (Level 3-4)
- [ ] paradigm.md: 添加新缺口类型 "dependency_missing"
- [ ] skill.md: 优化 Learner 约束描述，强调"不能搜索互联网"

### 重要 Level 3-4 建议
检测到高优先级建议 "prompt_improvement"，是否直接应用？
- [ ] 是，立即应用
- [ ] 否，仅记录到 validation-log.md

### 查看详情
validation-log.md 已在验证流程结束时一次性生成，包含完整迭代历史。
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

After loop completion:
    11. Generate validation-log.md ONCE (not incrementally)
    12. Prompt for significant Level 3-4 suggestions if any
```

## Gap Categories

| Category | Description | Level |
|----------|-------------|-------|
| `concept_missing` | Concept not explained | 1 |
| `step_unclear` | Step instructions vague | 1 |
| `code_error` | Code has bugs | 1 |
| `context_missing` | Why/when unclear | 1 |
| `formula_unclear` | Math derivation missing | 1 |
| `implementation_gap` | Paper to code mapping unclear | 1 |
| `validation_criteria` | Success criteria wrong | 2 |
| `new_gap_type` | New category needed | 3 |
| `prompt_issue` | Prompt not clear | 4 |

**Note**: The specific target files for Level 1 fixes depend on the chapter structure, defined in each chapter's `.chapter-validator.yaml`.

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

When scenario is unclear, the Skill refines through automated, context-aware Q&A:

```bash
/chapter-content-validator \
  --chapter=agent/mcp-deep-dive \
  --scenario_mode=brainstorming \
  --scenario="我想做一个 MCP Server"
```

The Skill will ask context-aware questions based on chapter type:
- For MCP: "What transport (stdio/SSE)?", "What external APIs?"
- For Skills: "Which AI platforms?", "What parameters?"
- For Algo: "Reproduce paper or apply algorithm?", "What framework?"

**Note**: Questions are generated automatically, not from rigid rule lists. The system infers chapter type and adjusts questions accordingly.

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

The paradigm works for all chapters under `agent/` and `algo/`. Each chapter defines its structure and scenarios in its `.chapter-validator.yaml`.

### Agent Chapters (agent/**)

| Chapter | Example Config |
|---------|----------------|
| **mcp-deep-dive** | `sections: [concepts/, experiments/]` |
| **skills** | `sections: [platform-comparison/, experiments/]` |
| **agent-workflows** | `sections: [framework-survey/, experiments/]` |
| **lsp-enhancement** | `sections: [protocol-analysis/, prototypes/]` |

```yaml
# agent/mcp-deep-dive/.chapter-validator.yaml
validation:
  sections:
    - concepts/
    - experiments/
  scenarios:
    basic-tool:
      type: tool
      description: "Implement MCP Server"
```

### Algo Chapters (algo/**)

Algo chapters are organized by domain (cnn, transformer, rl, attention, diffusion) with specific techniques inside each domain.

**Naming Convention**:
- General concepts: Use shorthand (`self-attention`, `resnet`)
- Milestone papers: Use full paper name (`attention-is-all-you-need`)
- Common abbreviations: Use abbreviation (`lenet`, `vgg`, `ddpm`)

| Domain | Example Chapters |
|--------|-----------------|
| **cnn** | `lenet/`, `alexnet/`, `resnet/` |
| **transformer** | `original/`, `encoder/` |
| **attention** | `bahdanau/`, `self-attention/`, `attention-is-all-you-need/` |
| **diffusion** | `ddpm/`, `stable-diffusion/` |

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
chapter-content-validator --chapter=algo/attention/attention-is-all-you-need
```

### Step 3: Review Results

The validator produces:
- `validation-log.md` - Generated ONCE at end of process in chapter directory (not incremental)
- Applied updates (Level 1-2) - Directly modified during iterations
- Suggestions (Level 3-4) - Recorded for review, significant ones prompted for application

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

**Version**: 2.2.0 (Automated Brainstorming + End-of-Process Log)
**Last Updated**: 2026-02-08
