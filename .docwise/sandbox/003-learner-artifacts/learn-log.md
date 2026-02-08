# Docwise: Learn - Learner Runnable Artifacts

**Timestamp**: 2026-02-09
**Source**: User observation of `/docwise:new` output
**Severity**: Critical

## Issue Summary

User observed: "为什么learner产物只有一个markdown？" (Why does Learner only produce one markdown file?)

**Problem**: Learner Agent only outputs `README.md` (validation report), missing:
- Runnable code/scripts
- Execution artifacts
- Test outputs

## Root Cause

Learner Agent constraints across all subcommands (`:new`, `:improve`, `:check`) did not explicitly require saving runnable artifacts. The paradigm definition also lacked this requirement.

## Solution Applied

### Level 4: Skill Code Updates

**Files Updated**:
1. `.claude/skills/docwise-check/references/agent-constraints.md`
2. `.claude/skills/docwise-improve/references/agent-constraints.md`
3. `.claude/skills/docwise-new/references/agent-constraints.md`

**Added to all Learner Agent sections**:
- Constraint: `MUST save runnable artifacts to sandbox directory`
- New "Artifact Requirements" section defining:

| Artifact | Purpose | Content |
|----------|---------|---------|
| `learning-notes.md` | Incremental learning record | Problems encountered, confusions, dead ends |
| `validation-log.md` | Final verification summary | Completion status, gaps/issues, results |
| `artifacts/` | Runnable evidence | Scripts, test outputs, execution logs, screenshots |

### Level 3: Paradigm Update

**File**: `.docwise/paradigm.md`

**Updated Learner Agent definition** to include artifact preservation requirement.

## Expected Behavior (After Fix)

For `/docwise:new agent/hooks` (example):

```
.docwise/sandbox/002-agent-hooks/
├── learning-notes.md       # Problems: jq missing, how to test standalone
├── validation-log.md       # Final report: gaps found, verification results
└── artifacts/
    ├── notify-test.sh      # Script created to test notifications
    ├── test-output.log     # Actual execution output
    └── screenshot.png      # Desktop notification screenshot (if applicable)
```

For `/docwise:improve mcp` (example):

```
.docwise/sandbox/001-practical-validation/
├── learning-notes.md       # TypeScript errors encountered
├── validation-log.md       # Fixes applied, build successful
└── artifacts/
    ├── build.log           # npm run build output
    ├── server-test.log     # Server execution log
    └── mcp-test.json       # Protocol verification output
```

## Impact

Future Docwise executions will:
1. Create `artifacts/` subdirectory in sandbox
2. Save all runnable evidence (scripts, outputs, logs)
3. Enable reproducible verification of documentation quality
4. Provide "proof of execution" beyond textual reports
