---
name: docwise:new
description: Generate new chapter content from scenario description
command: docwise:new
---

# Docwise: New

Generate new educational content from a scenario description.

## Flow

1. **Parse**: Analyze user's description, extract requirements
2. **Detect**: Auto-detect complexity (simple/medium/complex/advanced)
3. **Generate**: Create structured scenario
4. **Confirm**: Show scenario, wait for approval
5. **Execute**: Run dual-agent (Author creates, Learner validates)

## Usage

```
/docwise:new "implement a file batch rename Server"
/docwise:new "实现GitHub API集成Server" --complexity=complex
/docwise:new --scenario=@/path/to/scenario.yaml --auto_confirm
```

## Parameters

- `scenario`: Description or path to scenario file (@/path/to/scenario.yaml)
- `complexity`: Override auto-detect (simple/medium/complex/advanced)
- `auto_confirm`: Skip confirmation
- `chapter`: Target chapter path (default: auto-detect)

## Complexity Levels

| Level | Scope |
|-------|-------|
| simple | Single feature, one tool |
| medium | 2-3 tools, basic error handling |
| complex | Tools + Resources + Prompts |
| advanced | Full-stack, security, performance |

## Example Scenario

```yaml
name: GitHub API集成Server
description: 实现一个能够查询issues、创建issues、添加评论的MCP Server
complexity: medium

prerequisites:
  - concept: HTTP客户端认证
    required: true

success_criteria:
  - Server能成功连接GitHub API
  - 所有tools功能正常
```
