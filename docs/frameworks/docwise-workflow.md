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
Skill (.claude/skills/chapter-content-validator/)
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
| `link_broken` | External or internal link returns 404/4xx/5xx |
| `link_extension_mismatch` | Internal link uses `.md` extension (should be extensionless for web routes) |

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

## Link Format Conventions

### Internal Cross-References

**规则**：内部链接指向 Web 路由，**不包含 `.md` 扩展名**。

```markdown
<!-- 正确 -->
[MCP 入门](/topics/mcp-deep-dive/concepts/mcp-basics)

<!-- 错误 -->
[MCP 入门](/topics/mcp-deep-dive/concepts/mcp-basics.md)
```

**原因**：Astro 站点生成的是扩展less 路由（`/concepts/mcp-basics`），带 `.md` 会导致 404。

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

**Version**: 3.1.0 (Added link format conventions)
**Last Updated**: 2026-02-08
