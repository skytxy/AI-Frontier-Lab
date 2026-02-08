# Docwise: New - Workflow

Complete execution flow for the `:new` subcommand.

## Execution Flow

```
1. PARSE INPUT
   - Extract scenario description from <args>
   - Detect complexity from keywords
   - Detect content_type from chapter path (agent/algo)

2. SHOW OVERVIEW FROM WEBSEARCH
   - WebSearch: What is this technology?
   - WebSearch: What are the use cases?
   - Display: What is it / What is it for

3. GENERATE SCENARIO FROM SEARCH
   - Analyze chapter type (Agent/Algo)
   - WebSearch for practical examples
   - Extract core topics from search results
   - Generate scenario + topics + goals
   - Show scenario confirmation dialog

4. CONFIRM SCENARIO (REQUIRED - must wait for user response)
   - Use AskUserQuestion tool to present scenario confirmation
   - Wait for user response before proceeding
   - User can accept, adjust, or cancel
   - Skip ONLY if auto_confirm=true in parameters

**CRITICAL**: This step MUST use AskUserQuestion tool and wait for response.
Do NOT proceed without user confirmation unless auto_confirm=true.

5. SETUP SANDBOX
   - Detect chapter language (or ask user if unclear)
   - Create sandbox directory
   - Setup language isolation

6. EXECUTE WITH TASK TOOL (ITERATIVE LOOP)
   Loop (max_iterations from config, default 5):

   a) Spawn Author Agent (subagent_type=general-purpose)
      * Creates new content files (first iteration) or modifies existing (subsequent)
      * Follows chapter structure from config
      * Reports: files created/changed

   b) Spawn Learner Agent (subagent_type=general-purpose)
      * Reads only new/modified content (zero-knowledge validation)
      * Executes practical tasks in sandbox to verify content
      * Reports: completion status, gaps, blockers

   c) Check Learner's completion status
      * If COMPLETE: Generate artifacts (README, learning-log)
      * If gaps found: increment counter, loop back to (a)

7. (triple-agent only) Spawn Reviewer Agent
   * Verifies technical accuracy
   * If issues found: spawn Author to fix, then Learner to re-validate

8. GENERATE LEARNER ARTIFACTS
   - Create README.md in sandbox
   - Create learning-log.md
```

**Critical**: The loop is **Author -> Learner -> Author -> Learner -> ...** until Learner confirms COMPLETE.

## Scenario Confirmation

The scenario confirmation dialog format is defined in the project paradigm.
See `.docwise/paradigm.md` for the project-specific template format.

## Iteration Behavior

| Iteration | Author Action | Learner Action |
|-----------|--------------|----------------|
| 1 | Create initial content | Validate from scratch |
| 2+ | Fix reported gaps | Re-validate only changes |
| Final | N/A | Generate artifacts |

## Completion Conditions

Learner reports COMPLETE when:
- All documented steps can be followed
- Practical tasks execute successfully
- No blockers remain
- Gaps are minor or none

## Max Iterations

Default: 5 (configurable in `.docwise/config.yaml`)

Exceeding max iterations with remaining gaps indicates:
- Content may need restructuring
- Scenario may be too complex for single session
- Consider splitting into smaller scenarios
