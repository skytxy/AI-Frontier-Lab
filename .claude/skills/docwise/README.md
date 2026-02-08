# Docwise

Experience-driven collaboration engine for validating, generating, and optimizing educational content via multi-agent workflows.

## Overview

Docwise is a generic, project-agnostic skill that coordinates multi-agent collaboration (Learner, Author, Reviewer) to ensure educational content is complete, accurate, and learner-friendly.

**Core Philosophy**: Learn from every execution through scenario-based validation.

## Features

- **Scenario-Based Validation**: Learner agents execute real tasks to verify documentation
- **Overview Display**: Shows "what is it" and "use cases" before execution
- **Sandbox Isolation**: Language-specific environments (python-uv, node-local, cargo)
- **Learner Artifacts**: Generates README.md and learning-log.md in sandbox
- **Gap Priority Filtering**: Categorizes gaps as critical/important/minor
- **Multi-Agent Collaboration**: Single/dual/triple agent modes based on complexity

## Quick Start

```bash
# Generate new content from scenario
/docwise:new "implement a GitHub API MCP Server"

# Improve existing content with new requirements
/docwise:improve "add error handling to all examples"

# Check content quality
/docwise:check --focus=links

# Learn and internalize patterns
/docwise:learn "internal links should not have .md extension"
```

## New Capabilities

### Overview Display

Before execution, Docwise shows:
- What is this technology?
- What are its use cases?
- Current document status (draft/in-progress/published/completed)

### Scenario Generation

- For `:new`: WebSearch for topic overview and practical examples
- For `:check`: Generate validation scenario focused on coverage
- For `:improve`: Generate scenario targeting identified gaps

### Sandbox Environment

Each execution creates an isolated sandbox:
```
.docwise/sandbox/
  └── [id]-[description]/
      ├── README.md           # Validation summary
      ├── learning-log.md     # Execution process
      ├── code/              # Working code
      └── validation/        # Test outputs
```

### Language Isolation

| Language | Isolation Type |
|----------|---------------|
| Python | python-uv (or python-venv) |
| Node.js | node-local |
| Rust | cargo |
| Go | go-mod |
| Java | maven |
| C++ | none |

### Gap Prioritization

Gaps are categorized by severity:
- **Critical**: `concept_missing_critical`, `code_error_critical`, `dependency_undeclared`
- **Important**: `concept_missing`, `step_unclear`, `code_error`
- **Minor**: `typo`, `formatting_issue`

## File Structure

```
.claude/skills/docwise/
├── skill.md                 # Main skill definition
├── README.md                # This file
├── package.json             # NPM configuration
├── lib/
│   ├── types.ts             # Core TypeScript interfaces
│   ├── config-loader.ts     # Config loading, language detection
│   ├── scenario-loader.ts   # Scenario generation from search
│   ├── sandbox-manager.ts   # Sandbox directory management
│   ├── overview-display.ts  # Overview display utilities
│   ├── gap-prioritizer.ts   # Gap priority filtering
│   ├── artifact-generator.ts # Learner artifact generation
│   ├── experience-store.ts  # Pattern matching + persistence
│   ├── mode-recommender.ts  # Collaboration mode selection
│   ├── feedback-processor.ts # 4-level feedback classification
│   ├── dependency-resolver.ts # Topological sort for chapters
│   └── executor.ts          # Core orchestration engine
└── references/
    ├── execution-flows.md   # Detailed workflows
    ├── agent-constraints.md # Agent behavioral rules
    ├── pattern-matching.md  # Experience store patterns
    └── quality-categories.md # Gap categories
```

## Subcommands

| Command | Purpose | Agent Flow |
|---------|---------|-----------|
| `:new` | Create new content from scenario | Author -> Learner |
| `:improve` | Enhance existing content | Learner -> Author -> Learner |
| `:check` | Validate content quality | Learner -> (optional) Author |
| `:learn` | Internalize lessons | Single agent |

## Project Configuration

Each project using Docwise has a `.docwise/config.yaml`:

```yaml
version: "1.0"

defaults:
  max_iterations: 5
  collaboration_mode: dual-agent
  sections: [concepts/, experiments/]

chapters:
  agent/mcp-deep-dive:
    type: technical_guide
    language: node        # Primary language for sandbox
    sections: [concepts/, experiments/]
    scenarios:
      basic-tool:
        type: tool
        description: "Build a basic MCP Server"
```

## Language Field

The `language` field specifies the primary programming language for sandbox isolation:

- `python`: Uses python-uv (or python-venv) for isolation
- `node`: Uses node-local (isolated node_modules)
- `rust`: Uses cargo
- `go`: Uses go-mod
- `java`: Uses maven
- `cpp`: No automatic isolation
- `none`: No isolation

If not specified, Docwise auto-detects from project files (package.json, pyproject.toml, etc.)

## Three-Layer Architecture

```
Paradigm (.docwise/paradigm.md)
  -> defines methodology, dependencies, quality standards
Skill (this directory)
  -> generic engine, experience store, mode selection
Config (.docwise/config.yaml)
  -> project-specific chapter types, sections, overrides
```

## API Usage

```typescript
import { runValidator } from '.claude/skills/docwise/api.js';

const result = await runValidator({
  chapter: 'agent/mcp-deep-dive',
  mode: 'validate',
  scenario: 'Build a batch rename server',
  max_iterations: 5,
});

console.log(result.success ? 'PASSED' : 'FAILED');
```

## Related Documentation

- [Paradigm](.docwise/paradigm.md) - Project methodology
- [Project Config](.docwise/config.yaml) - This project's chapters

## License

MIT
