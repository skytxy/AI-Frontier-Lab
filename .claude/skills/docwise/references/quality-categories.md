# Docwise Quality Categories

Gap and quality issue categories used by Learner and Reviewer agents.

## Content Gaps (Missing Information)

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
| `link_broken` | External or internal link returns 404/4xx/5xx |
| `link_extension_mismatch` | Internal link uses `.md` extension |

## Quality Issues (Content Bloat)

Content should be **concise yet complete**. Report when content exceeds thresholds:

| Category | Description | Threshold |
|----------|-------------|-----------|
| `content_redundant` | Same concept explained multiple times without new insight | >2 similar explanations |
| `example_excessive` | Too many examples for the same concept | >3 similar examples |
| `detail_irrelevant` | Deep dive into tangential topics | Off-topic sections >200 lines |
| `code_snippet_excessive` | Large code blocks where pseudocode suffices | >100 lines for single concept |
| `information_density_low` | Wordy explanations that could be concise | Explanation >5x concept complexity |
| `theme_contrast_poor` | Text/code not readable in Light or Dark mode | Contrast ratio <4.5:1 |
| `code_highlighting_broken` | Syntax highlighting fails in one theme | Code blocks unreadable |
| `shiki_theme_missing` | Site shiki config lacks dual-theme support | Single `theme` instead of `themes: { light, dark }` |

## File Size Guidelines (Soft Limits)

- **Concept documents**: ~300-500 lines optimal, >800 lines warrants review
- **Experiment READMEs**: ~200-400 lines optimal, >600 lines warrants review
- **Code examples**: Should demonstrate unique patterns, avoid repetition

## When Quality Issues Are Found

- **Learner**: Flag as quality issue, suggest specific consolidation
- **Reviewer**: Verify the flag, provide rewrite suggestions
- **Author**: Consolidate, prune, or restructure (not just add more)

## Link Verification Conventions

### Internal Links

```markdown
<!-- Correct: No extension -->
[Concept](/topics/xxx/concepts/yyy)

<!-- Wrong: Has .md -->
[Concept](/topics/xxx/concepts/yyy.md)
```

**Reason**: Astro generates extensionless routes.

### External Links

- Use full HTTPS URLs
- Prefer stable, official sources
- Verify with curl: `curl -s -o /dev/null -w "%{http_code}" <url>`
- Should return 2xx-3xx status codes

## Related Documentation

- Paradigm: `.docwise/paradigm.md` - Project methodology
- Config: `.docwise/config.yaml` - Seed patterns, chapter definitions
