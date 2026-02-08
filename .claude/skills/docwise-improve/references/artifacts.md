# Docwise: Improve - Learner Artifacts

Output files generated in the sandbox after improvement workflow.

## Sandbox Structure

```
.docwise/sandbox/
  └── [id]-[description]/
      ├── README.md           # Summary of improvements
      ├── learning-log.md     # Iteration process
      ├── code/              # Working code (if applicable)
      └── validation/        # Test outputs
```

## README.md Format

```markdown
# Improvement: [requirement-summary]

**ID**: [scenario-id]
**Chapter**: [chapter-path]
**Timestamp**: [ISO timestamp]

## What Was Improved

[Brief summary of improvements made]

## Gaps Fixed

### Critical (N)
- [Gap 1]: [how it was fixed]
- [Gap 2]: [how it was fixed]

### Important (N)
- [Gap 3]: [how it was fixed]

### Minor (N)
- [Gap 4]: [if addressed]

## Files Changed

- [file1]: [summary of changes]
- [file2]: [summary of changes]

## Quality Improvements

[Any consolidations, pruning, restructuring]

## Remaining Gaps

[Minor issues not addressed, if any]
```

## learning-log.md Format

```markdown
# Learning Log: [improvement-scenario]

**Scenario ID**: [id]
**Started**: [timestamp]
**Completed**: [timestamp]
**Iterations**: [number]

## Initial Analysis

### Document Status
- Status: [draft|in-progress|published|completed]
- Coverage: [summary of what existed]

### Gaps Identified
- [List of gaps found in first pass]

## Iteration 1

### Learner Analyzed
- Status: PARTIAL | BLOCKED
- Critical gaps: [count]
- Important gaps: [count]

### Author Fixed
- Files changed: [list]
- Gaps addressed: [categories]

### Learner Re-validated
- Status: [completion status]
- Remaining gaps: [categories]

## [Additional Iterations...]

## Final Status

[Overall completion status]

## Improvement Summary

[What was accomplished]
```

## Artifact Preservation

Artifacts are stored in the sandbox directory and:
- Are NOT committed to git by default
- Can be manually committed if valuable
- Serve as reference for future improvements
- Help identify patterns for content evolution

## Using Artifacts for Pattern Learning

1. **Review gaps** to identify common missing topics
2. **Check learning-log** for iteration patterns
3. **Identify recurring issues** for paradigm updates
4. **Consider `:learn`** to internalize patterns
