---
title: "从零实现 MCP Server"
experiment: 2
parent: mcp-deep-dive
tags: [server, tools, resources, prompts, sdk]
difficulty: intermediate
prerequisites: ['01-protocol-inspector']
---

# Exp-02: 从零实现 MCP Server

## 📚 前置知识

**开始前你需要了解**：

- **MCP 三大能力原语**：Tools（可调用的函数）、Resources（数据源，如文件、数据库）、Prompts（预定义的提示词模板）
- **Zod Schema**：TypeScript 优先的 schema 验证库，用于定义输入/输出的类型和校验规则
- **服务器架构**：MCP Server 是被动的，等待 Host（如 Claude Desktop）连接并发送请求
- **传输层**：stdio（标准输入/输出）和 Streamable HTTP 两种传输方式

> **零基础？** 推荐先阅读：
> - [MCP 入门指南](/topics/mcp-deep-dive/concepts/mcp-basics)
> - [能力协商机制](/topics/mcp-deep-dive/concepts/capabilities)

## 🎯 学习目标

完成本实验后，你将理解：

- [ ] **Server SDK 使用**：如何使用 `@modelcontextprotocol/sdk` 创建 Server
- [ ] **Tools 实现**：定义 Tool schema、处理调用请求、返回结构化结果
- [ ] **Resources 实现**：暴露数据源、支持 URI 模板、处理读取请求
- [ ] **Prompts 实现**：创建可复用的提示词模板、支持参数化
- [ ] **错误处理**：如何优雅地处理错误并返回给 Host
- [ ] **传输层理解**：理解 stdio 和 HTTP (SSE) 的差异及实现要点
- [ ] **HTTP 集成**：了解如何将 Server 暴露为 HTTP 服务

## 💡 为什么需要这个实验？

**实际问题**：虽然 MCP 官方提供了很多现成的 Server（如 filesystem、github），但实际应用中，你需要：

1. **封装内部工具**：把公司的 API、脚本封装成 MCP Tools
2. **自定义数据源**：把内部文档、数据库暴露为 MCP Resources
3. **标准化提示词**：把团队的代码审查、文档生成等流程固化为 Prompts

**通过自己实现 Server，你会理解**：
- SDK 的 API 设计哲学（高级 API vs 低级 API）
- 如何设计 Tool 的输入/输出 schema
- Resources 的 URI 模板如何工作
- Host 和 Server 的能力协商流程

## 🛠️ 实验内容

### 背景知识

#### MCP Server 的生命周期

```
┌─────────────┐      initialize      ┌──────────────┐
│    Host     │ ──────────────────► │   Server     │
│             │                      │              │
│             │ ◄──────────────────── │              │
│             │   (capabilities)      │              │
├─────────────┤                      ├──────────────┤
│             │      initialized      │              │
│             │ ──────────────────► │              │
│             │                      │              │
│             │   tools/call         │              │
│             │ ──────────────────► │              │
│             │ ◄──────────────────── │              │
│             │   (result)           │              │
└─────────────┘                      └──────────────┘
```

**关键点**：
1. Host 必须先发送 `initialize` 请求，声明协议版本和能力
2. Server 返回自己的能力（支持哪些 tools/resources/prompts）
3. Host 发送 `initialized` 通知，表示"我准备好了"
4. 之后才能进行实际的工具调用、资源读取等操作

#### 三大能力原语

| 原语 | 用途 | 示例 |
|------|------|------|
| **Tools** | Host 可以调用的函数 | `file_search`、`code_stats` |
| **Resources** | Server 暴露的数据源 | 项目文件列表、数据库查询结果 |
| **Prompts** | 预定义的提示词模板 | 代码审查模板、文档生成模板 |

#### SDK API 选择

`@modelcontextprotocol/sdk` 提供了两套 API：

- **高级 API (`McpServer`)**：开箱即用，自动处理协议细节（推荐本实验使用）
- **低级 API (`Server`)**：完全控制，手动处理每个请求

本实验使用高级 API，让你专注于业务逻辑。

### 实现步骤

#### Step 1: 创建项目结构

```bash
cd topics/mcp-deep-dive/experiments/02-mcp-server
npm install
```

目录结构：
```
src/
├── server.ts           # 主服务器入口
├── tools/
│   ├── file-search.ts  # 文件搜索工具
│   └── code-stats.ts   # 代码统计工具
├── resources/
│   └── project-files.ts # 项目文件资源
└── prompts/
    └── code-review.ts   # 代码审查模板
```

#### Step 2: 实现 Tools

**文件结构**：
- `src/tools/file-search.ts` - 文件内容搜索（grep 风格）
- `src/tools/code-stats.ts` - 代码统计（LOC、语言分布）

**核心概念**：

每个 Tool 需要：
1. **Zod Schema** - 定义输入参数和验证规则
2. **execute 方法** - 实现工具逻辑
3. **返回格式** - `{ content: [{ type: 'text', text: '...' }] }`

**Zod Schema 示例** (`src/tools/file-search.ts`):
```typescript
export const FileSearchInputSchema = z.object({
  path: z.string().describe('Root directory to search in'),
  pattern: z.string().describe('Search pattern (string or regex)'),
  regex: z.boolean().default(false),
  maxResults: z.number().default(50),
});
```

> **`.describe()` 的作用**：为字段添加人类可读的描述，转换为 JSON Schema 后，Host（如 Claude Desktop）会在 UI 中显示参数提示。

**完整实现**：参见 `src/tools/file-search.ts` 和 `src/tools/code-stats.ts`

#### Step 3: 实现 Resources

**文件**：`src/resources/project-files.ts`

**核心概念**：
- **list 操作**：列出可用资源（支持 URI 模板）
- **read 操作**：读取资源内容

**URI 格式**：`file:///absolute/path/to/file`

**关键模式**：
```typescript
async read(input: { uri: string }) {
  const match = input.uri.match(/^file:\/\/(.+)$/);
  const filePath = decodeURIComponent(match[1]);
  const content = await fs.readFile(filePath, 'utf-8');
  return { uri: input.uri, content };
}
```

> **URI 模板**：`file://{path}` 允许运行时参数替换，类似 REST API 的路径参数。

#### Step 4: 实现 Prompts

**文件**：`src/prompts/code-review.ts`

**核心概念**：
- 接收参数（文件路径、关注领域、严重级别）
- 生成结构化的提示词（`messages` 数组）

**Prompt 输出示例**：
```text
# Code Review Request

## File: /path/to/file.ts

Please review with focus on: correctness, maintainability
**Minimum severity:** MEDIUM

## File Content
[actual file content here]

## Review Guidelines
[structured request]
```

#### Step 5: 组装 Server

**文件**：`src/server.ts`（约 380 行完整实现）

**核心步骤**：
1. 创建 `Server` 实例，声明能力
2. 注册请求处理器（`setRequestHandler`）
3. 连接传输层（`StdioServerTransport`）

**初始化模式**：
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

this.server = new Server(
  { name: 'mcp-server-demo', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);

this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // 路由到具体工具...
});

const transport = new StdioServerTransport();
await this.server.connect(transport);
```

#### Step 5.5: HTTP (SSE) 传输（参考）

本实验实现 stdio 传输。HTTP (SSE) 适用于远程访问和 Web 集成，详见 [stdio 传输原理](/topics/mcp-deep-dive/concepts/stdio-transport#与-http-sse-的对比)。

**简要对比**：
- **stdio**：本地部署、CLI 工具、快速原型
- **HTTP (SSE)**：远程访问、Web 集成、多客户端

> **注意**：本实验代码专注于 stdio。HTTP 实现需要 Express/Hono 服务器、会话管理、CORS 处理。

#### Step 6: 运行和测试

**本地测试（推荐先用 MCP Inspector）**：

```bash
# 构建 TypeScript
npm run build

# 启动 Server（stdio 模式）
npm start /path/to/project

# 在另一个终端，用 MCP Inspector UI 连接
npx @modelcontextprotocol/inspector npx tsx src/server.ts /path/to/project
```

在 Inspector UI 中，你可以：
1. 查看 Server 的能力（tools/resources/prompts 列表）
2. 手动调用 `file_search` 工具
3. 读取 Resources
4. 获取 Prompts

**集成到 Claude Desktop**：

修改 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "demo-server": {
      "command": "node",
      "args": ["/absolute/path/to/02-mcp-server/dist/server.js", "/path/to/project"]
    }
  }
}
```

重启 Claude Desktop，在对话中尝试：
- "Search for files containing 'TODO'"
- "Show code statistics"
- "Generate a code review for src/server.ts"

## 🧪 验证

### 成功标志

- [ ] Server 启动成功（stderr 显示 "MCP Server started on stdio"）
- [ ] MCP Inspector 能连接并列出 2 个 tools、1 个 resource、1 个 prompt
- [ ] `file_search` 能搜索到文件中的内容
- [ ] `code_stats` 能正确统计代码行数和语言分布
- [ ] `code_review` prompt 能生成结构化的审查请求
- [ ] 所有错误都被正确处理（如文件不存在、权限问题）

### 测试用例

```bash
# 1. 测试 file_search
# 调用：file_search, path="/tmp", pattern="hello"
# 预期：返回所有包含 "hello" 的文件及行号

# 2. 测试 code_stats
# 调用：code_stats, path="/tmp"
# 预期：返回文件数、目录数、总行数、按语言分组的统计

# 3. 测试 resource read
# URI: file:///tmp/test.txt
# 预期：返回文件内容和 mimeType

# 4. 测试 prompt
# 调用：code_review, filePath="/tmp/test.ts"
# 预期：返回完整的代码审查提示词模板
```

## 🔍 关键发现

### 1. Zod Schema 是 MCP Tool 的核心

Zod schema 不仅用于输入验证，还会被转换为 **JSON Schema**，展示给 Host：

```typescript
{
  name: 'file_search',
  inputSchema: zodToJsonSchema(FileSearchInputSchema),
}
```

Host 会根据这个 schema：
- 在 UI 中生成输入表单
- 验证用户输入
- 提供参数提示和补全

**Why?** 这实现了"自描述 API"，Host 无需硬编码 Tool 的参数格式。

### 2. Tools 返回的是 `content` 数组，不是纯文本

MCP 规定 Tool 的返回格式：
```json
{
  "content": [
    { "type": "text", "text": "..." },
    { "type": "image", "data": "base64...", "mimeType": "image/png" },
    { "type": "resource", "uri": "file:///..." }
  ]
}
```

**Why?** 这允许 Tool 返回多种类型的内容（文本、图片、资源引用），而不仅仅是字符串。

### 3. Resources 用 URI 模板支持参数化

Resources 可以定义 URI 模板（如 `file://{path}`），Host 可以在运行时替换参数。

**Why?** 这让 Resources 类似于"动态数据源"，而不是静态文件列表。

### 4. Prompts 是"提示词的函数"

Prompts 接收参数，返回结构化的提示词（通常是 `messages` 数组）。

**Why?** 这让提示词可复用和参数化，而不是硬编码的字符串。

### 5. 错误处理必须标准化

MCP 规定错误必须返回 JSON-RPC error 格式：
```json
{
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": { "details": "..." }
  }
}
```

SDK 会自动把抛出的异常转换为这种格式，但你应该提供清晰的错误消息。

### 6. Annotations 是不可信的

MCP 允许 Tool 声明"annotations"（如 `readOnly`、`destructive`），但 **Host 不应该盲目信任**。

**Why?** Server 可以撒谎（见 Exp-04 安全实验）。Host 必须自己做安全判断。

## 🚧 常见问题

### Q1: 为什么 Server 的日志要用 `console.error` 而不是 `console.log`？

**Answer**：stdio 传输层占用 `stdin`/`stdout` 用于协议通信。如果用 `console.log`，输出会混入协议流，导致解析错误。

**解决方案**：
- 日志用 `console.error`（输出到 stderr）
- 或者使用文件日志、专业日志库（如 `winston`）

### Q2: Tool 的参数有默认值，但 Host 没传，会怎样？

**Answer**：Zod schema 的 `default()` 会生效，参数会自动填充默认值。

```typescript
z.boolean().default(false)  // 如果 Host 不传，自动设为 false
```

如果参数是 `optional()`（不是 `default()`），则为 `undefined`，需要手动处理。

### Q3: 我能返回二进制文件内容吗（如图片）？

**Answer**：可以，但不能直接用 `text` 类型。应该用 `image` 类型：

```typescript
return {
  content: [
    {
      type: 'image',
      data: base64EncodedImage,
      mimeType: 'image/png',
    }
  ]
};
```

### Q4: 如何处理长时间运行的 Tool？

**Answer**：支持进度报告（progress token）：

```typescript
// Host 调用 Tool 时可能传 _progressToken
const progressToken = args?._progressToken;

// 在 Tool 执行过程中，发送进度通知
await server.sendNotification('notifications/progress', {
  progressToken,
  progress: 0.5,  // 50%
  message: 'Processing file 3 of 10',
});
```

### Q5: HTTP 传输和 stdio 有什么区别？

**Answer**：详见 [stdio 传输原理](/topics/mcp-deep-dive/concepts/stdio-transport#与-http-sse-的对比) 中的完整对比表。

简要总结：stdio 适合本地开发和 CLI 工具，HTTP (SSE) 适合远程调用和 Web 集成。

## 📚 延伸阅读

- [MCP Server 规范](https://modelcontextprotocol.io/docs/specification/)
- [SDK 文档](https://github.com/modelcontextprotocol/typescript-sdk)
- [实验 01：协议拦截器](/topics/mcp-deep-dive/experiments/01-protocol-inspector/) — 用 Inspector 调试你的 Server
- [实验 03：从零实现 MCP Client](/topics/mcp-deep-dive/experiments/03-mcp-client/) — 理解 Host 侧的视角

## 🎓 下一步

完成本实验后，你已经能实现完整的 MCP Server 了。接下来：

1. **实验 03**：手写 MCP Client，从 Host 侧理解协议
2. **实验 04**：构造恶意 Server，理解安全边界
3. **实战**：封装你常用的工具（如 Jira、Git、内部 API）为 MCP Tools
