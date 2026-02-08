# Docwise Pattern Matching

How the experience store matches scenarios to collaboration modes.

## Seed Patterns Structure

From `.docwise/config.yaml`:

```yaml
seed_patterns:
  - id: technical-guide-low
    signature:
      content_type: technical_guide
      complexity: low
      keywords: [guide, tutorial, setup, quickstart]
      work_mode: validate
    recommended_mode: single-agent

  - id: technical-guide-medium
    signature:
      content_type: technical_guide
      complexity: medium
      keywords: [integration, api, protocol, implementation]
      work_mode: validate
    recommended_mode: dual-agent

  - id: academic-paper-high
    signature:
      content_type: academic_paper
      complexity: high
      keywords: [paper, math, formula, proof, derivation]
      work_mode: validate
    recommended_mode: triple-agent

  - id: generate-from-paper
    signature:
      content_type: academic_paper
      complexity: high
      keywords: [generate, paper, tutorial, create]
      work_mode: generate
    recommended_mode: dual-agent

  - id: optimize-existing
    signature:
      content_type: any
      complexity: medium
      keywords: [optimize, improve, update, refactor]
      work_mode: optimize
    recommended_mode: dual-agent
```

## Matching Algorithm

1. **Extract complexity** from input:
   - Keywords "simple", "basic", "简答", "单个" → low
   - Keywords "medium", "multiple", "2-3", "集成", "多个" → medium
   - Keywords "complex", "full", "complete", "完整", "全面" → high
   - Keywords "security", "performance", "安全", "性能" → advanced (treated as high)

2. **Detect content_type** from chapter path:
   - `agent/*` → technical_guide
   - `algo/*` → academic_paper

3. **Score each seed_pattern** by keyword matches:
   - Each matching keyword = +1 point
   - Select highest-scored pattern

4. **Get recommended_mode** from matched pattern

5. **Check chapter-specific override** in `.docwise/config.yaml` chapters[].collaboration_mode

## Work Modes

| Work Mode | Description | Default Collaboration |
|-----------|-------------|---------------------|
| **validate** | Check existing content | dual-agent |
| **generate** | Create new content from scenario | dual-agent |
| **optimize** | Improve existing content | dual-agent |

Inferred from command:
- `:check` → validate
- `:new` → generate
- `:improve` → optimize

## Chapter Configuration

Chapters can override defaults in `.docwise/config.yaml`:

```yaml
chapters:
  algo/attention/attention-is-all-you-need:
    type: academic_paper
    sections: [paper-summary/, implementation/, experiments/]
    prerequisites: [algo/attention/self-attention]
    collaboration_mode: triple-agent  # Override
```

## Related Documentation

- Paradigm: `.docwise/paradigm.md` - Project methodology, gap categories
- Config: `.docwise/config.yaml` - Seed patterns, chapter definitions
