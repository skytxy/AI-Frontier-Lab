# Docwise: Check - Workflow

Complete execution flow for the `:check` subcommand.

## Execution Flow

```
1. PARSE INPUT
   - Extract: chapter, focus (links/logic/content/all)
   - Detect: complexity

2. SHOW OVERVIEW
   - Check document status (draft/in-progress/published/completed)
   - Display: What is it / What is it for
   - If status=completed: show warning, require confirmation

3. GENERATE SCENARIO
   - Analyze chapter type (Agent/Algo)
   - WebSearch for practical examples
   - Generate scenario + core topics
   - Show scenario confirmation dialog

4. CONFIRM SCENARIO
   - User can accept or adjust scenario/topics
   - Generate sandbox directory name based on scenario

5. SETUP SANDBOX
   - Detect chapter language (python/node/rust/go/java/cpp/none)
   - Create sandbox directory (.docwise/sandbox/XXX-description/)
   - Setup language isolation (.venv, node_modules, etc.)

6. EXECUTE WITH TASK TOOL (ITERATIVE LOOP)
   Loop (max_iterations from config, default 5):

   a) Spawn Learner Agent (subagent_type=general-purpose)
      * Reads chapter content (zero-knowledge)
      * Executes practical task according to documentation (not just checks!)
      * Records: which steps clear, which blockers encountered
      * Reports: completion status, issues, findings

   b) Check Learner's completion status
      * If COMPLETE: Generate artifacts (README, learning-log)
      * If issues found: Continue

   c) Spawn Author Agent (if --fix is true and issues not critical)
      * Prioritizes: critical > important > minor
      * Shows change summary for confirmation
      * Fixes reported issues
      * Reports: files changed

   d) Increment iteration counter, loop back to (a)

7. (triple-agent only) Spawn Reviewer Agent
   * Verifies technical accuracy of fixes
   * If issues found: spawn Author to fix, then Learner to re-validate

8. GENERATE LEARNER ARTIFACTS
   - Create README.md in sandbox (topics, findings, gaps)
   - Create learning-log.md (execution process, learnings)
   - Preserve code/ and validation/ directories
```

**Critical**: The loop is **Learner -> Author -> Learner -> Author -> ...** until Learner confirms COMPLETE (no issues).

## Key Difference from :improve

`:check` focuses on **validation** - finding what works and what doesn't.
`:improve` focuses on **enhancement** - adding new capabilities.

In `:check`, the Learner executes the documented tasks to verify they work.
In `:improve`, the Learner analyzes gaps against new requirements.

## Completed Document Warning

```
WARNING: This document has status "completed" (milestone frozen).
Running check will not change content unless --fix is enabled.

Confirm continue? [Y/n]
```

## Fix Behavior

When `--fix=true` (default):
- Author fixes non-critical issues automatically
- Critical issues are reported but require manual review
- Change summary shown before applying fixes

When `--fix=false`:
- Only validation report is generated
- No files are modified
