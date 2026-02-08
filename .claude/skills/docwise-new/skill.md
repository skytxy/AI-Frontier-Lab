---
name: docwise:new
description: Generate new chapter content from scenario description. Use when creating new educational content for agent/ or algo/ chapters.
command: docwise:new
argument-hint: "[scenario description]"
parameters:
  scenario:
    description: "Description of what to generate"
    type: string
    required: true
  chapter:
    description: "Target chapter path (e.g. agent/mcp-deep-dive)"
    type: string
    required: false
  complexity:
    description: "Override auto-detect (simple/medium/complex/advanced)"
    type: string
    enum: [simple, medium, complex, advanced]
    required: false
  mode:
    description: "Force collaboration mode (single/dual/triple)"
    type: string
    enum: [single, dual, triple]
    required: false
  auto_confirm:
    description: "Skip scenario confirmation"
    type: boolean
    default: false
    required: false
---

# Docwise: New

Generate new educational content from scenario description via dual-agent collaboration.

## Execution Flow

```
1. PARSE INPUT
   - Extract scenario description from <args>
   - Detect complexity from keywords
   - Detect content_type from chapter path (agent/algo)

2. MATCH PATTERN (.docwise/config.yaml -> seed_patterns)
   - Find seed_pattern matching generate + complexity + keywords
   - Get recommended_mode (usually dual-agent for generate)

3. CONFIRM SCENARIO
   - Show: generated scenario with prerequisites, success_criteria
   - User can edit before execution

4. EXECUTE WITH TASK TOOL (ITERATIVE LOOP)
   Loop (max_iterations from config, default 5):

   a) Spawn Author Agent (subagent_type=general-purpose)
      * Creates new content files (first iteration) or modifies existing (subsequent)
      * Follows chapter structure from config
      * Reports: files created/changed

   b) Spawn Learner Agent (subagent_type=general-purpose)
      * Reads only new/modified content (zero-knowledge validation)
      * Attempts to complete scenario using ONLY the content
      * Reports: completion status, gaps

   c) Check Learner's completion status
      * If COMPLETE: END iteration
      * If gaps found: increment counter, loop back to (a)

5. (triple-agent only) Spawn Reviewer Agent
   * Verifies technical accuracy
   * If issues found: spawn Author to fix, then Learner to re-validate
```

**Critical**: The loop is **Author → Learner → Author → Learner → ...** until Learner confirms COMPLETE.

## Complexity Detection

| Keywords | Level |
|----------|-------|
| single, basic, 简单, 单个 | simple |
| multiple, 2-3, 集成, 多个 | medium |
| full, complete, 完整, 全面 | complex |
| security, performance, 安全, 性能 | advanced |

## Agent Constraints

See `docwise/references/agent-constraints.md` for detailed constraints.

**Author Agent**:
- CAN create new content files
- CAN read paradigm for gap categories
- Reports: files created

**Learner Agent**:
- MUST NOT use external knowledge
- CAN ONLY read newly created files
- Reports: completion status, gaps

## Chapter Structure

Author creates files according to chapter type:

**Agent chapters** (agent/*):
- `concepts/*.md` - Theory and background
- `experiments/*/*.md` - Hands-on implementation

**Algo chapters** (algo/*):
- `paper-summary/*.md` - Paper overview
- `implementation/*.md` - Algorithm code
- `experiments/*/*.md` - Reproducible results

## Example Scenario Output

```yaml
name: GitHub API集成Server
description: 实现一个能够查询issues、创建issues、添加评论的MCP Server
complexity: medium

prerequisites:
  - concept: HTTP客户端认证
    required: true

success_criteria:
  - criterion: Server能成功连接GitHub API
    verification: curl检查返回200
  - criterion: 所有tools功能正常
    verification: MCP Inspector测试
```
