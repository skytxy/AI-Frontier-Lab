# Claude Code Hooks 入门

## 什么是 Claude Code Hooks？

Claude Code Hooks 是一种**自动化机制**，让你在 Claude Code 执行流的特定时机运行自定义脚本。通过 Hooks，你可以：

- 自动格式化代码（Claude 写完代码后自动运行 prettier）
- 发送通知（任务完成时弹出桌面提醒）
- 保护文件（阻止 Claude 修改敏感文件）
- 注入上下文（会话开始时自动加载项目规则）

> **核心价值**：Hooks 将需要"手动提醒 Claude 的事"变成"自动执行的事"。

## Hook 生命周期

Claude Code 在以下关键时机触发 Hooks：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude Code Session                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [SessionStart] ──────────────────────────────────────────┐    │
│      │                                                       │    │
│      ▼                                                       │    │
│  [UserPromptSubmit] ───────────────────────────────────┐   │    │
│      │                                                   │   │    │
│      ▼                                                   │   │    │
│  [PreToolUse] ───────────────────────────────────────┐ │   │    │
│      │                                               │ │   │    │
│      ▼                                               │ │   │    │
│   ┌──────────┐     [PostToolUse]                    │ │   │    │
│   │ Tool 执行 │ ◄────────────────────────────────────┘ │   │    │
│   └──────────┘                                          │   │    │
│      │                                                   │   │    │
│      ▼ (失败时)                                           │   │    │
│  [PostToolUseFailure] ◄──────────────────────────────────┘   │    │
│                                                                 │    │
│  [PermissionRequest] ◄───────┐                                 │    │
│      │                        │  用户需要授权                   │    │
│      ▼                        │                                 │    │
│  [Notification] ◄─────────────┘                                 │    │
│      │                                                          │    │
│      ▼                                                          │    │
│  [Stop] ──────────────────────────────────────────────────────┘    │
│      │                                                               │
│      ▼                                                               │
│  [SessionEnd]                                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hook 事件详解

| 事件 | 触发时机 | 可阻止 | 常见用途 |
|------|----------|--------|----------|
| `SessionStart` | 会话开始或恢复 | 否 | 加载项目规则、初始化环境 |
| `UserPromptSubmit` | 用户提交提示词时 | 是 | 验证提示词、添加上下文 |
| `PreToolUse` | 工具调用前 | 是 | 权限检查、参数验证、危险操作警告 |
| `PostToolUse` | 工具调用成功后 | 否 | 格式化代码、记录日志、触发通知 |
| `PostToolUseFailure` | 工具调用失败后 | 否 | 错误处理、失败重试 |
| `PermissionRequest` | 显示权限对话框时 | 是 | 自动批准/拒绝权限请求 |
| `Notification` | 发送通知时（需要输入） | 否 | 桌面通知、声音提醒 |
| `Stop` | Claude 完成响应时 | 是 | 任务完成检查、报告生成 |
| `SessionEnd` | 会话结束时 | 否 | 清理临时文件、统计使用时长 |

## Hook 类型

Claude Code 支持三种 Hook 类型：

### 1. Command Hooks（命令型）

最常用，执行 shell 命令：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

### 2. Prompt Hooks（提示型）

使用 LLM 判断是否继续执行：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "检查是否所有任务都完成。如果没有，返回 {\"ok\": false, \"reason\": \"剩余工作\"}",
            "model": "claude-3-5-haiku-20241022"
          }
        ]
      }
    ]
  }
}
```

### 3. Agent Hooks（代理型）

使用有工具访问能力的 Agent 进行复杂验证：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "验证测试是否通过。运行测试套件并检查结果。",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

## Matcher（匹配器）

Matcher 决定 Hook 在哪些情况下触发：

### 工具名匹配

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",        // 只在 Edit 或 Write 工具后触发
        "hooks": [...]
      }
    ]
  }
}
```

### 正则表达式匹配

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__.*",           // 匹配所有 MCP 工具
        "hooks": [...]
      }
    ]
  }
}
```

### 无匹配器（始终触发）

```json
{
  "hooks": {
    "Stop": [
      {
        // 没有 matcher，每次 Stop 都触发
        "hooks": [...]
      }
    ]
  }
}
```

### Matcher 支持的事件

| 事件 | 匹配字段 | 示例值 |
|------|----------|--------|
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest` | tool name | `Bash`, `Edit|Write`, `mcp__.*` |
| `SessionStart` | 启动方式 | `startup`, `resume`, `compact` |
| `SessionEnd` | 结束原因 | `clear`, `logout`, `other` |
| `Notification` | 通知类型 | `permission_prompt`, `idle_prompt` |
| `SubagentStart`, `SubagentStop` | agent type | `Bash`, `Explore`, `Plan` |
| `PreCompact` | 触发方式 | `manual`, `auto` |

## Hook 输入/输出

### Hook 输入（stdin）

Claude Code 向 Hook 传递 JSON 数据：

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/conversation.jsonl",
  "cwd": "/Users/you/myproject",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.py",
    "content": "print('hello')"
  },
  "tool_response": {
    "filePath": "/path/to/file.py",
    "success": true
  }
}
```

### Hook 输出（stdout + exit code）

Hook 通过**退出码**和**输出**与 Claude Code 通信：

| 退出码 | 含义 | Claude 行为 |
|--------|------|-------------|
| 0 | 成功 | 继续（stdout 显示在 transcript） |
| 2 | 阻止 | 停止操作（stderr 作为反馈发给 Claude） |
| 其他 | 非阻塞错误 | 继续（stderr 记录日志，不发给 Claude） |

### 结构化 JSON 输出

对于 `PreToolUse`，可以返回 JSON 进行精细控制：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "使用 rg 而非 grep 以获得更好性能"
  }
}
```

## 配置位置

Hook 配置可以放在不同位置，决定其作用域：

| 位置 | 作用域 | 可共享 | 配置文件 |
|------|--------|--------|----------|
| 全局 | 所有项目 | 否 | `~/.claude/settings.json` |
| 项目 | 单个项目 | 是 | `.claude/settings.json` |
| 项目本地 | 单个项目 | 否 | `.claude/settings.local.json` |
| 插件 | 插件启用时 | 是 | `plugin/hooks/hooks.json` |

## 实用技巧

### 调试 Hook

```bash
# 使用 verbose 模式查看 Hook 输出
# 在 Claude Code 中按 Ctrl+O 切换 verbose 模式
```

### 测试 Hook 脚本

```bash
# 手动测试 Hook 脚本
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./my-hook.sh
echo $?  # 查看退出码
```

### Hook 超时

Hook 默认超时 10 分钟，可通过 `timeout` 字段配置：

```json
{
  "type": "command",
  "command": "npm test",
  "timeout": 300  // 5 分钟
}
```

## 最佳实践

### 1. Hook 应该幂等

```bash
# 好的做法：检查是否已执行
if ! git rev-parse --verify HEAD >/dev/null; then
    git init
fi

# 不好的做法：可能重复执行
git init  # 如果已存在会报错
```

### 2. 快速失败

```bash
# Hook 错误不应影响核心流程（除非是验证型 Hook）
set +e  # 不在错误时退出
npx prettier --write "$FILE" 2>/dev/null || true
set -e
```

### 3. 使用绝对路径

```json
{
  "command": "/usr/local/bin/npx prettier --write $FILE_PATH"
  // 而非 "npx prettier --write $FILE_PATH"
}
```

### 4. Hook 本身应该可观测

```bash
#!/bin/bash
exec 1> >(logger -t my-hook) 2>&1  # 所有输出到系统日志
echo "Hook started at $(date)"
# ... hook logic
echo "Hook finished with exit code $?"
```

## 延伸阅读

- [Claude Code Hooks 官方文档](https://code.claude.com/docs/en/hooks-guide)
- [通知 Hook 实验指南](/topics/hooks/experiments/01-notification-hook)
- [Hooks 通用模式](/topics/hooks/concepts)
