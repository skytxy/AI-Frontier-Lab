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
