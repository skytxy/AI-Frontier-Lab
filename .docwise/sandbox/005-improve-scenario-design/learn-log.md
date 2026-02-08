# Docwise: Learn - Improve Scenario Design Fix

**Timestamp**: 2026-02-09
**Source**: User feedback during `/docwise:improve` execution
**Severity**: Critical

## Issue Summary

User said: "为什么不继续完善docwise的场景描述？这又是一个方法论的错误"

**Problem**: When user expressed a practical need ("I want to build X for notification"),
the skill generated generic improvement options ("Add more experiments", "Perfect existing content")
rather than a practical validation scenario.

**Root Cause**: The `:improve` skill lacked:
1. A "gatekeeper" pattern to recognize user needs as validation opportunities
2. Guidance to generate practical scenarios from user needs
3. Proper confirmation dialog format

## Solution Applied

### Level 4: Skill Code Updates

**File 1**: `.claude/skills/docwise-improve/references/workflow.md`

**Updated Step 3** - Generate scenario from user need:
```
3. GENERATE SCENARIO FOCUSED ON USER NEED
   - Analyze user's actual requirement (not generic "improvement")
   - Generate practical validation scenario based on user need
   - Example: User says "I want to build X" -> Scenario: "Learner tries to build X using only the doc"

**IMPORTANT**:
- ❌ Wrong: "Add more experiments and advanced patterns"
- ✅ Right: "Learner reads doc and tries to implement task completion notifications"
```

**Updated Step 4** - Confirmation dialog format:
```
4. CONFIRM SCENARIO (REQUIRED)
   - Options should be:
     * "执行验证" - Execute the validation scenario
     * "调整重点" - Modify the validation focus
     * "取消" - Cancel the improvement

**AskUserQuestion options format**: [provided]
```

**File 2**: `.claude/skills/docwise-improve/skill.md`

**Added** to "When to Use" section:
```
**Key Principle**: When user says "I want to build X" and X relates to a chapter,
generate a validation scenario where Learner tries to build X using only the doc.
This validates documentation quality through practical testing.
```

## Expected Behavior (After Fix)

### Before (Wrong)
```
User: "我想做一个 Macbook 上的 claude code hooks"
Skill: Shows options like "Add more experiments", "Perfect existing content"
Problem: Generic content options, not validation-focused
```

### After (Correct)
```
User: "我想做一个 Macbook 上的 claude code hooks"
Skill: Generates scenario -> "Learner reads doc and tries to implement task completion notifications"
Confirmation: "执行验证 | 调整重点 | 取消"
Benefit: Validates doc quality through practical user need
```

## Design Principle

**Docwise :improve is about validation through practical use, not content generation.**

When a user has a practical need:
1. Treat it as a validation scenario opportunity
2. Let Learner attempt the task using only the doc
3. Discover gaps through practical failure points
4. Author fills the gaps

This is different from content-first approaches that add material without validation.
