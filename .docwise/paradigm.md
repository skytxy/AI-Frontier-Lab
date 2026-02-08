# 文档工作流自动化 Paradigm

> **Project-level methodology** - This document defines the methodology for validating educational content in AI-Frontier-Lab. It applies to all chapters under `agent/` and `algo/`, defining quality standards, dependency relationships, and execution conventions.

## Purpose

The Docwise is an experience-driven collaboration engine that:
1. Validates existing content by simulating a zero-knowledge learner
2. Generates new content from topics/papers
3. Optimizes existing content for new requirements

The Skill (implementation) is generic and project-agnostic. This Paradigm (methodology) is project-specific.

## Three-Layer Architecture

```
Paradigm (this document)
  -> Project methodology, dependencies, quality standards
Skill (.claude/skills/docwise/)
  -> Generic engine, experience store, mode selection
Config (.docwise/config.yaml)
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

4. **Link Verification**: All external and internal links must be validated.
   - **External links**: Should return 2xx-3xx status codes (use curl/HTTP HEAD requests)
   - **Internal cross-references**: Must point to existing files
   - **Internal web routes**: MUST NOT include `.md` extension (Astro routes are extensionless)
   - **Pattern check**: `/topics/xxx/concepts/yyy.md` → `/topics/xxx/concepts/yyy`

5. **Theme Verification**: Content must be readable in both Light and Dark modes.
   - **Code blocks**: Must use syntax highlighting that works in both themes
   - **Inline code**: Must not rely on color alone for meaning
   - **Images/diagrams**: Must be legible in both themes (avoid hardcoded backgrounds)
   - **Tables**: Borders and contrast must be sufficient in both themes
   - **Verification**: Build site and check rendering in both modes before publishing

## Web Verification Conventions

When web verification is required:

1. **Port Isolation**: Use dedicated validation ports starting at 3001 to avoid conflicts with development server (port 3000)
2. **Build Command**: `cd site && npm run build:no-check`
3. **Verification**: Read built HTML, use `@frontend-design` skill if available
4. **Project-Level**: Isolation is defined at project level to prevent conflicts between parallel validation runs
5. **Theme Check**: Verify rendering in BOTH Light and Dark modes
   - Toggle theme in browser or inspect rendered CSS classes
   - Check code blocks, inline code, tables, and images
   - Flag `theme_contrast_poor` or `code_highlighting_broken` if issues found

## Gap Categories (Level 3 Feedback)

These categories are defined at the paradigm level because they apply across all chapters:

### Content Gaps (Missing Information)

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
| `link_extension_mismatch` | Internal link uses `.md` extension (should be extensionless for web routes) |

### Quality Issues (Content Bloat)

Content should be **concise yet complete**. Learner and Reviewer should flag when content exceeds information density thresholds:

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
| `skill_update_adhoc` | Docwise updated without following skill-creator best practices | Temporary patch instead of systematic improvement |

**File size guidelines** (soft limits, not hard rules):
- Concept documents: ~300-500 lines optimal, >800 lines warrants review
- Experiment READMEs: ~200-400 lines optimal, >600 lines warrants review
- Code examples: Should demonstrate unique patterns, avoid repetition

**When content exceeds thresholds**:
- Learner: Flag as quality issue, suggest specific consolidation
- Reviewer: Verify the flag, provide rewrite suggestions
- Author: Consolidate, prune, or restructure (not just add more)

New categories discovered during validation should be added here.

## Docwise Self-Improvement (Meta-Pattern)

When issues are discovered **in Docwise itself** (the skill system, not chapter content), use the `:learn` subcommand to evolve the system:

### Meta-Level Update Categories

| Category | Level | Target | Example |
|----------|-------|--------|---------|
| **Missing validation** | 3 | `.docwise/paradigm.md` | Add new Gap Category (e.g., `theme_contrast_poor`) |
| **Skill workflow issue** | 4 | Skill code | Fix execution flow (e.g., add Learner re-validation step) |
| **Subcommand naming** | 4 | Skill directories | Rename `:record` → `:learn` for clarity |
| **Reference needed** | 4 | `references/` | Move detailed docs from skill.md to references/ |

### Skill-Creator Alignment Mandate

**CRITICAL**: When updating Docwise skills (Level 4 changes), follow **skill-creator best practices**:

| Practice | Requirement | Anti-Pattern |
|----------|-------------|---------------|
| **Project-agnostic** | Skill MUST NOT contain project-specific rules | Hardcoding `/topics/`, directory names, project-specific paths |
| **Progressive disclosure** | SKILL.md <5k words, details in `references/` | 200+ line skill.md with everything inline |
| **Description quality** | "Use when..." in frontmatter | Vague descriptions |
| **Naming clarity** | Verbs that indicate action (check, learn, improve) | Abstract nouns (record, note) |
| **Structure** | frontmatter + imperative body | Missing frontmatter or passive voice |
| **No version history** | SKILL.md is timeless | `## Version`, `## Changelog` sections |
| **Path references** | Relative to skill bundle | Absolute paths like `~/.claude/skills/` |
| **Reference paradigm** | Project-specific rules reference `.docwise/paradigm.md` | Embedding project rules in skill |

**Before updating Docwise**, run through skill-creator Step 4 (Edit the Skill):
1. Is the frontmatter complete with `name`, `description`, `command`?
2. Does the description clearly state "Use when..."?
3. Is the content structured with progressive disclosure?
4. Should detailed content move to `references/`?
5. Are all referenced paths relative and valid?
6. **CRITICAL**: Does this contain ANY project-specific content? If yes, move to paradigm or config.

### Feedback Loop Pattern

```
1. User discovers issue with Docwise during execution
2. Use `/docwise:learn "description of issue"`
3. System detects level (3 or 4) automatically
4. Apply skill-creator discipline before making changes
5. Update paradigm.md or skill code systematically
6. Future iterations benefit from the learned lesson
```

**This is the meta-level version of the Learner → Author → Learn loop**: The system learns from its own usage patterns, but updates follow the same quality standards expected of chapter content.

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

## Link Format Conventions

### Internal Cross-References

**规则**：内部链接指向 Web 路由，**不包含 `.md` 扩展名**。

```markdown
<!-- 正确：使用 /topics/ 前缀 -->
[MCP 入门](/topics/mcp-deep-dive/concepts/mcp-basics)
[实验 01](/topics/mcp-deep-dive/experiments/01-protocol-inspector/)

<!-- 错误 1：使用物理目录结构 /agent/ -->
[MCP 入门](/agent/mcp-deep-dive/concepts/mcp-basics)  <!-- 404! -->

<!-- 错误 2：带 .md 扩展名 -->
[MCP 入门](/topics/mcp-deep-dive/concepts/mcp-basics.md)  <!-- 404! -->
```

**重要区别**：

| 物理目录 | Web 路由 |
|---------|---------|
| `agent/mcp-deep-dive/` | `/topics/mcp-deep-dive/` |
| `algo/attention/` | `/topics/attention/` |
| `agent/skills/` | `/topics/skills/` |

**原因**：Astro 站点统一使用 `/topics/` 作为所有章节的路由前缀。物理目录结构（`agent/`、`algo/`）不反映在 Web 路由中。

### External Links

**规则**：使用完整的 HTTPS URL，优先选择稳定、官方的链接源。

```markdown
<!-- 官方文档优先 -->
[MCP 规范](https://modelcontextprotocol.io/docs/specification/)

<!-- 避免使用可能变更的子域名 -->
<!-- 不推荐：https://spec.modelcontextprotocol.io (已失效) -->
```

**验证方法**：
```bash
# 批量检查外部链接状态
curl -s -o /dev/null -w "%{http_code}" https://example.com
```

---
