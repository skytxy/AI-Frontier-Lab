# Docwise: Check - Validation Report

Format for validation report output.

## Report Location

Reports are generated in the sandbox directory:
```
.docwise/sandbox/[id]-[description]/
├── README.md           # Validation summary
├── learning-log.md     # Detailed process
├── validation/         # Test outputs
└── report.md          # Structured validation report
```

## report.md Format

```markdown
# Validation Report: [chapter-name]

**Chapter**: [chapter-path]
**Focus**: [links|logic|content|all]
**Timestamp**: [ISO timestamp]
**Iterations**: [number]

## Summary

**Status**: PASSED | FAILED | CONDITIONAL

**Issues Found**:
- Critical: [count]
- Important: [count]
- Minor: [count]

## By Category

### Links
- **Status**: PASSED | FAILED
- **Issues**:
  - [severity] [description] at [location]

### Logic
- **Status**: PASSED | FAILED
- **Issues**:
  - [severity] [description] at [location]

### Content
- **Status**: PASSED | FAILED
- **Issues**:
  - [severity] [description] at [location]

### Theme (if checked)
- **Status**: PASSED | FAILED
- **Issues**:
  - [severity] [description] at [location]

## Detailed Findings

### Critical Issues

[If any critical issues found, list with details]

### Important Issues

[If any important issues found, list with details]

### Minor Issues

[If any minor issues found, list with details]

## What Works

[Positive findings, what validates well]

## Recommendations

[Actionable recommendations for improvement]

## Fixes Applied (if --fix)

[List of fixes that were applied]
```

## README.md Summary Format

```markdown
# Validation: [chapter-name]

**Focus**: [links|logic|content|all]
**Status**: [PASSED|FAILED|CONDITIONAL]

## Quick Summary

[2-3 sentence overview of validation results]

## Issues

### Critical ([N])
- [Issue 1]

### Important ([N])
- [Issue 1]

### Minor ([N])
- [Issue 1]

## Next Steps

[Recommended actions based on findings]
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | PASSED - No issues found |
| 1 | FAILED - Critical issues found |
| 2 | CONDITIONAL - Important issues found |
| 3 | INFO - Minor issues found |

## Using the Report

1. **Review summary** for quick status check
2. **Check critical issues** - must fix before publishing
3. **Review important issues** - should fix before publishing
4. **Consider minor issues** - fix if time permits
5. **Keep artifacts** for reference or delete to save space
