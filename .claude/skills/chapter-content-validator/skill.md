---
description: "Experience-driven collaboration engine for validating, generating, and optimizing educational content. Supports dynamic agent collaboration modes that evolve from execution history."

parameters:
  chapter:
    description: "Chapter path relative to project root (e.g. agent/mcp-deep-dive, algo/attention/self-attention)"
    type: string
    required: true

  mode:
    description: "Work mode: validate (check existing), generate (create from topic/paper), optimize (improve existing)"
    type: string
    enum: [validate, generate, optimize]
    default: validate

  scenario:
    description: "Scenario description (freeform/brainstorming) or template name (template mode)"
    type: string
    required: false

  scenario_mode:
    description: "How to define the scenario: template (from config), freeform (user describes), brainstorming (interactive refinement)"
    type: string
    enum: [template, freeform, brainstorming]
    default: freeform

  collaboration_mode:
    description: "Override collaboration mode (default: auto-selected from experience)"
    type: string
    enum: [single-agent, dual-agent, triple-agent, parallel-agents]
    required: false

  max_iterations:
    description: "Maximum iteration count (default: 5)"
    type: number
    default: 5

  setup:
    description: "Run interactive setup to create .chapter-validation/config.yaml"
    type: boolean
    default: false
---

# Chapter Content Validator

Experience-driven collaboration engine that validates, generates, and optimizes educational content through dynamic multi-agent collaboration.

## Core Philosophy

> "Let Skill grow smarter with every execution."

This is NOT a static linter. It is an evolving engine that:
1. Learns which collaboration mode works best for which scenario
2. Adapts to project structure via external config (not hardcoded)
3. Supports three work modes: validate, generate, optimize

## Three-Layer Architecture

```
Paradigm (docs/frameworks/chapter-validation-paradigm.md)
  -> defines methodology, dependencies, quality standards
Skill (this file + lib/)
  -> generic engine, experience store, mode selection
Config (.chapter-validation/config.yaml)
  -> project-specific chapter types, sections, overrides
```

## Execution Flow

### Step 1: Load Context

1. Read project config from `.chapter-validation/config.yaml`
2. Read paradigm from `docs/frameworks/chapter-validation-paradigm.md`
3. Load chapter-specific config (merged with defaults)
4. Check chapter dependencies are met

### Step 2: Select Collaboration Mode

Priority order:
1. User override via `--collaboration_mode` parameter
2. Experience store match (if confidence > 60%)
3. Heuristic fallback based on work mode and content type

Report the selection to the user:
```
[Mode] Experience pattern "academic-paper-high" (3 uses, 90% success)
       recommends triple-agent. Confidence: 78%
```

### Step 3: Execute Work Mode

#### Validate Mode
```
Learner reads chapter content -> attempts scenario -> reports gaps
Author analyzes gaps -> fixes content -> Learner retries
Repeat until Learner completes or max_iterations reached
```

#### Generate Mode
```
Author generates initial content from topic/paper description
Learner reads generated content -> attempts scenario -> reports gaps
Author fixes gaps -> Learner retries
Repeat until quality threshold met
```

#### Optimize Mode
```
Learner reads existing content with new requirements -> reports gaps
Author optimizes content addressing new requirements
Learner re-validates -> Repeat if needed
```

### Step 4: Agent Roles

**Learner Agent** (SubAgent with restricted context):
- MUST NOT use external knowledge or internet
- CAN ONLY read files within the chapter directory (and declared prerequisites)
- Reports: completion status, knowledge gaps with exact locations, blockers

**Author Agent** (SubAgent with full context):
- Analyzes Learner's gap report
- Creates/modifies content files to fill gaps
- Reports: files changed, new gap categories discovered

**Reviewer Agent** (triple-agent mode only):
- Verifies mathematical formulas match paper
- Checks code implementations match algorithms
- Cross-references external sources

### Step 5: Feedback Processing

Classify all feedback by impact level:

| Level | Target | Action |
|-------|--------|--------|
| 1 | Chapter content | Apply directly during iteration |
| 2 | Chapter config | Apply directly during iteration |
| 3 | Paradigm doc | Record; prompt user if high priority |
| 4 | Skill code | Record; prompt user if high priority |

### Step 6: Record & Learn

After execution completes:
1. Generate `validation-log.md` in chapter directory (ONCE, not incrementally)
2. Update experience store with execution result
3. Report significant Level 3-4 suggestions to user

## First-Time Setup

If .chapter-validation/config.yaml does not exist, the Skill will:
1. Detect the missing configuration
2. Show setup instructions (copy template OR run --setup)
3. Offer to run with defaults if user continues

### Interactive Setup (--setup flag)

When `--setup=true`, the Skill guides through configuration:

1. **Project Type**: What kind of content does this project have?
   - Agent/Infrastructure (MCP, Skills, Workflows)
   - Algorithms & Papers (CNN, Transformer, RL)
   - General/Other

2. **Content Structure**: Which directories contain chapter content?
   - Default: [concepts/, experiments/, implementation/]
   - User can specify custom directories

3. **Dependencies**: Do chapters have prerequisite relationships?
   - If yes: Prompt to define dependency graph
   - If no: Skip dependency handling

4. **Complexity**: Does your project include complex content requiring triple-agent?
   - Academic papers with math formulas
   - Proof-heavy algorithms
   - If yes: Add triple-agent seed patterns

## Web Verification (when configured)

When paradigm requires web verification:
1. Build the site: `cd site && npm run build:no-check`
2. Read built HTML to verify rendering
3. Use @frontend-design skill if available for visual verification
4. Isolation: use dedicated port (3001+) to avoid conflicts

## Batch Execution

For multiple chapters:
1. Parse dependency graph from paradigm
2. Topological sort to determine execution order
3. Execute independent chapters in parallel batches
4. Use @superpowers:dispatching-parallel-agents for parallelism

## Related Documentation

- Design philosophy: `docs/frameworks/chapter-validator-design.md`
- Project paradigm: `docs/frameworks/chapter-validation-paradigm.md`
- Project config: `.chapter-validation/config.yaml`
