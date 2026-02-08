# Docwise: Learn - Agent Hooks Frontmatter Format

**Timestamp**: 2026-02-09
**Source**: `agent/hooks` chapter creation
**Severity**: Critical

## Issue Summary

During `/docwise:new agent/hooks`, the Author Agent created YAML frontmatter with complex inline formatting that caused js-yaml parsing errors:

```yaml
# FAILED - Complex inline syntax
prerequisites:
  - macOS: `brew install jq`
  - Linux: `jq` (via package manager)
  - Windows: PowerShell 7+ (includes `ConvertFrom-Json`)
```

**Error**:
```
bad indentation of a mapping entry
  Location: agent/hooks/experiments/01-notification-hook/README.md:7:11
```

## Root Cause

Author Agent did not:
1. Read existing chapter frontmatter formats before creating new content
2. Follow project-specific frontmatter conventions
3. Validate YAML syntax after creation

## Solution Applied

### Level 4: Skill Code Update

**File**: `.claude/skills/docwise-new/references/agent-constraints.md`

**Author Agent Constraints Added**:
- MUST read existing chapter frontmatter formats before creating new content
- MUST follow detected frontmatter format patterns from existing chapters
- MUST validate YAML frontmatter parses correctly (keep formatting simple)

**Shared Constraints Added**:
- Frontmatter Format Validation section with:
  - Anti-patterns (complex inline syntax, nested structures)
  - Best practices (simple strings, flat lists, quote only when necessary)
  - Validation requirement (run site build after creation)

### Level 3: Paradigm Update

**File**: `.docwise/paradigm.md`

**New Gap Category Added**:
- `frontmatter_parse_error` - YAML frontmatter fails to parse due to complex formatting

## Frontmatter Format Guidelines

### Correct Format

```yaml
---
title: "Experiment Title"
experiment: 1
parent: hooks
tags: [hooks, notifications, cross-platform]
difficulty: beginner
prerequisites:
  - jq for JSON parsing
  - PowerShell 7+ on Windows
---
```

### Anti-Patterns to Avoid

- Complex inline syntax in list items
- Nested structures with mixed quotes and parentheses
- Platform-specific formatting in prerequisites field

## Impact

Future `/docwise:new` executions will:
1. Automatically read existing frontmatter examples
2. Follow detected format patterns
3. Validate YAML parses before completion
4. Mark `frontmatter_parse_error` gaps when issues found
