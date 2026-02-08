# Docwise: Improve - Workflow

Complete execution flow for the `:improve` subcommand.

## Execution Flow

```
1. PARSE INPUT
   - Extract: chapter (from args or infer from context)
   - Extract: scenario/requirements from <args>
   - Detect: complexity (simple/medium/complex/advanced)

2. SHOW OVERVIEW WITH CURRENT STATUS
   - Check document status (draft/in-progress/published/completed)
   - Display: What is it / What is it for
   - Display: Current coverage / gaps from doc summary
   - If status=completed: show warning, require confirmation

3. GENERATE SCENARIO FOCUSED ON USER NEED
   - Analyze user's actual requirement (not generic "improvement")
   - Generate practical validation scenario based on user need
   - Example: User says "I want to build X" -> Scenario: "Learner tries to build X using only the doc"
   - Show scenario confirmation dialog

**IMPORTANT**: The scenario must be a practical validation task, not a content generation request.
- ❌ Wrong: "Add more experiments and advanced patterns"
- ✅ Right: "Learner reads doc and tries to implement task completion notifications"

4. CONFIRM SCENARIO (REQUIRED - must wait for user response)
   - Use AskUserQuestion tool to present scenario confirmation
   - Wait for user response before proceeding
   - Options should be:
     * "执行验证" - Execute the validation scenario
     * "调整重点" - Modify the validation focus
     * "取消" - Cancel the improvement

**CRITICAL**: This step MUST use AskUserQuestion tool and wait for response.
Do NOT proceed without user confirmation.

**AskUserQuestion options format**:
```yaml
questions:
  - question: "确认场景：[scenario description]"
    header: "场景确认"
    options:
      - label: "执行验证"
        description: "[brief description of what will happen]"
      - label: "调整重点"
        description: "修改验证方向或范围"
      - label: "取消"
        description: "放弃本次改进"
    multiSelect: false
```

5. SETUP SANDBOX
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
   * Verifies technical accuracy of fixes
   * If issues found: spawn Author to fix, then Learner to re-validate

8. GENERATE LEARNER ARTIFACTS
   - Create README.md in sandbox
   - Create learning-log.md
   - Preserve code/ and validation/ directories
```

**Critical**: The loop is **Learner -> Author -> Learner -> Author -> ...** until Learner confirms COMPLETE.

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
