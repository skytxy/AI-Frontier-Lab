# Docwise Scenario Integration Test

Test plan for the Docwise practical scenario system.

## Test: Overview Display for :check

**Step 1**: Run docwise:check on mcp-deep-dive
```bash
# Manual test
# /docwise:check "agent/mcp-deep-dive, simple"
```

**Expected**: Shows overview before scenario confirmation

**Step 2**: Verify sandbox creation
```bash
ls -la agent/mcp-deep-dive/.docwise/sandbox/
```

**Expected**: Directory created with language-appropriate isolation (.venv for python, node_modules for node)

## Test: Gap Priority Filtering

**Step 1**: Create test with mixed gaps

```typescript
import { GapPrioritizer } from './.claude/skills/docwise/lib/gap-prioritizer.js';

const prioritizer = new GapPrioritizer();

const gaps = [
  { category: 'concept_missing', description: 'Missing concept', severity: 'major' as const, location: 'concepts/foo.md' },
  { category: 'typo', description: 'Typo in docs', severity: 'minor' as const, location: 'README.md' },
  { category: 'code_error', description: 'Critical bug', severity: 'critical' as const, location: 'experiments/test.py' }
];

const filtered = prioritizer.filterGapsByPriority(gaps, 'critical-important');
console.log('Filtered gaps:', filtered.length); // Expected: 2
console.log('Critical only:', prioritizer.filterGapsByPriority(gaps, 'critical-only').length); // Expected: 1
```

**Expected**: 2 gaps (critical + major), minor filtered out

## Test: Artifact Generation

**Step 1**: Generate artifacts

```typescript
import { ArtifactGenerator } from './.claude/skills/docwise/lib/artifact-generator.js';

const mockData = {
  scenarioId: 'test-001',
  scenarioDescription: 'Test scenario for integration testing',
  chapterPath: 'agent/test',
  complexity: 'simple' as const,
  topics: ['Topic 1', 'Topic 2'],
  goals: ['Goal 1', 'Goal 2'],
  workflow: ['Step 1', 'Step 2'],
  topicResults: [
    { topic: 'Topic 1', status: 'success', notes: 'Works well' },
    { topic: 'Topic 2', status: 'partial', notes: 'Some gaps' }
  ],
  gaps: [
    { category: 'concept_missing', description: 'Missing concept', location: 'file.md', severity: 'major' }
  ],
  blockers: [],
  suggestions: ['Add more examples'],
  validationResults: 'Validation passed'
};

const generator = new ArtifactGenerator('/path/to/project');
await generator.generateArtifacts('/tmp/test-sandbox', mockData);
```

**Expected**: README.md and learning-log.md created in /tmp/test-sandbox

## Test: Language Detection

**Step 1**: Test ConfigLoader language detection

```typescript
import { ConfigLoader } from './.claude/skills/docwise/lib/config-loader.js';

const loader = new ConfigLoader('/project/root');

// Test explicit language from config
const mcpLanguage = loader.detectChapterLanguage('agent/mcp-deep-dive');
console.log('MCP language:', mcpLanguage); // Expected: 'node'

// Test auto-detection for algo chapter
const attentionLanguage = loader.detectChapterLanguage('algo/attention/self-attention');
console.log('Attention language:', attentionLanguage); // Expected: 'python'
```

## Test: Sandbox Manager

**Step 1**: Test sandbox creation

```typescript
import { SandboxManager } from './.claude/skills/docwise/lib/sandbox-manager.js';

const manager = new SandboxManager('/project/root', 'agent/test');

// Create sandbox
const sandboxId = await manager.createSandbox('test-validation');
console.log('Sandbox ID:', sandboxId); // Expected: '001-test-validation'

// Verify isolation type
const isolation = loader.getSandboxIsolationType('node');
console.log('Isolation type:', isolation); // Expected: 'node-local'
```

## Running the Tests

```bash
# Verify TypeScript compilation (with skipLibCheck for pre-existing issues)
cd .claude/skills/docwise/lib
npx tsc --noEmit --skipLibCheck *.ts

# Verify no syntax errors in new files
node -c .claude/skills/docwise/lib/gap-prioritizer.ts
node -c .claude/skills/docwise/lib/artifact-generator.ts
```

## Manual Testing Checklist

- [ ] `/docwise:new` shows overview and scenario confirmation
- [ ] `/docwise:check` shows overview with current status
- [ ] `/docwise:improve` shows overview with gap summary
- [ ] Sandboxes are created in `.docwise/sandbox/`
- [ ] Language isolation works (python-uv, node-local, etc.)
- [ ] README.md and learning-log.md are generated
- [ ] Gap priority filtering works correctly
