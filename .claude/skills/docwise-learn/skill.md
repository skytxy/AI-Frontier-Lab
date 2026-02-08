---
name: docwise:learn
description: Learn and internalize lessons from validation into paradigm docs or config. Use when discovering patterns that should improve future Docwise iterations.
command: docwise:learn
argument-hint: "[lesson description]"
parameters:
  lesson:
    description: "The lesson or pattern to learn"
    type: string
    required: true
  level:
    description: "Feedback level (2|3|4)"
    type: number
    enum: [2, 3, 4]
    required: false
  category:
    description: "Lesson category: gap_category, pattern, convention"
    type: string
    enum: [gap_category, pattern, convention]
    required: false
---

# Docwise: Learn

Learn and internalize lessons to improve future Docwise iterations.

## Purpose

When you discover a pattern, rule, or best practice during execution, learn it so the system evolves:

| Level | Scope | Target File | Example |
|-------|-------|-------------|---------|
| **2** | Single chapter | `.docwise/config.yaml` | Add `collaboration_mode: triple-agent` |
| **3** | All chapters | `.docwise/paradigm.md` | Add gap category `link_extension_mismatch` |
| **4** | Global behavior | Skill code | Add new constraint or step |

## Execution Flow

```
1. PARSE INPUT
   - Extract: lesson description from <args>
   - Detect: level (2|3|4) if not specified

2. DETERMINE TARGET
   - Level 2: Update .docwise/config.yaml
   - Level 3: Update .docwise/paradigm.md
   - Level 4: Update skill code

3. READ TARGET FILE
   - Level 2: Read .docwise/config.yaml
   - Level 3: Read .docwise/paradigm.md
   - Level 4: Read skill file(s) to be updated

4. FOR LEVEL 4 ONLY: Apply skill-creator discipline
   a) Check frontmatter: name, description (with "Use when"), command present?
   b) Check progressive disclosure: SKILL.md <5k words, details in references/?
   c) Check structure: imperative/infinitive form, not second person
   d) Check paths: all relative to skill bundle, no absolute paths
   e) If any check fails: Fix the issue as part of the update

5. UPDATE FILE
   - Apply lesson to appropriate section
   - For Level 4: Apply skill-creator best practices
   - Confirm update with user

6. WRITE FILE
   - Save changes

7. ASK ABOUT AUTO-APPLY (for Level 3-4)
   - "This lesson affects future iterations. Auto-apply now? [y/n]"
```

## Level Detection

Auto-detect level from lesson content:

| Lesson Pattern | Level |
|----------------|-------|
| "X chapter needs Y mode" | 2 (chapter-specific) |
| "internal links should not have .md" | 3 (all chapters) |
| "Learner should check prerequisites first" | 4 (skill behavior) |

## Update Locations

### Level 2: Chapter Config (.docwise/config.yaml)

```yaml
chapters:
  agent/mcp-deep-dive:
    collaboration_mode: triple-agent  # Added
```

### Level 3: Paradigm (.docwise/paradigm.md)

Add to `Gap Categories` table:

```markdown
| link_extension_mismatch | Internal link uses `.md` extension (should be extensionless for web routes) |
```

### Level 4: Skill Code

**CRITICAL**: When updating Docwise skills (Level 4), follow **skill-creator best practices**:

| Practice | Requirement | Anti-Pattern |
|----------|-------------|---------------|
| **Project-agnostic** | Skill MUST NOT contain project-specific rules | Hardcoding `/topics/`, directory names, project-specific paths |
| **Progressive disclosure** | SKILL.md <5k words, details in `references/` | 200+ line skill.md with everything inline |
| **Description quality** | "Use when..." in frontmatter | Vague descriptions |
| **Naming clarity** | Verbs that indicate action (check, learn, improve) | Abstract nouns (record, note) |
| **Structure** | frontmatter + imperative body | Missing frontmatter or passive voice |
| **No version history** | SKILL.md is timeless | `## Version`, `## Changelog` sections |
| **Path references** | Relative to skill bundle | Absolute paths like `~/.claude/skills/` |

**Pre-update checklist** (run before making Level 4 changes):
1. Is the frontmatter complete with `name`, `description`, `command`?
2. Does the description clearly state "Use when..."?
3. Is the content structured with progressive disclosure?
4. Should detailed content move to `references/`?
5. Are all referenced paths relative and valid?
6. **CRITICAL**: Does this contain ANY project-specific content? If yes, move to paradigm or config.

Update targets:
- `.claude/skills/docwise/skill.md` (main skill, keep <100 lines)
- `.claude/skills/docwise/references/*.md` (detailed documentation)
- Subcommand skill files (`:new`, `:improve`, `:check`, `:learn`)

## Triggers (shorthand)

Users may use these phrases to trigger learning:
- "learn this"
- "记下来"
- "内化这个"
- "update paradigm"

## Example

**Input**: `/docwise:learn "internal links should not have .md extension"`

**Process**:
1. Detect: Level 3 (affects all chapters)
2. Read `.docwise/paradigm.md`
3. Add to `Gap Categories` section:
   ```markdown
   | link_extension_mismatch | Internal link uses .md extension |
   ```
4. Confirm update
5. Write file
6. Ask: "Auto-apply to existing chapters? [y/n]"
