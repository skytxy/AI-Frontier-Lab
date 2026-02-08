# Docwise: New - Agent Constraints

Behavioral rules for agents in the `:new` workflow.

## Author Agent

### Capabilities
- CAN create new content files
- CAN read paradigm for gap categories
- CAN use external knowledge and WebSearch
- CAN modify existing files in subsequent iterations

### Constraints
- MUST follow chapter structure from config
- MUST report all files created/modified
- MUST use project-specific link format conventions
- MUST read existing chapter frontmatter formats before creating new content
- MUST follow detected frontmatter format patterns from existing chapters
- MUST validate YAML frontmatter parses correctly (keep formatting simple, avoid complex inline syntax)

### Output Format
```
Files created:
- /path/to/file1.md
- /path/to/file2.md

Summary: Brief description of what was created
```

## Learner Agent

### Capabilities
- CAN read newly created content files
- CAN execute commands in sandbox
- CAN read declared prerequisites

### Constraints
- MUST NOT use external knowledge
- MUST NOT use WebSearch
- MUST NOT read files outside chapter + prerequisites
- MUST report completion status honestly
- MUST save runnable artifacts to sandbox directory

### Artifact Requirements

Learner Agent MUST preserve evidence of execution in `.docwise/sandbox/[id]/`:

| Artifact | Purpose | Content |
|----------|---------|---------|
| `learning-notes.md` | Incremental learning record | Problems encountered, confusions, dead ends |
| `validation-log.md` | Final verification summary | Completion status, all gaps found, verification results |
| `artifacts/` | Runnable evidence | Scripts created, test outputs, execution logs, screenshots |

**Artifact retention**: These files are NOT committed to git but must exist for review.

### Output Format
```
Completion: COMPLETE | PARTIAL | BLOCKED

Gaps found:
- [category] description at location

Blockers:
- List of blockers if any

Verification:
- Commands executed and results
```

## Reviewer Agent (triple-mode only)

### Capabilities
- CAN use WebSearch for verification
- CAN read external documentation
- CAN verify mathematical formulas

### Constraints
- MUST focus on technical accuracy
- MUST verify math matches papers
- MUST check code matches algorithms

### Output Format
```
Issues found:
- [severity] description at location

Verification complete: YES | NO
```

## Shared Constraints

### All Agents
- MUST work within sandbox directory
- MUST preserve existing content unless explicitly modifying
- MUST use project-specific terminology from paradigm

### Gap Categories

Gap categories are defined in `.docwise/paradigm.md`.
Agents MUST use the standardized categories when reporting issues.

### Link Format

Internal links MUST follow the format specified in `.docwise/paradigm.md`
under "Link Format Conventions".

Before creating any internal links:
1. Read `.docwise/paradigm.md` section "Link Format Conventions"
2. Verify against actual site build output
3. Project-specific rules are defined in paradigm, NOT in this skill

### Frontmatter Format Validation

Before creating frontmatter for any content file:
1. Read existing chapter frontmatter examples from the project
2. Follow detected format patterns exactly
3. Keep YAML syntax simple - avoid complex inline formatting
4. Validate YAML parses correctly after creation

**Frontmatter Anti-Patterns** (causes js-yaml parsing errors):
- Complex inline syntax in list items: `macOS: \`brew install jq\``
- Nested structures with mixed quotes and parentheses
- Platform-specific formatting in prerequisites field

**Frontmatter Best Practices**:
- Simple string values for scalar fields
- Flat list structures for array fields
- Quote values only when necessary (contains special chars)
- Platform-specific notes in content body, not frontmatter

**Validation**:
- Run site build after creating frontmatter
- If YAML parse error occurs, simplify the syntax
- Project-specific formats are defined in paradigm, NOT in this skill
