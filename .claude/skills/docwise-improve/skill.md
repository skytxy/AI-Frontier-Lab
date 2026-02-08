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

2. SHOW OVERVIEW WITH CURRENT STATUS (NEW)
   - Check document status
   - Display: 【是什么】【有什么用】
   - Display: 【当前概况】已覆盖/缺口 (from doc summary)
   - If status=completed: show warning, require confirmation

3. GENERATE SCENARIO FOCUSED ON GAPS (NEW)
   - Analyze current coverage from doc summary
   - WebSearch for best practices on missing topics
   - Generate scenario targeting identified gaps
   - Show scenario confirmation dialog

4. CONFIRM SCENARIO (NEW)
   - User can accept or adjust scenario/focus areas

5. SETUP SANDBOX (NEW)
   - Detect chapter language
   - Create sandbox directory
   - Setup language isolation

6. EXECUTE WITH TASK TOOL (ITERATIVE LOOP)
   Loop (max_iterations from config, default 5):

   a) Spawn Learner Agent (subagent_type=general-purpose)
      * Reads existing chapter content (first iteration) or modified files (subsequent)
      * Executes practical tasks to test documentation
      * Reports: completion status, gaps, blockers

   b) Check Learner's completion status
      * If COMPLETE: Generate artifacts (README, learning-log)
      * If gaps found: Continue

   c) Spawn Author Agent (subagent_type=general-purpose)
      * Reads Learner's gap report
      * Prioritizes: critical > important > minor
      * Shows change summary for confirmation
      * Creates/modifies content files to fill gaps
      * Reports: files changed

   d) Increment iteration counter, loop back to (a)

7. (triple-agent only) Spawn Reviewer Agent
   * Verifies technical accuracy
   * If issues found: spawn Author to fix, then Learner to re-validate

8. GENERATE LEARNER ARTIFACTS (NEW)
   - Create README.md in sandbox
   - Create learning-log.md
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

## Link Format Conventions

**CRITICAL**: Internal links MUST follow the format specified in `.docwise/paradigm.md` under "Link Format Conventions".

Before modifying any links:
1. Read `.docwise/paradigm.md` section "Link Format Conventions"
2. Verify against actual site build output
3. Project-specific rules (e.g., `/topics/` vs `/agent/`) are defined in paradigm, NOT in this skill

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
