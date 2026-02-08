# Chapter Content Validation Paradigm

> **Project-level methodology** - This document defines the methodology for validating educational content in AI-Frontier-Lab. It applies to all chapters under `agent/` and `algo/`, defining quality standards, dependency relationships, and execution conventions.

## Purpose

The Chapter Content Validator is an experience-driven collaboration engine that:
1. Validates existing content by simulating a zero-knowledge learner
2. Generates new content from topics/papers
3. Optimizes existing content for new requirements

The Skill (implementation) is generic and project-agnostic. This Paradigm (methodology) is project-specific.

## Three-Layer Architecture

```
Paradigm (this document)
  -> Project methodology, dependencies, quality standards
Skill (.claude/skills/chapter-content-validator/)
  -> Generic engine, experience store, mode selection
Config (.chapter-validation/config.yaml)
  -> Project-specific chapter types, sections, overrides
```

## Chapter Dependencies

### Algorithm Foundations

```
algo/foundations/gradient-descent (no dependencies)
algo/foundations/backpropagation
  # 依赖: algo/foundations/gradient-descent
algo/foundations/optimization
  # 依赖: algo/foundations/gradient-descent
```

### Attention Domain

```
algo/attention/self-attention
  # 依赖: algo/foundations/backpropagation
algo/attention/bahdanau
  # 依赖: algo/foundations/backpropagation
algo/attention/attention-is-all-you-need
  # 依赖: algo/attention/self-attention
algo/attention/efficient
  # 依赖: algo/attention/self-attention
```

## Quality Standards

1. **Learner Must Complete**: The zero-knowledge learner agent should be able to complete the scenario using only the chapter content (and declared prerequisites). If the learner gets stuck, content is insufficient.

2. **Max Iterations**: Default 5 iterations to validate a chapter. Increase if the chapter is known to be complex.

3. **Web Verification**: For chapters with visual/mathematical content, verify rendering through the built website (same way real users consume content).

## Web Verification Conventions

When web verification is required:

1. **Port Isolation**: Use dedicated validation ports starting at 3001 to avoid conflicts with development server (port 3000)
2. **Build Command**: `cd site && npm run build:no-check`
3. **Verification**: Read built HTML, use `@frontend-design` skill if available
4. **Project-Level**: Isolation is defined at project level to prevent conflicts between parallel validation runs

## Gap Categories (Level 3 Feedback)

These categories are defined at the paradigm level because they apply across all chapters:

| Category | Description |
|----------|-------------|
| `concept_missing` | Concept not explained |
| `step_unclear` | Step instructions vague |
| `code_error` | Code has bugs |
| `context_missing` | Why/when unclear |
| `formula_unclear` | Math derivation missing |
| `implementation_gap` | Paper to code mapping unclear |
| `dependency_undeclared` | Chapter needs prerequisite not listed |
| `web_rendering_issue` | Content renders incorrectly on website |

New categories discovered during validation should be added here.

## Agent Type Guidelines

### Learner Agent

- MUST NOT use external knowledge or internet
- CAN ONLY read files within the chapter directory (and declared prerequisites)
- Reports: completion status, knowledge gaps with exact locations, blockers

### Author Agent

- Analyzes Learner's gap report
- Creates/modifies content files to fill gaps
- Reports: files changed, new gap categories discovered

### Reviewer Agent (triple-agent mode)

- Verifies mathematical formulas match paper
- Checks code implementations match algorithms
- Cross-references external sources

## Chapter Structure Conventions

### Agent Chapters

Typical sections:
- `concepts/` - Concept documentation
- `experiments/` - Hands-on exercises
- `integration/` - API integrations (if applicable)

### Algo Chapters

Typical sections:
- `paper-summary/` - Paper overview and key insights
- `implementation/` - Algorithm implementation
- `experiments/` - Reproducible experiments
- `application/` - Real-world applications (optional)

## Naming Conventions

### Algo Directory Structure

- **General concepts**: Use shorthand (`self-attention`, `resnet`)
- **Milestone papers**: Use full paper name (`attention-is-all-you-need`)
- **Common abbreviations**: Use abbreviation (`lenet`, `vgg`, `ddpm`)

---

**Version**: 3.0.0 (Three-layer architecture)
**Last Updated**: 2026-02-08
