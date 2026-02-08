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

**CRITICAL**: When modifying this skill or any Docwise skill code, ALWAYS load skill-creator first. Use `/skill-creator:skill-creator` before making any changes to ensure compliance with best practices.

## When to Use

Use this subcommand when:
- User has a practical need that chapter content should support
- Verifying if existing documentation is sufficient for real tasks
- Adding new features to existing content
- Enhancing coverage of specific topics
- Clarifying unclear sections

**Key Principle**: When user says "I want to build X" and X relates to a chapter,
generate a validation scenario where Learner tries to build X using only the doc.
This validates documentation quality through practical testing.

## How It Works

Engage in collaborative dialogue to refine and validate improvements:

**Understanding the Requirement:**
- Clarify what the user wants to build or achieve
- Ask questions one at a time to understand the scope
- Focus on practical validation scenarios (not abstract "improvements")

**Collaborative Scenario Design:**
- Propose a validation scenario based on user need
- Present options conversationally: "Here's what I'm thinking..."
- Iterate on the scenario until aligned
- Example: "Learner tries to implement task completion notifications using only the doc"

**Execution and Validation:**
- Setup sandbox and run the dual-agent loop
- Learner validates content against the scenario
- Author fixes gaps discovered
- Present findings incrementally, discuss next steps

**Key Difference from Linear Workflows:**
This is a continuous dialogue, not a confirm-and-execute flow.
The conversation evolves as findings emerge from validation.

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
