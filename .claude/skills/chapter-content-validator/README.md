# Chapter Content Validator

A dual-agent collaboration framework for validating and improving educational chapter content.

## Overview

This skill simulates a zero-knowledge learner attempting to complete practical scenarios based only on chapter content. When the learner gets stuck, it generates detailed gap reports. An author agent then fixes the identified gaps. This loop continues until the learner can successfully complete both simple and complex scenarios.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Chapter Content Validator                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐          ┌──────────────┐                   │
│  │ Learner Agent│ ────────▶│ Author Agent │                   │
│  │ (零基础程序员)│  发现缺口  │  (内容作者)  │                   │
│  └──────────────┘          └──────────────┘                   │
│         │                        │                             │
│         ▼                        ▼                             │
│  ┌───────────────────────────────────────────┐                │
│  │           Chapter Content                  │                │
│  │  - README.md                              │                │
│  │  - concepts/*.md (知识库)                  │                │
│  │  - experiments/*/README.md (实验)         │                │
│  └───────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Usage

```bash
/chapter-content-validator --chapter=agent/mcp-deep-dive
```

### With Custom Scenarios

```bash
/chapter-content-validator \
  --chapter=agent/mcp-deep-dive \
  --simple-scenario="实现一个文件批量处理 Server" \
  --complex-scenario="实现一个 GitHub API 集成 Server"
```

## File Structure

```
.claude/skills/chapter-content-validator/
├── skill.md                 # Skill definition (for Claude Code)
├── index.ts                 # Main exports
├── api.ts                   # Public API
├── package.json             # NPM configuration
├── lib/
│   ├── learner.ts           # Learner Agent implementation
│   ├── author.ts            # Author Agent implementation
│   └── coordinator.ts       # Coordination logic
└── templates/
    └── chapter-config.yaml  # Chapter config template
```

## Chapter Configuration

Each chapter can define a `.chapter-validator.yaml`:

```yaml
validation:
  experiments:
    - experiments/01-basics
    - experiments/02-advanced

  prerequisites:
    - TypeScript
    - Node.js

  scenarios:
    simple:
      type: tool
      description: "Build a basic server"
      verify: "Server responds to tools/list"

    complex:
      type: integration
      description: "Integrate with external API"
      verify: "API calls succeed"
```

## API Usage

```typescript
import { validateChapter } from '.claude/skills/chapter-content-validator/api.js';

const result = await validateChapter({
  chapterPath: 'agent/mcp-deep-dive',
  simpleScenario: 'Build a batch rename server',
  complexScenario: 'Build a GitHub API server',
  maxIterations: 5,
  verbose: true,
});

console.log(result.success ? 'PASSED' : 'FAILED');
```

## Gap Categories

| Category | Description | Example |
|----------|-------------|---------|
| `concept_missing` | Concept not explained | JSON-RPC framing not documented |
| `step_unclear` | Step instructions vague | How to run the experiment unclear |
| `code_error` | Code has bugs | Import paths incorrect |
| `context_missing` | Why/when unclear | Real-world application missing |

## Extending

### Adding New Gap Types

Edit `lib/author.ts` to add handlers:

```typescript
async fixCustomGap(gap: KnowledgeGap): Promise<void> {
  // Your fix logic
}
```

### Custom Learner Behaviors

Edit `lib/learner.ts` to modify learning:

```typescript
async attemptScenario(scenario: Scenario): Promise<AttemptResult> {
  // Your custom attempt logic
}
```

## Related Documentation

- [Full Paradigm Documentation](/docs/frameworks/chapter-validation-paradigm.md)
- [MCP Chapter Example](/agent/mcp-deep-dive/.chapter-validator.yaml)

## License

MIT
