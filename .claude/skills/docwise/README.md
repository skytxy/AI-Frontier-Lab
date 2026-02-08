# Docwise

Experience-driven collaboration engine for validating, generating, and optimizing educational content.

## Overview

Docwise is a generic, project-agnostic skill that learns from every execution. It coordinates multi-agent collaboration (Learner, Author, Reviewer) to ensure educational content is complete, accurate, and learner-friendly.

**Core Philosophy**: "Let Skill grow smarter with every execution."

## Features

- **Three Work Modes**: validate (check existing), generate (create from scratch), optimize (improve existing)
- **Dynamic Agent Collaboration**: Auto-selects single/dual/triple/parallel modes based on experience
- **Experience Store**: Learns which collaboration patterns work best for each scenario type
- **Four-Level Feedback**: Routes fixes to content (L1), config (L2), paradigm (L3), or skill code (L4)

## Quick Start

```bash
# Validate existing content
/docwise:new "implement a file batch rename Server"

# Optimize existing content
/docwise:improve "add link verification to all experiments"

# Check for issues
/docwise:check --focus=links

# Record a lesson learned
/docwise:record "internal links should not have .md extension"
```

## File Structure

```
.claude/skills/docwise/
├── skill.md                 # Main skill definition (for Claude Code)
├── index.ts                 # Module exports
├── api.ts                   # Public API
├── package.json             # NPM configuration
├── lib/
│   ├── types.ts             # Core TypeScript interfaces
│   ├── experience-store.ts  # Pattern matching + YAML persistence
│   ├── config-loader.ts     # Three-layer config merge
│   ├── mode-recommender.ts  # Experience/config/heuristic selection
│   ├── feedback-processor.ts # 4-level feedback classification
│   ├── dependency-resolver.ts # Topological sort for chapters
│   └── executor.ts          # Core orchestration engine
└── templates/
    └── config-template.yaml # Config template for new projects
```

## Project Configuration

Each project using Docwise has a `.docwise/config.yaml`:

```yaml
version: "1.0"

defaults:
  max_iterations: 5
  collaboration_mode: dual-agent
  sections: [concepts/, experiments/]

# Seed patterns bootstrap the experience store
seed_patterns:
  - id: technical-guide-medium
    signature:
      content_type: technical_guide
      complexity: medium
      keywords: [integration, api, protocol]
      work_mode: validate
    recommended_mode: dual-agent

chapters:
  agent/mcp-deep-dive:
    type: technical_guide
    sections: [concepts/, experiments/]
    scenarios:
      basic-tool:
        type: tool
        description: "Build a basic MCP Server with stdio transport"
```

## Three-Layer Architecture

```
Paradigm (docs/frameworks/docwise-workflow.md)
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

- [Workflow Paradigm](docs/frameworks/docwise-workflow.md) - Project methodology
- [Design Philosophy](docs/frameworks/docwise-design.md) - Architecture decisions
- [Project Config](.docwise/config.yaml) - This project's chapters

## License

MIT
