# Docwise: New - Learner Artifacts

Output files generated in the sandbox after completion.

## Sandbox Structure

```
.docwise/sandbox/
  └── [id]-[description]/
      ├── README.md           # Learner's summary
      ├── learning-log.md     # Execution process
      ├── code/              # Working code (if applicable)
      └── validation/        # Test outputs
```

## README.md Format

```markdown
# Scenario: [name]

**ID**: [scenario-id]
**Chapter**: [chapter-path]
**Timestamp**: [ISO timestamp]

## What I Did

[Brief summary of what was accomplished]

## Topics Covered

1. [Topic one]: [what was learned]
2. [Topic two]: [what was learned]

## Code Created

[If applicable, list code files created]

## Challenges

[Challenges faced and how they were overcome]

## Next Steps

[Recommended follow-up actions]
```

## learning-log.md Format

```markdown
# Learning Log: [scenario-name]

**Scenario ID**: [id]
**Started**: [timestamp]
**Completed**: [timestamp]
**Iterations**: [number]

## Iteration 1

### Author Created
- [File 1]: [description]
- [File 2]: [description]

### Learner Validated
- Status: COMPLETE | PARTIAL | BLOCKED
- Gaps found:
  - [gap 1]
  - [gap 2]

## Iteration 2

### Author Fixed
- [Description of fixes]

### Learner Re-validated
- Status: COMPLETE | PARTIAL | BLOCKED
- Remaining gaps: [list]

## Final Status

[Overall completion status]

## Key Learnings

[What the learner learned from this scenario]
```

## Artifact Preservation

Artifacts are stored in the sandbox directory and:
- Are NOT committed to git by default
- Can be manually committed if valuable
- Serve as reference for future scenarios
- Help identify patterns for improvement

## Using Artifacts for Learning

1. **Review README.md** for quick understanding
2. **Check learning-log.md** for detailed process
3. **Examine code/** for working examples
4. **Identify gaps** for future content improvements

## Artifact Deletion

Sandbox directories can be deleted after review:
```bash
rm -rf .docwise/sandbox/[id]-[description]/
```
