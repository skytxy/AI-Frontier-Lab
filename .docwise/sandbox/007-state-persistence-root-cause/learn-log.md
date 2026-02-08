# Docwise: State Persistence - Root Cause Analysis

**Timestamp**: 2026-02-09
**Severity**: Critical
**Type**: Architectural Design Flaw

## Problem Statement

Docwise subcommands exit to normal conversation when user rejects AskUserQuestion.
Reference: superpowers:brainstorming maintains state even after interruptions.

## Root Cause Analysis

### brainstorming's Secret

brainstorming maintains state because its **entire workflow is conversational by nature**:

```
## The Process

Understanding the idea:
- Check out current project state
- Ask questions one at a time to refine the idea
...

Presenting the design:
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
```

The workflow itself **describes ongoing dialogue**, not a linear batch process.
Claude naturally continues because that's what the skill says to do.

### Docwise's Flaw

Docwise workflows are **linear, batch-process oriented**:

```
1. Parse -> 2. Show -> 3. Generate -> 4. Confirm -> 5. Setup -> 6. Execute -> 7. Generate
```

When user rejects at step 4, there's no "what to do next" described.
The workflow ends, so Claude exits.

### Why My Fixes Were Wrong

1. **Adding "State Persistence" section to skill.md**:
   - Violates skill-creator (imperative form, not second person)
   - Implementation detail, not workflow description
   - "DO NOT exit" is a command, not a workflow

2. **Adding "4b. HANDLE USER REJECTION" to workflow.md**:
   - Still imperative ("Do NOT exit", "Ask user")
   - Not how brainstorming does it
   - brainstorming doesn't have "handle rejection" branch

## The Real Solution

**Docwise needs architectural redesign**, not patches:

Current: Linear batch process with confirmation gates
Needed: Conversational, iterative process like brainstorming

### Redesigned Workflow Example

Instead of:
```
4. Confirm scenario (then proceed to 5)
```

Should be:
```
4. Collaborate with user on scenario
   - Propose scenario based on user need
   - User accepts, adjusts, or provides different input
   - Iterate until aligned
   - Then proceed to sandbox
```

This makes the workflow **inherently conversational**, like brainstorming.

## Implementation Complexity

This requires:
1. Rewriting all subcommand skill.md files
2. Rewriting all workflow.md files
3. Changing from "confirmation gate" to "collaborative iteration"
4. Testing all subcommands

**Status**: Not implemented - this is a major redesign, not a quick fix.

## Workaround

Until redesign is complete, users should:
- Provide clear input that matches available options
- Or use free-form input to describe what they want
- Accept that docwise may exit and need to be re-invoked
