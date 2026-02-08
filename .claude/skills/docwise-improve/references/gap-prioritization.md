# Docwise: Improve - Gap Prioritization

How gaps are categorized and prioritized in the `:improve` workflow.

## Priority Levels

Gaps are categorized by severity and impact:

| Priority | Category | Rule | Example |
|----------|----------|------|---------|
| **critical** | `concept_missing` | Core concept not explained | "What is attention?" not answered |
| **critical** | `code_error` | Code has bugs, won't run | Syntax error, missing import |
| **critical** | `dependency_undeclared` | Required prerequisite missing | Uses concept not in prerequisites |
| **critical** | `link_broken` | Link returns 4xx/5xx | External resource unavailable |
| **important** | `step_unclear` | Instructions vague | "Configure X" without details |
| **important** | `context_missing` | Why/when unclear | Concept explained but not use case |
| **important** | `implementation_gap` | Paper to code unclear | Math shown but code missing steps |
| **minor** | `formula_unclear` | Derivation could be clearer | Math skips steps |
| **minor** | `detail_irrelevant` | Off-topic content | Tangential deep dive |

## Author Fix Order

```
1. Fix ALL critical gaps
2. Fix ALL important gaps
3. Address minor gaps if time permits
4. Flag quality issues (redundancy, bloat)
```

## Quality vs Content Gaps

**Content Gaps**: Missing information
- Fix by adding content
- Examples: `concept_missing`, `step_unclear`

**Quality Issues**: Too much content
- Fix by consolidating, pruning
- Examples: `content_redundant`, `example_excessive`

See `.docwise/paradigm.md` for complete gap category list.

## Gap Report Format

Learner reports gaps in structured format:

```yaml
gaps:
  - category: concept_missing
    description: "Self-attention mechanism not explained"
    location: "concepts/attention.md:45-60"
    severity: critical

  - category: code_error
    description: "Missing import for torch.nn.functional"
    location: "implementation/attention.py:12"
    severity: critical

  - category: step_unclear
    description: "How to configure multi-head heads not specified"
    location: "experiments/01-basic.md:30"
    severity: important
```

## Consolidation Guidelines

When quality issues are found:

| Issue | Threshold | Action |
|-------|-----------|--------|
| `content_redundant` | >2 similar explanations | Merge into one |
| `example_excessive` | >3 similar examples | Keep most distinct |
| `detail_irrelevant` | >200 lines off-topic | Move to appendix or remove |
| `code_snippet_excessive` | >100 lines | Use pseudocode |

Author should **never** just add more content when consolidation is the right answer.
