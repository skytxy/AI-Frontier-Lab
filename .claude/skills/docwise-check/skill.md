---
name: docwise:check
description: Check chapter content for errors, broken links, logic issues. Use when validating agent/ or algo/ chapter quality before publishing or after significant changes.
command: docwise:check
argument-hint: "[--focus=links|logic|content|all]"
parameters:
  chapter:
    description: "Target chapter path (default: current)"
    type: string
    required: false
  focus:
    description: "Validation focus area"
    type: string
    enum: [links, logic, content, all]
    default: all
    required: false
  mode:
    description: "Force collaboration mode (single/dual/triple)"
    type: string
    enum: [single, dual, triple]
    required: false
  fix:
    description: "Auto-fix fixable issues"
    type: boolean
    default: true
    required: false
---

# Docwise: Check

Validate chapter content quality via multi-agent collaboration.

**CRITICAL**: When modifying this skill or any Docwise skill code, ALWAYS load skill-creator first. Use `/skill-creator:skill-creator` before making any changes to ensure compliance with best practices.

## When to Use

Use this subcommand when:
- Validating content before publishing
- Checking after significant content changes
- Verifying link integrity
- Reviewing content logic and completeness

## How It Works

Engage in collaborative dialogue to validate chapter quality:

**Understanding What to Check:**
- Read chapter overview and current status
- Ask questions to understand validation focus
- Discuss which areas matter most: links, logic, or content

**Collaborative Validation Design:**
- Propose a validation scenario based on chapter type
- Present conversationally: "Here's what I'm planning to test..."
- Describe what the Learner will attempt to do
- Iterate on scope until aligned

**Running Validation:**
- Setup sandbox and run the validation loop
- Learner executes documented steps (not just visual check)
- Author fixes issues if `fix=true`
- Present findings incrementally as they emerge

**Post-Validation Discussion:**
- Share what Learner discovered (issues, blockers, successes)
- Discuss which issues need fixing vs. can be deferred
- Ask if user wants to re-validate specific areas
- Generate final artifacts (README, learning-log)

## Focus Areas

| Focus | What It Checks |
|-------|----------------|
| `links` | External link status, internal file existence, extension format |
| `logic` | Step sequences, contradictions, referenced concepts, prerequisites |
| `content` | Completeness, clarity, code examples |
| `all` | All of the above (default) |

## Collaboration Modes

| Mode | When | Agents |
|------|------|--------|
| single | Quick checks, non-critical content | Learner only |
| dual | Standard validation | Learner + (optional) Author |
| triple | Critical content, math-heavy | Learner + Author + Reviewer |

## Agent Roles

**Learner Agent**: Executes content as zero-knowledge learner, reports issues.

**Author Agent**: (if `fix=true`) Fixes reported issues, prioritizes critical > important > minor.

**Reviewer Agent** (triple-mode): Verifies technical accuracy of fixes.

## References

Detailed documentation in `references/`:

- **workflow.md** - Complete execution flow with iteration details
- **check-categories.md** - Detailed definitions of each check type
- **agent-constraints.md** - Behavioral rules for each agent type
- **report-format.md** - Validation report output format

## Project-Specific

Quality standards, gap categories, and link format conventions are defined in:
- `.docwise/paradigm.md` - Project methodology
- `.docwise/config.yaml` - Chapter configuration
