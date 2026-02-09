# ASPICE Document Validator

An AI-powered skill for validating ASPICE-compliant documentation in automotive software development.

## Overview

This skill validates automotive software documentation against ASPICE (Automotive SPICE) template requirements. It checks for completeness, consistency, format compliance, and content quality across documents that must comply with ASPICE, ISO 26262, and ISO/SAE 21434 standards.

## Key Features

- **Template-Driven Validation**: Define rules in YAML, adapt to any ASPICE template
- **Four-Level Validation**: From required fields to content quality assessment
- **Multi-Format Support**: Excel (.xlsx), Word (.docx), Markdown
- **ASPICE Level Calibration**: Adjust strictness based on target ASPICE level (1-5)
- **Detailed Reporting**: Markdown, JSON, or text output with actionable findings

## Use Cases

1. **Pre-Submission Check**: Validate documents before ASPICE assessment
2. **Template Compliance**: Ensure documents follow organizational templates
3. **CI/CD Integration**: Automated validation in document pipelines
4. **Quality Gate**: Prevent publication of non-compliant documentation

## Installation

The skill is located at `.claude/skills/aspice-doc-validator/`.

## Usage

```bash
# Basic validation
/aspice-doc-validator document.xlsx

# With specific template
/aspice-doc-validator --template cariad-sw-design document.xlsx

# JSON output for automation
/aspice-doc-validator --output json document.xlsx

# Specific validation level
/aspice-doc-validator --level 3 document.xlsx
```

## File Structure

```
.claude/skills/aspice-doc-validator/
├── skill.md              # Main skill definition
├── README.md             # This file
├── package.json          # Dependencies
├── lib/
│   ├── types.ts          # Type definitions
│   ├── template-loader.ts # Template YAML parser
│   ├── validators/
│   │   ├── level1.ts     # Required fields checker
│   │   ├── level2.ts     # Format validator
│   │   ├── level3.ts     # Consistency checker
│   │   └── level4.ts     # Content quality analyzer
│   ├── parsers/
│   │   ├── excel.ts      # Excel (.xlsx) parser
│   │   ├── word.ts       # Word (.docx) parser
│   │   └── markdown.ts   # Markdown parser
│   └── reporter.ts       # Report generator
└── templates/
    ├── cariad-sw-design.yaml  # CARIAD Software Design template
    ├── cariad-sw-req.yaml     # CARIAD Requirements template
    └── cariad-sw-arch.yaml    # CARIAD Architecture template
```

## Validation Levels

### Level 1: Required Fields
- All mandatory fields present and non-empty
- All required sections exist
- Change log has at least one entry

### Level 2: Format Validation
- Version numbers follow Vx.y pattern
- Dates in YYYY-MM-DD format
- ASPICE/ASIL/CAL levels are valid options

### Level 3: Consistency
- Cover version matches latest change log entry
- Cross-references point to existing sections
- ASPICE level declaration matches content requirements

### Level 4: Content Quality
- Sections have sufficient content depth
- Content is relevant to section title
- Safety requirements align with ASIL level

## Template Reference

Templates are YAML files defining document structure and rules:

```yaml
name: "CARIAD Software Detailed Design"
version: "1.0"
aspice_level: 3
sections:
  cover:
    required: true
    fields:
      project_id:
        label: "项目编号"
        required: true
      file_id:
        label: "文件编号"
        required: true
      version:
        label: "版本"
        required: true
        pattern: "^V[0-9]+\\.[0-9]+$"
      aspice_levels:
        label: "ASPICE 等级"
        required: true
        options: ["ASPICE-1", "ASPICE-2", "ASPICE-3", "ASPICE-4", "ASPICE-5"]
        min_selection: 1
```

## Error Categories

| Category | Severity | Description |
|----------|----------|-------------|
| `missing_required_field` | critical | Required field is empty or missing |
| `missing_section` | critical | Required section not found |
| `version_mismatch` | critical | Version inconsistency |
| `format_error` | important | Invalid format pattern |
| `insufficient_content` | important | Content too brief |
| `broken_reference` | important | Invalid cross-reference |
| `formatting_issue` | minor | Minor formatting issue |

## ASPICE Level Calibration

Each ASPICE level has different strictness requirements:

| Level | Focus | Key Checks |
|-------|-------|------------|
| ASPICE-1 | Completeness | All fields filled |
| ASPICE-2 | Standardization | Format compliance |
| ASPICE-3 | Conformance | Consistency, traceability |
| ASPICE-4 | Quantitative | Metrics coverage |
| ASPICE-5 | Optimization | Quality trends |

Use `--aspice-level N` to adjust validation strictness.

## Experiment Guide

See [Exp-05: ASPICE Doc Validator](/agent/skills/experiments/05-aspice-doc-validator/) for a complete tutorial on:

- ASPICE document structure analysis
- Template configuration creation
- Validator implementation details
- Practical examples with CARIAD template

## Dependencies

- `openpyxl` (Python): Excel file parsing
- `python-docx` (Python): Word file parsing
- `js-yaml` (Node.js): YAML template parsing
- `typescript`: Core implementation language

## Related Skills

- [docwise](/docwise) - General documentation validation
- [utf8-guardian](/utf8-guardian) - Encoding validation

## Standards Reference

- [ASPICE v4.0](https://www.automotivespice.com/)
- [ISO 26262](https://www.iso.org/standard/70928.html) - Functional Safety
- [ISO/SAE 21434](https://www.iso.org/standard/71129.html) - Cybersecurity
