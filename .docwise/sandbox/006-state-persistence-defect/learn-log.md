# Docwise: Learn - State Persistence Defect

**Timestamp**: 2026-02-09
**Source**: User comparison with superpowers:brainstorming behavior
**Severity**: Critical

## Issue Summary

User observed: "superpowers brainstorming 即使在回答选项过程中退出到命令行，下一次还是能处在 brainstorming 状态"

**Problem**: When user rejects/cancels AskUserQuestion in docwise:improve, the skill state is lost and returns to normal conversation.

**Expected behavior** (like brainstorming):
- Maintain "in-docwise" state even after interruption
- User can provide input and continue in docwise context
- Re-prompt options or await user input

**Actual behavior**:
- Skill exits completely
- User input goes to normal conversation
- Docwise workflow is broken

## Root Cause

Docwise skills lack state persistence mechanism that superpowers:brainstorming has.

**Comparison**:

| Aspect | brainstorming | docwise:improve |
|--------|--------------|-----------------|
| State after AskUserQuestion reject | Maintained | Lost |
| Can continue after interruption | Yes | No |
| User input context | brainstorming-aware | Normal conversation |

## Required Fix

Docwise skills need state persistence:
1. Remember "currently in docwise:improve workflow"
2. Await user input even after rejection
3. Re-offer options or accept free-form input
4. Only exit on explicit "exit" or "cancel" command

## Implementation Notes

This likely requires:
- `context: fork` in skill frontmatter
- State tracking across turns
- Different prompt handling vs normal conversation

**Status**: Not yet implemented - requires architectural change to docwise skills.
