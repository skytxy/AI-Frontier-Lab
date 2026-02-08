# Docwise: New - Scenario Format

Schema for scenario configuration in `:new` workflow.

## Scenario Config

```typescript
interface ScenarioConfig {
  id: string;                      // Unique identifier
  name: string;                    // Human-readable name
  description: string;             // What the learner will do
  complexity: 'simple' | 'medium' | 'complex';
  topics: string[];                // Core topics to cover
  goals: string[];                 // Learning objectives
  workflow: string[];              // Step-by-step plan
  verification_commands?: string[]; // Commands to validate success
}
```

## Example Scenarios

### Agent Chapter Example

```yaml
id: github-api-mcp-server
name: GitHub API Integration Server
description: |
  Implement an MCP server that queries GitHub issues, creates issues,
  and adds comments to issues using GitHub REST API.
complexity: medium

topics:
  - GitHub REST API authentication
  - MCP tool definitions
  - Error handling for API failures
  - Rate limiting considerations

goals:
  - Successfully authenticate to GitHub API
  - Implement at least 3 working tools
  - Handle API errors gracefully
  - Document usage in README

workflow:
  - Create basic MCP server structure
  - Implement personal access token authentication
  - Define tools for issues CRUD operations
  - Add error handling and rate limiting
  - Test with MCP Inspector

verification_commands:
  - "npm run test"
  - "npx @modelcontextprotocol/inspector"
```

### Algo Chapter Example

```yaml
id: self-attention-from-scratch
name: Self-Attention Mechanism Implementation
description: |
  Implement the self-attention mechanism from scratch, including
  multi-head attention, and verify on a simple sequence task.
complexity: complex

topics:
  - Query, Key, Value matrices
  - Scaled dot-product attention
  - Multi-head attention
  - Masking mechanisms

goals:
  - Understand attention mathematically
  - Implement without using high-level libraries
  - Verify output shapes and values
  - Compare with reference implementation

workflow:
  - Implement scaled dot-product attention
  - Add multi-head concatenation
  - Implement causal and padding masks
  - Create simple sequence task for validation
  - Compare with PyTorch implementation

verification_commands:
  - "python test_attention.py"
  - "python compare_with_pytorch.py"
```

## Scenario Generation

When generating scenarios from user input:

1. **Analyze chapter type** (Agent vs Algo)
2. **Detect complexity** from keywords
3. **Use WebSearch** for practical examples
4. **Extract core topics** from search results
5. **Generate structured scenario** with all required fields

## Complexity Mapping

| Detection | Level | Typical Iterations |
|-----------|-------|-------------------|
| "simple", "basic", "single" | simple | 1-2 |
| "multiple", "integrate" | medium | 2-4 |
| "full", "complete" | complex | 3-5 |
| "security", "performance" | advanced | 4-5 + reviewer |
