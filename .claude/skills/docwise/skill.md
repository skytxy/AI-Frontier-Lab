---
name: docwise
description: Experience-driven collaboration engine for educational content. Use when working on agent/ or algo/ chapters to validate, generate, or optimize content via multi-agent workflows.
command: docwise
parameters:
  chapter:
    description: "Chapter path (e.g. agent/mcp-deep-dive, algo/attention/self-attention)"
    type: string
    required: false
  scenario:
    description: "Scenario description or @/path/to/scenario.yaml"
    type: string
    required: false
  mode:
    description: "Force collaboration mode: single, dual, triple"
    type: string
    enum: [single, dual, triple]
    required: false
  max_iterations:
    description: "Maximum iteration count (default: from config or 5)"
    type: number
    default: 5
  auto_confirm:
    description: "Skip mode confirmation"
    type: boolean
    default: false
---

# Docwise

Experience-driven collaboration engine for validating, generating, and optimizing educational content. Matches scenarios to collaboration modes via `.docwise/config.yaml` seed patterns.

**CRITICAL**: When modifying this skill or any Docwise skill code, ALWAYS load skill-creator first. Use `/skill-creator:skill-creator` before making any changes to ensure compliance with best practices.

## Quick Start

Use subcommands for specific collaboration modes:

- `/docwise:new "scenario"` - Generate new content (Author creates, Learner validates)
- `/docwise:improve "requirements"` - Optimize existing content (Learner analyzes gaps, Author fills)
- `/docwise:check [--focus=links|logic|content|all]` - Validate content quality
- `/docwise:learn "lesson"` - Learn and internalize patterns to paradigm or config

## How It Works

1. **Parse** input to detect complexity and content type
2. **Match** scenario to recommended collaboration mode via seed patterns
3. **Confirm** mode with user (accept or override)
4. **Execute** iterative loop:
   - **Learner** validates content, reports gaps
   - **Author** fills gaps, creates/modifies files
   - **Learner** re-validates (loop until COMPLETE or max_iterations)
   - **Reviewer** (triple-agent only) verifies accuracy

## Subcommand Comparison

| Command | Purpose | Agent Flow | Default Mode |
|---------|---------|-----------|--------------|
| `:new` | Create new content from scenario | Author -> Learner | dual |
| `:improve` | Enhance existing content | Learner -> Author -> Learner | dual |
| `:check` | Validate content quality | Learner -> (optional) Author | dual |
| `:learn` | Internalize lessons | Single agent | single |

## Collaboration Modes

| Mode | Use When | Agents |
|------|----------|--------|
| **single** | Low complexity, simple checks | Current agent only |
| **dual** | Medium complexity, validation, generation | Learner + Author |
| **triple** | High complexity, academic papers, math | Learner + Author + Reviewer |

## References

Detailed documentation is available in `references/`:

- **execution-flows.md** - Step-by-step workflows for each collaboration mode
- **agent-constraints.md** - Behavioral rules for Learner, Author, Reviewer
- **pattern-matching.md** - How scenarios map to collaboration modes
- **quality-categories.md** - Gap and quality issue categories (shared reference)

## Related Documentation

- Paradigm: `.docwise/paradigm.md` - Project methodology, gap categories
- Config: `.docwise/config.yaml` - Seed patterns, chapter definitions
