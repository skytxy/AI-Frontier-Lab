# Docwise Agent Constraints

Behavioral constraints for each agent type in the Docwise system.

## Learner Agent

### Role
Zero-knowledge learner that validates content completeness.

### Constraints
```
- READ ONLY: chapter files + declared prerequisites
- NO external knowledge, NO internet
- Output: gap report with locations and categories
```

### Gap Report Format
Learner reports gaps using categories from `.docwise/paradigm.md` or `references/quality-categories.md`.

See **[quality-categories.md](./quality-categories.md)** for complete category definitions.

**When to report quality issues**:
- If a single file exceeds 500 lines without clear structure breaks
- If the same concept is explained in 3+ places with minimal variation
- If code examples repeat the same pattern with only minor changes
- If background information overwhelms the core topic (>30% of content is prerequisite knowledge)

### Validation Criteria

1. **Learner Must Complete**: The zero-knowledge learner agent should be able to complete the scenario using only the chapter content (and declared prerequisites). If the learner gets stuck, content is insufficient.

2. **Link Verification**:
   - **External links**: Should return 2xx-3xx status codes (use curl/HTTP HEAD requests)
   - **Internal cross-references**: Must point to existing files
   - **Internal web routes**: MUST NOT include `.md` extension (Astro routes are extensionless)

## Author Agent

### Role
Content creator that fills gaps identified by Learner.

### Constraints
```
- Input: Learner's gap report
- CAN modify content files
- CAN read paradigm (.docwise/paradigm.md) for gap categories
- Output: files changed list
```

### Authoring Guidelines

1. Follow chapter structure from `.docwise/config.yaml`
2. Use internal links without `.md` extension
3. Verify all external links are stable
4. Declare all prerequisites in chapter config

## Reviewer Agent

### Role
Specialized verifier for high-complexity academic content.

### Constraints
```
- Input: Author's changes + original content
- CAN use external sources for verification
- Output: verification report
```

### Verification Scope

1. Mathematical formulas match paper
2. Code implementations match algorithms
3. Cross-references external sources
4. Citations are accurate

### Quality Assessment

Reviewer should ALSO assess content quality. See **[quality-categories.md](./quality-categories.md)** for complete category definitions and thresholds.

**When to flag quality issues**:
- A concept document exceeds 800 lines
- An experiment README exceeds 600 lines
- Code examples take up >50% of the document without adding new patterns
- The same code pattern is shown 3+ times with trivial variations
- Content is unreadable in Light or Dark mode (contrast, syntax highlighting)

## Collaboration Mode Selection

| Mode | Use When | Complexity | Content Type |
|------|----------|------------|--------------|
| single-agent | Low complexity, simple checks, quick fixes | low | technical_guide |
| dual-agent | Medium complexity, validation, generation, optimization | medium | technical_guide, academic_paper |
| triple-agent | High complexity, academic papers, math verification | high | academic_paper |

## Default Values

From `.docwise/config.yaml`:
```yaml
defaults:
  max_iterations: 5
  collaboration_mode: dual-agent
  sections: [concepts/, experiments/]
```
