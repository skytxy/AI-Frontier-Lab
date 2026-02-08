---
description: "Experience-driven collaboration engine for validating, generating, and optimizing educational content. Supports dynamic agent collaboration modes that evolve from execution history."

command: docwise

parameters:
  chapter:
    description: "Chapter path relative to project root (e.g. agent/mcp-deep-dive, algo/attention/self-attention)"
    type: string
    required: false

  scenario:
    description: "Scenario description or path to scenario file (@/path/to/scenario.yaml)"
    type: string
    required: false

  complexity:
    description: "Override auto-detected complexity: simple, medium, complex, advanced"
    type: string
    enum: [simple, medium, complex, advanced]
    required: false

  focus:
    description: "For check mode: what to focus on (links, logic, content, all)"
    type: string
    enum: [links, logic, content, all]
    default: all
    required: false

  max_iterations:
    description: "Maximum iteration count (default: 5)"
    type: number
    default: 5

  auto_confirm:
    description: "Skip scenario confirmation and use auto-generated scenario directly"
    type: boolean
    default: false
---

# Docwise

Experience-driven documentation workflow automation engine. Generates, maintains, checks, and optimizes educational content through dynamic multi-agent collaboration that evolves with every execution.

## Commands

### :new (Create Content)

Generate new chapter content from scenario description.

**Usage**:
```
/docwise:new "implement a file batch rename Server"
/docwise:new "实现GitHub API集成Server" --complexity=complex
/docwise:new --scenario=@/path/to/scenario.yaml --auto_confirm
```

**Flow**:
1. **Parse**: Analyze user's description, extract requirements
2. **Detect**: Auto-detect complexity (simple/medium/complex/advanced)
3. **Generate**: Create structured scenario based on chapter type
4. **Confirm**: Show scenario to user, wait for approval
5. **Execute**: Run dual-agent (Author creates, Learner validates)

**Scenario Template**:
```yaml
name: string
description: string
complexity: simple | medium | complex | advanced

prerequisites:
  - concept: string
    required: true

success_criteria:
  - criterion: string
    verification: string

context:
  chapter_type: agent | algo
  existing_content: string[]  # for improve mode
```

### :improve (Optimize Content)

Improve existing chapter content with new requirements.

**Usage**:
```
/docwise:improve "add link verification to all experiments"
/docwise:improve "补充SDK导入说明" --chapter=agent/mcp-deep-dive
```

**Flow**:
1. **Load**: Read existing chapter content
2. **Analyze**: Identify gaps relative to new requirements
3. **Plan**: Show improvement plan, wait for approval
4. **Execute**: Apply improvements

### :check (Verify Content)

Check for errors, broken links, logic issues.

**Usage**:
```
/docwise:check              -- check everything
/docwise:check --focus=links -- only check links
/docwise:check logic         -- check logic/consistency
```

**Checks**:
- **links**: External HTTP status, internal file existence
- **logic**: Consistency, contradictions, missing steps
- **content**: Completeness, clarity, zero-learner viability

### :record (Save Lesson)

Record lesson learned into paradigm docs.

**Usage**:
```
/docwise:record "internal links should not have .md extension"
/docwise:record "添加UTF-8编码检查规范"
```

**Triggers** (shorthand):
- "record this"
- "记下来"
- "内化这个"
- "update paradigm"

## Scenario Complexity Levels

| Level | Description | Typical Scope |
|-------|-------------|---------------|
| **simple** | Single feature, clear boundaries | One tool, simple logic |
| **medium** | Multiple related features | 2-3 tools, basic error handling |
| **complex** | Multiple components with dependencies | Tools + Resources + Prompts, advanced error handling |
| **advanced** | Complex interactions, security, performance | Full-stack, security considerations, optimization |

## Auto-Detection Rules

Complexity is inferred from description keywords:

**Simple indicators**:
- "single", "basic", "simple", "one tool"
- "简单", "单个", "基础"

**Medium indicators**:
- "multiple", "2-3", "several", "integration"
- "多个", "集成", "2-3个"

**Complex indicators**:
- "full", "complete", "comprehensive", "production"
- "完整", "生产级", "全面"

**Advanced indicators**:
- "security", "performance", "distributed", "scalable"
- "安全", "性能", "分布式", "高可用"

## Confirmation Flow

```yaml
# Generated Scenario (auto-detected: medium)

name: GitHub API集成Server
description: 实现一个能够查询issues、创建issues、添加评论的MCP Server

complexity: medium

prerequisites:
  - concept: HTTP客户端认证
    required: true
  - concept: 错误处理与重试
    required: false

success_criteria:
  - criterion: Server能成功连接GitHub API
    verification: curl检查返回200
  - criterion: 所有tools功能正常
    verification: MCP Inspector测试

Estimated time: 2-3 hours

Confirm? [y/n/edit]
```

User can:
- **y**: Proceed with this scenario
- **n**: Cancel
- **edit**: Modify scenario before execution
- **--auto_confirm**: Skip confirmation entirely

## Chapter Type Specifics

### Agent Chapters (agent/*)

Focus on:
- **Practical implementation**: Working code, real-world usage
- **Integration**: How it fits into larger systems
- **Debugging**: Common issues and solutions

Sections:
- `concepts/` - Theory and background
- `experiments/` - Hands-on implementation
- `integration/` - Real-world usage

### Algo Chapters (algo/*)

Focus on:
- **Paper understanding**: Math, formulas, algorithms
- **Implementation**: Correctness, efficiency
- **Experiments**: Reproducibility, benchmarks

Sections:
- `paper-summary/` - Paper overview
- `implementation/` - Algorithm code
- `experiments/` - Reproducible results
- `application/` - Real-world use

## Three-Layer Architecture

```
Paradigm (docs/frameworks/docwise-paradigm.md)
  -> defines methodology, dependencies, quality standards
Skill (this file + lib/)
  -> generic engine, experience store, mode selection
Config (.docwise/config.yaml)
  -> project-specific chapter types, sections, overrides
```

## Feedback Processing

| Level | Target | Action |
|-------|--------|--------|
| 1 | Chapter content | Apply directly during iteration |
| 2 | Chapter config | Apply directly during iteration |
| 3 | Paradigm doc | Record; prompt user if high priority |
| 4 | Skill code | Record; prompt user if high priority |

## Related Documentation

- Design philosophy: `docs/frameworks/docwise-design.md`
- Project paradigm: `docs/frameworks/docwise-paradigm.md`
- Project config: `.docwise/config.yaml`
