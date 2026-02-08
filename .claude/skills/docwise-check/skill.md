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

2. SHOW OVERVIEW (NEW)
   - Check document status (draft/in-progress/published/completed)
   - Display: 【是什么】【有什么用】
   - If status=completed: show warning, require confirmation

3. GENERATE SCENARIO (NEW)
   - Analyze chapter type (Agent/Algo)
   - WebSearch for practical examples
   - Generate scenario + core topics
   - Show scenario confirmation dialog

4. CONFIRM SCENARIO (NEW)
   - User can accept or adjust scenario/topics
   - Generate sandbox directory name based on scenario

5. SETUP SANDBOX (NEW)
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
      * Prioritize: critical > important > minor
      * Show change summary for confirmation
      * Fixes reported issues
      * Reports: files changed

   d) Increment iteration counter, loop back to (a)

7. (triple-agent only) Spawn Reviewer Agent
   * Verifies technical accuracy of fixes
   * If issues found: spawn Author to fix, then Learner to re-validate

8. GENERATE LEARNER ARTIFACTS (NEW)
   - Create README.md in sandbox (topics, findings, gaps)
   - Create learning-log.md (execution process, learnings)
   - Preserve code/ and validation/ directories
```

**Critical**: The loop is **Learner → Author → Learner → Author → ...** until Learner confirms COMPLETE (no issues).

## Scenario Confirmation Output

When scenario is generated, display:

```
🎯 实操场景确认
─────────────────────────────────
章节: [chapter name]

【场景描述 - 你要做什么】
[detailed scenario description for beginners]

【核心议题 - 重点学习什么】
1. [Topic one]: [description]
2. [Topic two]: [description]

【协作方式 - Agent 如何帮你】
  Learner Agent: Execute task according to documentation
  Author Agent: Fix issues found by Learner (if --fix)
  Reviewer Agent: Verify technical accuracy (triple-agent mode)

【你将获得 - 学习成果】
  ✓ Validation report showing what works/doesn't
  ✓ Learning notes documenting gaps and difficulties
  ✓ Working code reference (if applicable)

【执行说明 - 代码放哪里】
  Sandbox: .docwise/sandbox/[id]-[description]/
  Language isolation: [type] (.venv, node_modules, etc.)
  Directory won't be overwritten

─────────────────────────────────
这个场景 OK 吗？[Y/n/修改场景/调整议题]
```

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
