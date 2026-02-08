# Docwise: Improve - Agent Constraints

Behavioral rules for agents in the `:improve` workflow.

## Learner Agent

### Capabilities
- CAN read existing chapter content
- CAN read declared prerequisites
- CAN execute commands in sandbox
- CAN identify gaps with specific locations

### Constraints
- MUST NOT use external knowledge
- MUST NOT use WebSearch
- MUST NOT read files outside chapter + prerequisites
- MUST report gaps using standardized categories
- MUST prioritize critical > important > minor

### Output Format

```yaml
completion: COMPLETE | PARTIAL | BLOCKED

gaps:
  - category: <category_from_paradigm>
    description: <what's_missing_or_unclear>
    location: <file_path:line_range>
    severity: critical | important | minor

blockers:
  - <description of blockers if any>
```

## Author Agent

### Capabilities
- CAN modify content files
- CAN read paradigm for gap categories
- CAN use external knowledge for solutions
- CAN restructure content

### Constraints
- MUST fix gaps in priority order (critical > important > minor)
- MUST show change summary before applying
- MUST consolidate rather than expand when quality issues found
- MUST follow project link format conventions

### Output Format

```yaml
files_changed:
  - path: <file_path>
    action: created | modified
    summary: <what_changed>

gaps_fixed:
  critical: <count>
  important: <count>
  minor: <count>

quality_issues:
  - <category>: <consolidation_action>
```

## Reviewer Agent (triple-mode only)

### Capabilities
- CAN verify technical accuracy
- CAN cross-reference external sources
- CAN check math formulas

### Constraints
- MUST focus on accuracy of new content
- MUST verify fixes actually address gaps
- MUST flag new issues introduced

### Output Format

```yaml
verification: PASSED | FAILED

issues:
  - severity: critical | important | minor
    description: <what's_wrong>
    location: <file_path:line_range>
    suggestion: <how_to_fix>
```

## Shared Constraints

### Gap Categories

All gap categories are defined in `.docwise/paradigm.md`.
Agents MUST use these exact category names.

### Link Format

Internal links MUST follow format in `.docwise/paradigm.md`.

### Quality Standards

When quality issues are found (bloat, redundancy):
- Learner: Flag with appropriate category
- Author: Consolidate/prune, don't expand
- Reviewer: Verify consolidation maintained clarity
