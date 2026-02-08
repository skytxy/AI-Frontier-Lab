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

Validate chapter content quality via dual-agent collaboration.

## Execution Flow

```
1. PARSE INPUT
   - Extract: chapter, focus (links/logic/content/all)
   - Detect: complexity

2. MATCH PATTERN (.docwise/config.yaml -> seed_patterns)
   - Find seed_pattern matching validate + complexity
   - Get recommended_mode (single for simple, dual/triple for complex)

3. CONFIRM MODE
   - Show matched pattern and recommended mode
   - User can accept or override

4. EXECUTE WITH TASK TOOL (ITERATIVE LOOP)
   Loop (max_iterations from config, default 5):

   a) Spawn Learner Agent (subagent_type=general-purpose)
      * Reads chapter content (zero-knowledge)
      * Checks according to focus:
        - links: External HTTP status, internal file existence
        - logic: Consistency, contradictions, missing steps
        - content: Completeness, clarity
      * Reports: completion status, issues with locations

   b) Check Learner's completion status
      * If COMPLETE (no issues): END iteration
      * If issues found: Continue

   c) Spawn Author Agent (if --fix is true)
      * Fixes reported issues
      * Reports: files changed

   d) Increment iteration counter, loop back to (a)

5. (triple-agent only) Spawn Reviewer Agent
   * Verifies technical accuracy of fixes
   * If issues found: spawn Author to fix, then Learner to re-validate
```

**Critical**: The loop is **Learner → Author → Learner → Author → ...** until Learner confirms COMPLETE (no issues).

## Check Categories

### Links
- **External**: HTTP 200-399 status (use curl)
- **Internal**: File exists
- **Extension**: No `.md` in web routes (Astro convention)

### Logic
- Step sequence complete
- No contradictions
- Referenced concepts exist
- Prerequisites declared

### Content
- Completeness: All concepts explained
- Clarity: Zero-knowledge learner can understand
- Examples: Code samples provided

### Theme (requires web verification)
- **Code blocks**: Syntax highlighting works in both Light and Dark modes
- **Inline code**: Contrast sufficient in both themes (not color-dependent)
- **Tables**: Borders visible in both themes
- **Images**: Legible in both themes (no hardcoded backgrounds)

**To check themes**: Build site (`cd site && npm run build:no-check`), open in browser, toggle theme, verify rendering.

## Agent Constraints

See `docwise/references/agent-constraints.md` for detailed constraints.

**Learner Agent**:
- MUST NOT use external knowledge
- CAN ONLY read chapter files + declared prerequisites
- Reports: issues with locations and categories

**Author Agent** (spawned if issues found and --fix):
- Reads Learner's issue report
- CAN modify content files
- Reports: files changed

## Gap Categories

Issues reported using categories from `docwise/references/quality-categories.md`.

## Link Format Conventions

**CRITICAL**: Internal links MUST follow the format specified in `.docwise/paradigm.md` under "Link Format Conventions".

Before checking any links:
1. Read `.docwise/paradigm.md` section "Link Format Conventions"
2. Verify against actual site build output
3. Project-specific rules (e.g., `/topics/` vs `/agent/`) are defined in paradigm, NOT in this skill

## Example

**Input**: `/docwise:check --focus=links`

**Process**:
1. Parse: collaboration mode=validate, focus=links
2. Match: `technical-guide-low` -> single-agent (simple check)
3. Execute:
   - Agent checks all links in chapter
   - Reports broken links with locations
4. Output: List of issues, fixes applied if --fix
