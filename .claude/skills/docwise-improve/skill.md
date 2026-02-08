---
name: docwise:improve
description: Improve existing chapter content with new requirements. Use when enhancing agent/ or algo/ chapters with additional features or clarifications.
command: docwise:improve
argument-hint: "[requirements]"
parameters:
  scenario:
    description: "Improvement requirements description"
    type: string
    required: true
  chapter:
    description: "Target chapter path (e.g. agent/mcp-deep-dive)"
    type: string
    required: false
  mode:
    description: "Force collaboration mode (single/dual/triple)"
    type: string
    enum: [single, dual, triple]
    required: false
  max_iterations:
    description: "Maximum iteration count (default: from config or 5)"
    type: number
    default: 5
    required: false
---

# Docwise: Improve

Optimize existing content for new requirements via dual-agent collaboration.

## Execution Flow

```
1. PARSE INPUT
   - Extract: chapter (from args or infer from context)
   - Extract: scenario/requirements from <args>
   - Detect: complexity (simple/medium/complex/advanced)

2. MATCH PATTERN (.docwise/config.yaml -> seed_patterns)
   - Find seed_pattern matching optimize + complexity + keywords
   - Get recommended_mode (usually dual-agent for optimize)

3. CONFIRM MODE
   - Show matched pattern and recommended mode
   - User can accept or override

4. EXECUTE WITH TASK TOOL (ITERATIVE LOOP)
   Loop (max_iterations from config, default 5):

   a) Spawn NEW Learner Agent (subagent_type=general-purpose)
      * Reads existing chapter content (first iteration) or modified files (subsequent)
      * Identifies gaps relative to new requirements
      * Reports: completion status, gaps with locations and categories

   b) Check Learner's completion status
      * If COMPLETE: END iteration
      * If gaps found: Continue

   c) Spawn Author Agent (subagent_type=general-purpose)
      * Reads Learner's gap report
      * Creates/modifies content files to fill gaps
      * Reports: files changed

   d) Increment iteration counter, loop back to (a) with NEW Learner instance

5. (triple-agent only) Spawn Reviewer Agent
   * Verifies technical accuracy
   * If issues found: spawn Author to fix, then Learner to re-validate
```

**Critical**: The loop is **Learner → Author → Learner → Author → ...** until Learner confirms COMPLETE.

## Mode Selection Decision Tree

```
User specifies agent count?
  ├─ User says "use single agent" → single-agent mode
  ├─ User says "use dual agent" or "2 agents" → dual-agent mode
  ├─ User says "use triple agent" or "3 agents" → triple-agent mode
  └─ No specification: Auto-detect below

Detect complexity from keywords:
  ├─ Contains: simple, basic, quick, minor → single-agent
  ├─ Contains: complex, security, performance, full, 完整, 全面 → triple-agent
  └─ Default: dual-agent (covers most improvements)
```

| Trigger | Mode | Reason |
|---------|------|--------|
| User explicitly specifies agent count | As specified | User knows best |
| Keywords: simple, basic, quick, minor | single-agent | Low complexity |
| Keywords: complex, security, performance, full | triple-agent | High stakes/complexity |
| No explicit keywords | dual-agent | Balanced default |

## Complexity Detection

| Keywords | Level |
|----------|-------|
| simple, basic, 简单 | simple |
| medium, 多个 | medium |
| complex, full, 完整, 全面 | complex |
| advanced, security, performance, 安全, 性能 | advanced |

## Agent Constraints

See `docwise/references/agent-constraints.md` for detailed constraints.

**Learner Agent**:
- MUST NOT use external knowledge
- CAN ONLY read chapter files + declared prerequisites
- Reports: gaps with locations and categories

**Author Agent**:
- Reads Learner's gap report
- CAN modify content files
- Reports: files changed

## Gap Categories

Learner reports gaps using categories from `docwise/references/quality-categories.md`.

**When quality issues are found**, Author should consolidate/prune rather than expand.

## Example

**Input**: `/docwise:improve "mcp, 复杂场景"`

**Process**:
1. Parse: collaboration mode=optimize, chapter=agent/mcp-deep-dive, complexity=high
2. Match: seed_pattern `optimize-existing` -> recommended_mode=dual-agent
3. Confirm: Execute dual-agent? [y/n]
4. Execute:
   - Learner: Reads mcp-deep-dive, identifies gaps for "复杂场景"
   - Author: Adds missing content (e.g., advanced patterns, error handling)
5. Output: Files changed list
