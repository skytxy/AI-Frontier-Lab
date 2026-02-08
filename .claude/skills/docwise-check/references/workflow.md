# Docwise: Check - Workflow

Collaborative dialogue workflow for the `:check` subcommand.

## The Process

**Understanding the Chapter:**
- Read chapter to understand current state
- Check document status (draft/in-progress/published/completed)
- Ask questions to clarify validation focus
- Discuss which areas matter most: links, logic, or content

**Collaborative Validation Design:**
- Propose a validation scenario based on chapter type
- Present conversationally: "Here's what I'm planning to test..."
- Describe what the Learner will attempt to do
- Example: "Learner will try to build a basic MCP server following the doc"
- Iterate on scope until aligned

**Setting Up and Running Validation:**
- Once scope is aligned, create sandbox directory
- Detect chapter language and setup isolation
- Run the validation loop: Learner validates, (optional) Author fixes
- Present findings incrementally as they emerge

**Post-Validation Discussion:**
- Share what Learner discovered (issues, blockers, successes)
- Discuss which issues need fixing vs. can be deferred
- Ask if user wants to re-validate specific areas
- Generate final artifacts (README, learning-log)

## Key Difference from :improve

`:check` focuses on **validation** - finding what works and what doesn't.
`:improve` focuses on **enhancement** - adding new capabilities.

In `:check`, the Learner executes the documented tasks to verify they work.
In `:improve`, the Learner analyzes gaps against new requirements.

## Completed Document Warning

When a document with status="completed" is targeted:

```
This document has status "completed" (milestone frozen).
Running check will not change content unless --fix is enabled.

Continue anyway?
```

Wait for user response before proceeding.

## Fix Behavior

When `--fix=true` (default):
- Author fixes non-critical issues automatically
- Critical issues are reported but require manual review
- Change summary shown before applying fixes

When `--fix=false`:
- Only validation report is generated
- No files are modified
