# Docwise: Improve - Workflow

Collaborative dialogue workflow for the `:improve` subcommand.

## The Process

**Understanding the Requirement:**
- Read the chapter to understand current state
- Ask questions one at a time to clarify what user wants
- Focus on practical outcomes: "What do you want to build or do?"
- Avoid abstract "improvements" - anchor in concrete use cases

**Designing the Validation Scenario:**
- Propose a scenario where Learner tries to achieve user's goal using only the doc
- Present conversationally: "Here's what I'm thinking for validation..."
- Describe what the Learner will attempt to do
- Iterate based on user feedback until aligned

**Example Scenario Design:**
- User: "I want to add task completion notifications"
- You: "Let me design a validation scenario. The Learner will read the hooks documentation and try to implement a simple notification that triggers when a tool completes. Does this match what you need?"

**Setting Up and Running Validation:**
- Once scenario is aligned, create sandbox directory
- Detect chapter language and setup isolation
- Run the dual-agent loop: Learner validates, Author fixes
- Present findings incrementally as they emerge

**Post-Validation Discussion:**
- Share what Learner discovered (gaps, blockers, successes)
- Discuss whether the validation covered the right scope
- Ask if user wants to iterate on specific areas
- Generate final artifacts (README, learning-log)

## Completed Document Warning

When a document with status="completed" is targeted:

```
This document has status "completed" (milestone frozen).
Running improve will change document status and content.

Continue anyway?
```

Wait for user response before proceeding.

## Iteration Behavior

| Iteration | Learner Action | Author Action |
|-----------|---------------|---------------|
| 1 | Read all content, identify all gaps | Fix critical + important gaps |
| 2+ | Re-validate only changed files | Fix remaining gaps |

## Gap-Driven Improvement

The workflow is gap-driven:
1. Learner identifies ALL gaps in first pass
2. Author fixes gaps in priority order
3. Learner validates fixes
4. Loop until no gaps remain

This is different from `:new` which creates from scratch.

## Quality Issue Consolidation

When quality issues are found (bloat, redundancy), Author should:
- **Consolidate** similar explanations
- **Prune** excessive examples
- **Restructure** rather than expand

See `.docwise/paradigm.md` for quality issue thresholds.

## Completed Document Warning

When a document with status="completed" is targeted for improvement:

```
WARNING: This document has status "completed" (milestone frozen).
Running improve/check will change document status and content.

Confirm continue? [Y/n]
```

## Iteration Behavior

| Iteration | Learner Action | Author Action |
|-----------|---------------|---------------|
| 1 | Read all content, identify all gaps | Fix critical + important gaps |
| 2+ | Re-validate only changed files | Fix remaining gaps |

## Gap-Driven Improvement

The workflow is gap-driven:
1. Learner identifies ALL gaps in first pass
2. Author fixes gaps in priority order
3. Learner validates fixes
4. Loop until no gaps remain

This is different from `:new` which creates from scratch.

## Quality Issue Consolidation

When quality issues are found (bloat, redundancy), Author should:
- **Consolidate** similar explanations
- **Prune** excessive examples
- **Restructure** rather than expand

See `.docwise/paradigm.md` for quality issue thresholds.
