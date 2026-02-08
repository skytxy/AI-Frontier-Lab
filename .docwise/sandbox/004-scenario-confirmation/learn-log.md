# Docwise: Learn - Scenario Confirmation Requirement

**Timestamp**: 2026-02-09
**Source**: User observation
**Severity**: Critical

## Issue Summary

User observed: "docwise 生成的场景根本就没有跟用户确认就继续往下执行了"

**Problem**: Scenario generation step completed but workflow proceeded directly without waiting for user confirmation.

## Root Cause

Workflow documentation said "Show scenario confirmation dialog" but did not explicitly specify:
1. MUST use `AskUserQuestion` tool
2. MUST wait for user response before proceeding
3. The confirmation is REQUIRED (not optional display)

## Solution Applied

### Level 4: Skill Code Updates

**Files Updated**:
1. `.claude/skills/docwise-new/references/workflow.md`
2. `.claude/skills/docwise-improve/references/workflow.md`
3. `.claude/skills/docwise-check/references/workflow.md`

**Added explicit requirement to all workflows**:
```
4. CONFIRM SCENARIO (REQUIRED - must wait for user response)
   - Use AskUserQuestion tool to present scenario confirmation
   - Wait for user response before proceeding
   - User can accept, adjust, or cancel
   - Skip ONLY if auto_confirm=true in parameters (docwise-new only)

**CRITICAL**: This step MUST use AskUserQuestion tool and wait for response.
Do NOT proceed without user confirmation.
```

## Expected Behavior (After Fix)

### docwise:new
```
1. Parse input
2. WebSearch for overview
3. Generate scenario
4. AskUserQuestion: "🎯 Scenario Confirmation ... Is this scenario OK? [Y/n/modify]"
   [WAIT FOR USER RESPONSE]
5. Setup sandbox (only after confirmation)
6. Execute workflow...
```

### docwise:improve
```
1. Parse input
2. Show current status
3. Generate focused scenario
4. AskUserQuestion: scenario confirmation
   [WAIT FOR USER RESPONSE]
5. Setup sandbox (only after confirmation)
6. Execute workflow...
```

### docwise:check
```
1. Parse input
2. Show overview
3. Generate scenario
4. AskUserQuestion: scenario confirmation
   [WAIT FOR USER RESPONSE]
5. Setup sandbox (only after confirmation)
6. Execute workflow...
```

## Impact

Future Docwise executions will:
1. Always pause for scenario confirmation before proceeding
2. Use `AskUserQuestion` tool explicitly (not just display text)
3. Wait for actual user response (accept/modify/cancel)
4. Only skip confirmation when `auto_confirm=true` is explicitly set
