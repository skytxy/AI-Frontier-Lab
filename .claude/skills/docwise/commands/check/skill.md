---
name: docwise:check
description: Check for errors, broken links, logic issues
command: docwise:check
---

# Docwise: Check

Validate educational content for quality issues.

## Checks

| Type | Description |
|------|-------------|
| **links** | External HTTP status, internal file existence |
| **logic** | Consistency, contradictions, missing steps |
| **content** | Completeness, clarity, learner viability |

## Usage

```
/docwise:check              -- check everything
/docwise:check --focus=links -- only check links
/docwise:check logic         -- check logic/consistency
```

## Parameters

- `focus`: What to check (links/logic/content/all)
- `chapter`: Target chapter path
- `fix`: Auto-fix fixable issues

## Link Checks

- External links: HTTP 200-399 status
- Internal links: File exists
- Extension check: No .md in web routes

## Logic Checks

- Step sequence is complete
- No contradictions
- All referenced concepts exist
- Prerequisites are declared
