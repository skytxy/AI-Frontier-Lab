# Docwise: Check - Agent Constraints

Behavioral rules for agents in the `:check` workflow.

## Learner Agent

### Capabilities
- CAN read chapter content
- CAN read declared prerequisites
- CAN execute commands in sandbox
- CAN follow documentation to verify it works

### Constraints
- MUST NOT use external knowledge
- MUST NOT use WebSearch
- MUST NOT read files outside chapter + prerequisites
- MUST actually execute documented steps (not just "check" visually)
- MUST report exact locations of issues
- MUST save runnable artifacts to sandbox directory

### Artifact Requirements

Learner Agent MUST preserve evidence of execution in `.docwise/sandbox/[id]/`:

| Artifact | Purpose | Content |
|----------|---------|---------|
| `learning-notes.md` | Incremental learning record | Problems encountered, confusions, dead ends |
| `validation-log.md` | Final verification summary | Completion status, all issues found, verification results |
| `artifacts/` | Runnable evidence | Scripts created, test outputs, screenshots, logs |

**Artifact retention**: These files are NOT committed to git but must exist for review.

### Output Format

```yaml
completion: COMPLETE | PARTIAL | BLOCKED

issues:
  - category: <category_from_paradigm>
    description: <what's_wrong>
    location: <file_path:line_range>
    severity: critical | important | minor
    focus: links | logic | content | theme

findings:
  - <what_works_well>
  - <observations>
```

### Key Behavior: Execute, Don't Just Read

The Learner Agent **executes** the documented tasks, not just reads them.

**Example**: For code documentation:
- Wrong: Read code, check syntax
- Right: Run code, verify it produces expected output

**Example**: For tutorial documentation:
- Wrong: Read steps, check they look complete
- Right: Follow steps, verify each one works

## Author Agent (if --fix)

### Capabilities
- CAN modify content files
- CAN read paradigm for categories
- CAN use external knowledge for solutions

### Constraints
- MUST fix issues in priority order (critical > important > minor)
- MUST show change summary before applying
- MUST follow project link format conventions
- MUST NOT fix critical issues without explicit confirmation

### Output Format

```yaml
files_changed:
  - path: <file_path>
    action: modified
    summary: <what_changed>

issues_fixed:
  critical: <count>
  important: <count>
  minor: <count>

skipped:
  - <issues_requiring_manual_review>
```

## Reviewer Agent (triple-mode only)

### Capabilities
- CAN verify technical accuracy
- CAN cross-reference external sources
- CAN check visual rendering (theme verification)

### Constraints
- MUST focus on accuracy of fixes
- MUST verify fixes actually address issues
- MUST flag new issues introduced by fixes

### Output Format

```yaml
verification: PASSED | FAILED

verified_fixes:
  - <original_issue>: VERIFIED | FAILED

new_issues:
  - severity: <level>
    description: <what's_wrong>
    location: <file_path:line_range>
```

## Shared Constraints

### Gap Categories

All issue categories are defined in `.docwise/paradigm.md`.
Agents MUST use these exact category names.

### Link Format

Internal links MUST follow format in `.docwise/paradigm.md`.

### Theme Verification

When theme checks are required:
1. Build site: `cd site && npm run build:no-check`
2. Inspect built HTML
3. Verify rendering in both Light and Dark modes
4. Flag `theme_contrast_poor` or `code_highlighting_broken` if issues found
