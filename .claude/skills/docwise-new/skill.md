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

Generate new educational content from scenario description via multi-agent collaboration.

**CRITICAL**: When modifying this skill or any Docwise skill code, ALWAYS load skill-creator first. Use `/skill-creator:skill-creator` before making any changes to ensure compliance with best practices.

## When to Use

Use this subcommand when:
- Creating entirely new chapter content from scratch
- Starting a new educational topic that needs validation
- Writing content that should be tested by a zero-knowledge learner

## How It Works

```
User Scenario -> WebSearch Overview -> Generate Topics -> Confirm -> Author Creates -> Learner Validates -> (Loop) -> Artifacts
```

1. **Parse** scenario and detect complexity
2. **Search** web for topic overview and use cases
3. **Generate** scenario with topics and goals
4. **Confirm** scenario with user (skip with `auto_confirm`)
5. **Setup** sandbox with language isolation
6. **Execute** iterative Author -> Learner loop
7. **Generate** learner artifacts (README, learning-log)

## Collaboration Modes

| Mode | When | Agents |
|------|------|--------|
| single | Simple, low-complexity content | Author only |
| dual | Medium complexity, needs validation | Author + Learner |
| triple | Academic papers, math-heavy, security-critical | Author + Learner + Reviewer |

## Complexity Detection

Keywords trigger complexity levels:

| Keywords | Level |
|----------|-------|
| single, basic, simple | simple |
| multiple, integrate, 2-3 | medium |
| full, complete, comprehensive | complex |
| security, performance, advanced | advanced |

## Agent Roles

**Author Agent**: Creates new content files following chapter structure from config.

**Learner Agent**: Zero-knowledge validation - reads only new content, executes practical tasks in sandbox.

**Reviewer Agent** (triple-mode): Verifies technical accuracy, math formulas, cross-references.

## References

Detailed documentation in `references/`:

- **workflow.md** - Complete execution flow with iteration details
- **agent-constraints.md** - Behavioral rules for each agent type
- **scenario-format.md** - Scenario configuration schema
- **artifacts.md** - Output files generated in sandbox

## Project-Specific

Chapter structure, gap categories, and output templates are defined in:
- `.docwise/paradigm.md` - Project methodology
- `.docwise/config.yaml` - Chapter configuration
