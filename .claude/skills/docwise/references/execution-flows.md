# Docwise Execution Flows

Detailed multi-agent workflows for Docwise operations.

## Core Execution Flow

```
1. PARSE INPUT
   - Extract: collaboration mode (validate/generate/optimize), chapter, scenario
   - Detect: complexity, keywords, content_type

2. MATCH PATTERN (.docwise/config.yaml -> seed_patterns)
   - Find matching seed_pattern by content_type + complexity + keywords
   - Get recommended_mode (single/dual/triple)
   - Check chapter-specific override in chapters[].collaboration_mode

3. CONFIRM MODE
   - Show: matched pattern, recommended mode, chapter config
   - User can: accept, override mode, or cancel

4. EXECUTE WITH TASK TOOL
   - single-agent: Direct processing
   - dual-agent: Spawn Learner + Author
   - triple-agent: Spawn Learner + Author + Reviewer
```

## Single-Agent Mode

**Use when**: Low complexity, simple checks, quick fixes

```
Direct processing by current agent
```

## Dual-Agent Mode

**Use when**: Medium complexity, validation, generation, optimization

```
Step 1: Spawn Learner Agent (Task tool, subagent_type=general-purpose)
  - MUST NOT use external knowledge
  - CAN ONLY read files in chapter (and declared prerequisites)
  - Reports: completion status, gaps with exact locations

Step 2: Analyze Learner's gap report
  - If completion status = COMPLETE: END
  - If gaps found: Continue to Step 3

Step 3: Spawn Author Agent (Task tool, subagent_type=general-purpose)
  - Reads Learner's gap report
  - Creates/modifies content to fill gaps
  - Reports: files changed

Step 4: RE-VALIDATE (Loop back to Step 1)
  - Spawn Learner Agent again
  - Learner reads ONLY the modified/new files
  - Learner reports: completion status, remaining gaps

Step 5: Check termination
  - If Learner reports COMPLETE: END
  - If gaps remain AND iteration < max_iterations: Go to Step 3
  - If iteration >= max_iterations: Report partial completion, END
```

**Critical**: The loop is **Learner → Author → Learner → Author → ...** until Learner confirms completion or max_iterations reached.

## Triple-Agent Mode

**Use when**: High complexity, academic papers, math verification

```
Same as dual-agent, PLUS:

Step 6: After Learner confirms COMPLETE, spawn Reviewer Agent
  - Verifies formulas match paper
  - Checks code matches algorithms
  - Cross-references external sources
  - Reports: accuracy issues (if any)

Step 7: If Reviewer finds issues
  - Spawn Author to fix Reviewer's findings
  - Spawn Learner to re-validate after fixes
  - Loop until Reviewer approves or max_iterations reached
```

**Critical**: Reviewer runs AFTER Learner confirms completion. Reviewer findings trigger another Learner → Author cycle.

## Mode Mapping by Subcommand

| Subcommand | Collaboration Mode | Default Mode |
|------------|-------------------|--------------|
| `:check`   | validate          | dual-agent   |
| `:new`     | generate          | dual-agent   |
| `:improve` | optimize          | dual-agent   |
| `:learn`   | N/A               | single-agent |

## Example Execution

**Input**: `/docwise:improve "mcp, complex scenarios"`

**Step 1 - Parse**:
- collaboration mode: optimize
- chapter: agent/mcp-deep-dive (inferred or user-specified)
- complexity: high (keyword: complex)

**Step 2 - Match**:
- content_type: technical_guide (agent/*)
- Matched: `technical-guide-medium` or fallback to defaults
- recommended_mode: dual-agent

**Step 3 - Confirm**:
```
Matched pattern: technical-guide-medium
Recommended mode: dual-agent
Chapter config: agent/mcp-deep-dive -> collaboration_mode: (not set, using default)

Execute with dual-agent? [y/n/override=single|triple]
```

**Step 4 - Execute** (if confirmed):
Spawn Learner -> Analyze gaps -> Spawn Author -> Fill gaps
