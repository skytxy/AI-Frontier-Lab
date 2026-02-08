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

Optimize existing content for new requirements via multi-agent collaboration.

## When to Use

Use this subcommand when:
- Adding new features to existing content
- Enhancing coverage of specific topics
- Clarifying unclear sections
- Adapting content for new use cases

## How It Works

```
User Requirements -> Current Status -> Generate Focused Scenario -> Confirm -> Learner Analyzes -> Author Fixes -> (Loop) -> Artifacts
```

1. **Parse** requirements and detect complexity
2. **Show** current document status (draft/in-progress/published/completed)
3. **Generate** scenario targeting identified gaps
4. **Confirm** scenario with user
5. **Setup** sandbox with language isolation
6. **Execute** iterative Learner -> Author -> Learner loop
7. **Generate** learner artifacts

## Collaboration Modes

| Mode | When | Agents |
|------|------|--------|
| single | Simple additions, minor clarifications | Author only |
| dual | Medium complexity improvements | Learner + Author |
| triple | Complex enhancements, security-critical | Learner + Author + Reviewer |

## Mode Selection Decision Tree

```
User specifies agent count?
  ├─ User says "single agent" -> single-agent
  ├─ User says "dual agent" or "2 agents" -> dual-agent
  ├─ User says "triple agent" or "3 agents" -> triple-agent
  └─ No specification: Auto-detect below

Detect complexity from keywords:
  ├─ Contains: simple, basic, quick, minor -> single-agent
  ├─ Contains: complex, security, performance, full -> triple-agent
  └─ Default: dual-agent (covers most improvements)
```

## Complexity Detection

| Keywords | Level |
|----------|-------|
| simple, basic | simple |
| medium, multiple | medium |
| complex, full, comprehensive | complex |
| advanced, security, performance | advanced |

## Agent Roles

**Learner Agent**: Analyzes existing content, identifies gaps, executes practical tasks.

**Author Agent**: Fills reported gaps, prioritizes critical > important > minor.

**Reviewer Agent** (triple-mode): Verifies technical accuracy of changes.

## References

Detailed documentation in `references/`:

- **workflow.md** - Complete execution flow with iteration details
- **gap-prioritization.md** - How gaps are categorized and prioritized
- **agent-constraints.md** - Behavioral rules for each agent type
- **artifacts.md** - Output files generated in sandbox

## Project-Specific

Gap categories and quality standards are defined in:
- `.docwise/paradigm.md` - Project methodology, gap categories
- `.docwise/config.yaml` - Chapter configuration
