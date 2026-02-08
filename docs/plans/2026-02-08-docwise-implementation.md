# Docwise Skill Renaming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the renaming of chapter-content-validator to docwise, updating all references across the codebase and documentation.

**Architecture:** The skill directory has already been renamed to `docwise`. This plan focuses on:
1. Updating all file references in documentation
2. Renaming paradigm document to match new naming
3. Updating MEMORY.md with new terminology
4. Verifying no broken references remain

**Tech Stack:** Bash (for find/sed), file editing, grep verification

---

## Task 1: Rename paradigm document

The paradigm document should be renamed from `chapter-validator-paradigm.md` to `docwise-workflow.md` to match the new naming scheme.

**Files:**
- Rename: `docs/frameworks/docwise-paradigm.md` -> `docs/frameworks/docwise-workflow.md`
- Modify: All files that reference the old paradigm name

**Step 1: Rename the paradigm document**

Run: `mv docs/frameworks/docwise-paradigm.md docs/frameworks/docwise-workflow.md`
Expected: File renamed successfully.

**Step 2: Verify the file exists**

Run: `ls -la docs/frameworks/docwise-workflow.md`
Expected: File is present.

**Step 3: Commit**

```bash
git add docs/frameworks/docwise-paradigm.md docs/frameworks/docwise-workflow.md
git commit -m "refactor: rename chapter-validator-paradigm.md to docwise-workflow.md"
```

---

## Task 2: Update skill.md file references

The skill.md file already exists with the new docwise naming, but verify it references the correct paradigm path.

**Files:**
- Verify: `.claude/skills/docwise/skill.md`

**Step 1: Read and verify skill.md references**

Run: `grep -n "paradigm\|docwise" .claude/skills/docwise/skill.md`
Expected: References point to `docwise-workflow.md` or `docwise-paradigm.md`.

**Step 2: Update any remaining chapter-validator references in skill.md**

If any references to the old naming exist, update them.

**Step 3: Commit (if changes made)**

```bash
git add .claude/skills/docwise/skill.md
git commit -m "docs: update skill.md to reference docwise-workflow.md"
```

---

## Task 3: Update README.md in skill directory

**Files:**
- Modify: `.claude/skills/docwise/README.md`

**Step 1: Update README.md title and content**

Replace references from "Chapter Content Validator" to "Docwise" and update all paths.

**Step 2: Commit**

```bash
git add .claude/skills/docwise/README.md
git commit -m "docs: update skill README to reflect docwise naming"
```

---

## Task 4: Update docs/frameworks files

**Files:**
- Modify: `docs/frameworks/chapter-validator-design.md`
- Modify: Any other framework docs with old references

**Step 1: Check for old references**

Run: `grep -r "chapter-validator\|chapter-content-validator\|chapter-validation" docs/frameworks/ --files-with-matches`
Expected: List of files with old references.

**Step 2: Update chapter-validator-design.md**

This file contains design documentation. Either:
- Rename it to `docwise-design.md`, or
- Update its content to reference the new naming

**Step 3: Update all framework docs**

Run:
```bash
# Replace chapter-content-validator with docwise in docs/frameworks
find docs/frameworks -type f -name "*.md" -exec sed -i '' 's/chapter-content-validator/docwise/g' {} +
find docs/frameworks -type f -name "*.md" -exec sed -i '' 's/chapter-validator/docwise/g' {} +
```

**Step 4: Commit**

```bash
git add docs/frameworks/
git commit -m "docs: update framework docs to use docwise naming"
```

---

## Task 5: Update docs/plans files

**Files:**
- Modify: `docs/plans/2026-02-08-chapter-validator-implementation.md`
- Modify: Any other plan files with old references

**Step 1: Update plan files**

Run:
```bash
# These are historical plan docs - preserve original naming in titles but update paths
find docs/plans -type f -name "*.md" -exec sed -i '' 's/\.claude\/skills\/chapter-content-validator/\.claude\/skills\/docwise/g' {} +
find docs/plans -type f -name "*.md" -exec sed -i '' 's/docs\/frameworks\/chapter-validator-paradigm\.md/docs\/frameworks\/docwise-workflow.md/g' {} +
```

**Step 2: Commit**

```bash
git add docs/plans/
git commit -m "docs: update plan file paths to reflect docwise renaming"
```

---

## Task 6: Update MEMORY.md

**Files:**
- Modify: `MEMORY.md` (project-level)

**Step 1: Update Chapter Content Validator section**

Find the "Chapter Content Validator" section and update it to reference "Docwise" with correct paths.

Changes needed:
- `chapter-validator-paradigm.md` -> `docwise-workflow.md`
- `.chapter-validation/` -> `.docwise/`
- `.chapter-validator/` -> `.docwise/`
- `chapter-content-validator` -> `docwise`

**Step 2: Commit**

```bash
git add MEMORY.md
git commit -m "docs: update MEMORY.md with docwise naming"
```

---

## Task 7: Update design doc references in chapter-validator-design.md

**Files:**
- Modify: `docs/frameworks/chapter-validator-design.md`

**Step 1: Read current content**

The design document has many internal references. Update paths from:
- `chapter-content-validator` to `docwise`
- `chapter-validator-paradigm.md` to `docwise-workflow.md`

**Step 2: Apply replacements**

Run:
```bash
sed -i '' 's/chapter-content-validator/docwise/g' docs/frameworks/chapter-validator-design.md
sed -i '' 's/chapter-validator-paradigm/docwise-workflow/g' docs/frameworks/chapter-validator-design.md
sed -i '' 's/\.chapter-validator\//\.docwise\//g' docs/frameworks/chapter-validator-design.md
sed -i '' 's/\.chapter-validation\//\.docwise\//g' docs/frameworks/chapter-validator-design.md
```

**Step 3: Commit**

```bash
git add docs/frameworks/chapter-validator-design.md
git commit -m "docs: update docwise-design.md paths and references"
```

---

## Task 8: Update docwise/lib TypeScript files

**Files:**
- Modify: `.claude/skills/docwise/lib/*.ts`

**Step 1: Check for old references**

Run: `grep -r "chapter-validator\|chapter-content-validator\|chapter-validation" .claude/skills/docwise/lib/ --files-with-matches`
Expected: May have comments or docstrings with old naming.

**Step 2: Update lib files**

Run:
```bash
find .claude/skills/docwise/lib -type f -name "*.ts" -exec sed -i '' 's/chapter-content-validator/docwise/g' {} +
find .claude/skills/docwise/lib -type f -name "*.ts" -exec sed -i '' 's/chapter-validator/docwise/g' {} +
```

**Step 3: Commit**

```bash
git add .claude/skills/docwise/lib/
git commit -m "refactor: update lib files to use docwise naming"
```

---

## Task 9: Update .claude/skills/docwise/templates

**Files:**
- Modify: `.claude/skills/docwise/templates/config-template.yaml`

**Step 1: Check template file**

Run: `cat .claude/skills/docwise/templates/config-template.yaml`
Expected: Should reference docwise, not chapter-validator.

**Step 2: Update if needed**

Run:
```bash
sed -i '' 's/chapter-validator/docwise/g' .claude/skills/docwise/templates/config-template.yaml
sed -i '' 's/chapter-content-validator/docwise/g' .claude/skills/docwise/templates/config-template.yaml
```

**Step 3: Commit**

```bash
git add .claude/skills/docwise/templates/
git commit -m "refactor: update template config to use docwise naming"
```

---

## Task 10: Verification - search for remaining old references

**Step 1: Grep for old patterns**

Run:
```bash
# Search for remaining old references
grep -r "chapter-content-validator" . --include="*.md" --include="*.ts" --include="*.yaml" 2>/dev/null | grep -v node_modules | grep -v ".git"
grep -r "chapter-validation" . --include="*.md" --include="*.ts" --include="*.yaml" 2>/dev/null | grep -v node_modules | grep -v ".git"
```

Expected: Should only find results in:
- Historical documentation (like old plan docs where original naming is preserved for context)
- Git history (not in current files)

**Step 2: Fix any remaining issues**

If any problematic references are found, fix them individually.

**Step 3: Final verification**

Run: `ls -la .claude/skills/`
Expected: Should see `docwise/` directory, not `chapter-content-validator/` or `chapter-validator/`.

Run: `ls -la docs/frameworks/ | grep docwise`
Expected: Should see `docwise-workflow.md` (and possibly `docwise-design.md`)

**Step 4: Final commit**

```bash
git add -A
git status
git commit -m "refactor: complete docwise renaming - all references updated"
```

---

## Summary of File Changes

| Old Path | New Path |
|----------|----------|
| `docs/frameworks/docwise-paradigm.md` | `docs/frameworks/docwise-workflow.md` |
| (optional) `docs/frameworks/chapter-validator-design.md` | `docs/frameworks/docwise-design.md` |
| `.claude/skills/docwise/` | `.claude/skills/docwise/` (already done) |
| `.chapter-validator/` | `.docwise/` (config directory) |
| `.chapter-validation/` | `.docwise/` (legacy name) |

## String Replacements Summary

| Old String | New String |
|------------|------------|
| `chapter-content-validator` | `docwise` |
| `chapter-validator` | `docwise` (except in historical context) |
| `chapter-validation` | `docwise` |
| `.chapter-validator/` | `.docwise/` |
| `.chapter-validation/` | `.docwise/` |
| `chapter-validator-paradigm.md` | `docwise-workflow.md` |
| `chapter-validator-design.md` | `docwise-design.md` |

---

**Version**: 1.0.0
**Created**: 2026-02-08
