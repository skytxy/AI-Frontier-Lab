---
name: docwise:improve
description: Improve existing chapter content with new requirements
command: docwise:improve
---

# Docwise: Improve

Optimize existing educational content based on new requirements.

## Flow

1. **Load**: Read existing chapter content
2. **Analyze**: Identify gaps relative to new requirements
3. **Plan**: Show improvement plan, wait for approval
4. **Execute**: Apply improvements

## Usage

```
/docwise:improve "add link verification to all experiments"
/docwise:improve "补充SDK导入说明" --chapter=agent/mcp-deep-dive
```

## Parameters

- `description`: Improvement requirements
- `chapter`: Target chapter path
- `focus`: Specific area to improve (content/structure/links/all)

## Common Improvements

- Add link verification
- Fix broken references
- Add missing examples
- Improve clarity
- Update to latest API
