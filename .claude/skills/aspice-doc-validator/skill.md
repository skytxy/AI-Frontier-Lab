---
name: aspice-doc-validator
description: Validate ASPICE-compliant documentation against template requirements. Checks for completeness, consistency, and format compliance in automotive software development documents.
command: aspice-doc-validator
parameters:
  template:
    description: "Template name or path (e.g., cariad-sw-design, /path/to/template.yaml)"
    type: string
    required: false
    default: "cariad-sw-design"
  document:
    description: "Path to the document to validate (Excel .xlsx, Word .docx, or Markdown)"
    type: string
    required: true
  level:
    description: "Validation level: 1 (required fields), 2 (formats), 3 (consistency), 4 (content quality), or all"
    type: string
    enum: ["1", "2", "3", "4", "all"]
    default: "all"
  output:
    description: "Output format: text, json, or markdown"
    type: string
    enum: ["text", "json", "markdown"]
    default: "markdown"
  aspice_level:
    description: "Target ASPICE level (1-5) for strictness calibration"
    type: number
    default: 3
---

# ASPICE Document Validator

Validate ASPICE-compliant documentation against template requirements. Designed for automotive software development documents that must comply with ASPICE, ISO 26262, and ISO/SAE 21434 standards.

## Quick Start

```bash
# Validate a document against default template
/aspice-doc-validator document.xlsx

# Validate with specific template
/aspice-doc-validator --template cariad-sw-design document.xlsx

# Validate at specific level (e.g., only required fields)
/aspice-doc-validator --level 1 document.xlsx

# Output as JSON for automation
/aspice-doc-validator --output json document.xlsx
```

## How It Works

The validator follows a four-level validation strategy:

1. **Level 1 - Required Fields**: Ensures all mandatory fields and sections are present
2. **Level 2 - Format Validation**: Checks field formats (version numbers, dates, codes)
3. **Level 3 - Consistency**: Verifies cross-references and version consistency
4. **Level 4 - Content Quality**: Assesses content depth and completeness

## Templates

Templates define the expected structure and validation rules:

| Template | Description | ASPICE Level |
|----------|-------------|--------------|
| `cariad-sw-design` | CARIAD Software Detailed Design | 3 |
| `cariad-sw-req` | CARIAD Software Requirements | 3 |
| `cariad-sw-arch` | CARIAD Software Architecture | 3 |

Templates are stored in `lib/templates/` as YAML configuration files.

## Validation Output

### Markdown Format (default)

```markdown
# ASPICE Validation Report

**Status**: FAILED
**Document**: software-design.xlsx
**Template**: cariad-sw-design
**ASPICE Level**: 3

## Critical Issues (Must Fix)

- [封面] Missing required field: 批准者
- [封面/变更履历] Version mismatch: Cover (V0.1) vs Change Log (V0.2)

## Important Issues (Should Fix)

- [封面] Invalid version format: V1 (expected Vx.y)
- [制约条件] Section too brief (50 characters)

## Minor Issues

- [概要] Empty abbreviations table
```

### JSON Format

```json
{
  "passed": false,
  "document": "software-design.xlsx",
  "template": "cariad-sw-design",
  "issues": [
    {
      "severity": "critical",
      "category": "missing_required_field",
      "location": "封面",
      "message": "Missing required field: 批准者"
    }
  ]
}
```

## Template Structure

A template YAML file defines:

```yaml
name: "Software Detailed Design"
aspice_level: 3
sections:
  cover:
    required: true
    fields:
      project_id:
        label: "项目编号"
        required: true
      version:
        label: "版本"
        required: true
        pattern: "^V[0-9]+\\.[0-9]+$"
  section_1:
    label: "概要"
    required: true
    subsections: [purpose, scope, references]
```

## ASPICE Level Calibration

Validation strictness varies by ASPICE level:

| Level | Description | Checks |
|-------|-------------|--------|
| 1 | Basic completeness | Required fields present |
| 2 | Process standardization | Format compliance |
| 3 | Process conformance | Consistency, traceability |
| 4 | Quantitative management | Metrics coverage |
| 5 | Continuous improvement | Quality trends, optimization |

Use `--aspice-level N` to adjust strictness.

## Supported Document Formats

- **Excel (.xlsx)**: Full support, all validation levels
- **Word (.docx)**: Basic support (requires python-docx)
- **Markdown (.md)**: Basic frontmatter and structure validation

## Error Categories

| Category | Severity | Description |
|----------|----------|-------------|
| `missing_required_field` | critical | Required field is empty or missing |
| `version_mismatch` | critical | Version inconsistency across document |
| `format_error` | important | Field doesn't match required pattern |
| `missing_section` | critical | Required section not found |
| `insufficient_content` | important | Section content too brief |
| `broken_reference` | important | Cross-reference target doesn't exist |
| `formatting_issue` | minor | Minor formatting inconsistencies |

## Integration

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
npm run validate:docs || exit 1
```

### CI/CD Pipeline

```yaml
# GitHub Actions
- name: Validate ASPICE docs
  run: |
    npx aspice-doc-validator docs/**/*.xlsx
```

## See Also

- [Experiment README](/agent/skills/experiments/05-aspice-doc-validator/) - Detailed tutorial
- [ASPICE v4.0 Specification](https://www.automotivespice.com/)
