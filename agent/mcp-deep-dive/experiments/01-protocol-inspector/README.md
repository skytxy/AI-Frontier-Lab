---
title: "协议拦截器：透明观察 MCP 通信"
experiment: 1
parent: mcp-deep-dive
tags: [protocol, debugging, proxy, stdio]
difficulty: beginner
---

# Exp-01: 协议拦截器 (Protocol Inspector)

## 📚 前置知识

**开始前你需要了解**：

- **进程间通信 (IPC)**：不同进程之间交换数据的方式。`stdio`（标准输入/输出）是最简单的 IPC 形式，一个进程写入 stdout，另一个进程从 stdin 读取。
- **JSON-RPC 2.0**：一种轻量级的远程过程调用协议，使用 JSON 格式编码。核心概念：Request（请求）、Response（响应）、Notification（单向通知，无需响应）。
- **透明代理**：在网络/通信中插入中间层，转发所有数据但不修改内容，用于观察、调试或记录。
- **Node.js Child Process**：Node.js 的 `spawn` API 可以启动子进程并控制其 stdin/stdout/stderr 流。

> **零基础？** 推荐先阅读：
> - [MCP 入门指南](/topics/mcp-deep-dive/concepts/mcp-basics)
> - [JSON-RPC 基础](/topics/mcp-deep-dive/concepts/json-rpc)
> - [stdio 传输原理](/topics/mcp-deep-dive/concepts/stdio-transport)

## 🎯 学习目标

完成本实验后，你将理解：

- [ ] **MCP 通信模式**：Host 和 Server 通过 stdio 双向交换 JSON-RPC 消息
- [ ] **消息分帧**：每条 JSON-RPC 消息用换行符 (`\n`) 分隔，如何处理粘包/半包
- [ ] **初始化握手**：MCP 连接建立时的协商流程（initialize → initialized → ready）
- [ ] **工具调用流程**：从 Host 发起 `tools/call` 到 Server 返回 `result` 的完整序列
- [ ] **调试技巧**：如何在不修改源码的情况下观察任意 MCP Server 的行为

## 💡 为什么需要这个实验？

**实际问题**：当你开发 MCP Server 或集成 MCP Client 时，经常遇到"为什么 Server 没有响应？"、"返回的数据格式对吗？"这类问题。直接修改 Server 代码加日志很慢，而且有些 Server 你根本没有源码（比如 `@modelcontextprotocol/server-filesystem`）。

**解决思路**：如果能在 Host 和 Server 之间插入一个"透明监听器"，打印所有经过的消息，就能：
1. **快速调试**：立即看到 Server 实际收到了什么请求
2. **学习协议**：观察成熟 Server 如何响应各种调用，理解 MCP 规范的实际应用
3. **性能分析**：统计消息数量、响应时间等

## 🛠️ 实验内容

### 背景知识

#### MCP 传输层

MCP 协议本身不规定传输方式，但最常用的是 **stdio**（标准输入/输出）：

```
┌─────────────┐                    ┌───────────────┐
│   Host      │                    │    Server     │
│             │                    │               │
│  stdin  ────┼────────────────────┼──►  stdout    │
│  stdout ────┼────────────────────┼───►  stdin     │
│  stderr ────┼────────────────────┼───►  stderr    │
└─────────────┘                    └───────────────┘
```

- Host 和 Server 各自启动独立的进程
- Host 向 Server 发送消息时，写入自己的 stdout（Server 从 stdin 读取）
- Server 向 Host 回复时，写入自己的 stdout（Host 从 stdin 读取）
- stderr 通常直接打印到终端（日志、错误）

#### JSON-RPC 消息格式

每条消息都是一个独立的 JSON 对象，用换行符分隔：

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
{"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}
```

**关键点**：必须逐行解析，不能假设一次 `read()` 就是完整的消息（见后文"常见问题"）。

#### 透明代理原理

Inspector 本身也是一个程序，但它不解析 MCP 语义，只做转发：

1. Host 以为自己在跟 Server 通信，实际是在跟 Inspector 的 stdout/stdin 通信
2. Inspector 内部 spawn 了真实的 Server，把 Host 的消息转发给 Server
3. Server 的响应又被 Inspector 转发回 Host
4. 同时，Inspector 打印每条消息的内容（双向）

### 实现步骤

#### Step 1: 创建 Inspector 项目结构

```bash
cd topics/mcp-deep-dive/experiments/01-protocol-inspector
npm install
```

这个实验已经配置好了：
- `package.json`：定义依赖（只需 `@types/node`，不需要 MCP SDK）
- `tsconfig.json`：TypeScript 配置
- `src/inspector.ts`：核心实现

#### Step 2: 实现 Inspector 核心逻辑

**代码结构**（详见 `src/inspector.ts`）：

1. **解析命令行参数**：`-- <server-command> [args...]`
   ```typescript
   // 示例：inspector.ts -- npx @modelcontextprotocol/server-filesystem /tmp
   const separatorIndex = args.indexOf('--');
   const serverCommand = args[separatorIndex + 1];  // "npx"
   const serverArgs = args.slice(separatorIndex + 2); // ["@modelcontextprotocol/server-filesystem", "/tmp"]
   ```

2. **启动子进程**：
   ```typescript
   const serverProcess = spawn(serverCommand, serverArgs, {
     stdio: ['pipe', 'pipe', 'inherit']  // 我们控制 stdin/stdout，stderr 直接输出
   });
   ```

3. **双向转发**：
   ```typescript
   // Host → Server
   process.stdin.on('data', (data) => {
     logMessage(data, '→');  // 打印日志
     serverProcess.stdin.write(data);  // 转发
   });

   // Server → Host
   serverProcess.stdout.on('data', (data) => {
     logMessage(data, '←');  // 打印日志
     process.stdout.write(data);  // 转发
   });
   ```

4. **解析和格式化消息**：
   - 逐行解析 JSON（处理粘包）
   - 根据 `method` / `id` / `result` / `error` 判断消息类型
   - 彩色输出：绿色（Host→Server）、蓝色（Server→Host）、红色（错误）

#### Step 3: 运行 Inspector

**方式 1：观察 filesystem Server**

```bash
# 启动 Inspector，包裹 filesystem Server
npm start -- npx @modelcontextprotocol/server-filesystem /tmp
```

你会看到 Inspector 启动信息，然后进入等待状态（因为 MCP 是服务器驱动的，需要 Host 连接）。

**方式 2：使用 MCP Inspector 测试**

```bash
# 在另一个终端，启动 MCP Inspector UI（官方工具）
npx @modelcontextprotocol/inspector node dist/inspector.js -- npx @modelcontextprotocol/server-filesystem /tmp
```

这会打开一个 Web UI，你可以在里面手动调用工具，同时看到我们的 Inspector 打印所有底层消息。

**方式 3：集成到 Claude Desktop**

修改 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/absolute/path/to/01-protocol-inspector/dist/inspector.js", "--", "npx", "@modelcontextprotocol/server-filesystem", "/tmp"]
    }
  }
}
```

重启 Claude Desktop，在对话中尝试使用文件操作，Inspector 会打印所有消息。

#### Step 4: 观察消息流

当你使用 Server 时，Inspector 会输出类似这样的日志：

```
→ 2025-02-07T10:23:45.123Z REQUEST        id=1 initialize
  params: {"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{...}}
← 2025-02-07T10:23:45.156Z RESULT_RESPONSE id=1
  result: {"protocolVersion":"2024-11-05","capabilities":{...},"serverInfo":{...}}
→ 2025-02-07T10:23:45.234Z NOTIFICATION    initialized
← 2025-02-07T10:23:45.567Z NOTIFICATION    notifications/initialized
→ 2025-02-07T10:23:50.001Z REQUEST        id=2 tools/list
← 2025-02-07T10:23:50.023Z RESULT_RESPONSE id=2
  result: {"tools":[{"name":"read_file",...}]}
→ 2025-02-07T10:24:01.234Z REQUEST        id=3 tools/call
  params: {"name":"read_file","arguments":{"path":"/tmp/test.txt"}}
← 2025-02-07T10:24:01.456Z RESULT_RESPONSE id=3
  result: {"content":[{"type":"text","text":"Hello, MCP!"}]}
```

**关键观察点**：

1. **初始化流程**：`initialize` (请求) → 返回协议版本/能力 → `initialized` (通知)
2. **工具发现**：`tools/list` 返回 Server 支持的所有工具定义
3. **工具调用**：`tools/call` 携带工具名和参数，返回 `result.content`

## 🧪 验证

### 成功标志

- [ ] Inspector 成功启动，没有报错
- [ ] 能够观察到完整的初始化握手（3 条消息）
- [ ] 能够观察到 `tools/list` 的响应
- [ ] 能够观察到至少一次 `tools/call` 的完整流程
- [ ] Inspector 的统计输出显示收发的消息数量正确

### 测试命令

```bash
# 1. 构建 TypeScript
npm run build

# 2. 运行 Inspector 并手动测试
npm start -- npx @modelcontextprotocol/server-filesystem /tmp

# 3. 在另一个终端用 curl 模拟 Host（需要手动发送 JSON-RPC）
# 更推荐用 MCP Inspector UI（方式 2）
```

## 🔍 关键发现

通过本实验，你应该理解：

### 1. MCP 是 Request-Response 模型

除了少数通知（如 `initialized`），大多数交互都是：
- Host 发送 Request（带 `id`）
- Server 返回 Response（必须带相同的 `id`）

**Why?** 这允许并发多个请求，Host 通过 `id` 匹配响应。

### 2. 初始化握手是不可省略的

即使你只想调用一个工具，也必须先完成：
1. Host → Server: `initialize` (声明协议版本和客户端能力)
2. Server → Host: 返回 Server 信息和能力
3. Host → Server: `initialized` (通知"我准备好了")

**Why?** 这是协议协商机制，确保双方使用兼容的版本，并且知道对方支持哪些功能。

### 3. 消息分帧很简单但很重要

MCP 使用 **换行符分隔** 的 JSON-RPC 消息。这意味着：
- 不能用 `JSON.parse()` 一次性解析整个流
- 必须逐行读取（`\n` 分隔）
- 每行都是一个独立的 JSON 对象

**陷阱**：有些 JSON-RPC 实现使用长度前缀（如 4 字节整数），但 MCP 不这么做。如果你看到"意外的 token"错误，很可能是分帧错了。

### 4. stderr 是独立通道

stderr 通常直接传递给终端，不经过 JSON-RPC 编码。这是用于调试日志、错误堆栈的通道，不会影响协议通信。

## 🚧 常见问题

### Q1: Inspector 启动后没有输出，怎么办？

**可能原因**：
1. Server 启动失败（命令路径错误）
2. Server 在等待连接（MCP Server 是被动方，需要 Host 连接）

**排查**：
- 检查 stderr 有没有错误信息（通常会直接打印到终端）
- 用 MCP Inspector UI 或 Claude Desktop 连接测试

### Q2: 为什么有些消息只显示 "id=3" 但没有 method？

**Answer**：那是 Response 消息。JSON-RPC 的 Response 格式是：
```json
{"jsonrpc":"2.0","id":3,"result":{...}}  // 或 "error":{...}
```

它不需要 `method` 字段，因为 Host 通过 `id` 就知道这是对哪个 Request 的响应。

### Q3: 日志中显示 "NOTIFICATION initialized"，但代码里没看到这行？

**Answer**：`notifications/initialized` 是 Server 主动发送的通知，不是 Request。这是 Server 告诉 Host"我已就绪"。观察我们的日志：

```
→ 2025-02-07T10:23:45.234Z NOTIFICATION    initialized     # Host 发送的
← 2025-02-07T10:23:45.567Z NOTIFICATION    notifications/initialized  # Server 回复的
```

注意：有些 Server 可能省略 `notifications/initialized`，这也是允许的。

### Q4: 为什么有时候一次 `data` 事件包含多条消息？

**Answer**：这是 **粘包** 现象。TCP/stdio 流不保证消息边界，一次 `read()` 可能返回：
- 半条消息（下次 `read()` 才能收到剩余部分）
- 一条完整消息
- 多条消息粘连在一起

**解决方案**：我们的 Inspector 代码做了正确处理：
```typescript
const lines = data.toString().split('\n').filter((l) => l.trim());
for (const line of lines) {
  const msg = parseJsonRpc(line);  // 逐行解析
  // ...
}
```

### Q5: 我想看完整的 JSON payload，不只是截断的预览，怎么办？

**Answer**：修改 `truncatePayload` 函数的 `maxLength` 参数，或者在 `formatMessage` 后添加：
```typescript
if (msg.params) {
  console.log(JSON.stringify(msg.params, null, 2));  // 完整打印
}
```

## 📚 延伸阅读

- [JSON-RPC 2.0 规范](https://www.jsonrpc.org/specification)
- [MCP 协议规范：Transport Layer](https://modelcontextprotocol.io/docs/specification/)
- [Node.js Child Process 文档](https://nodejs.org/api/child_process.html)
- [实验 02：从零实现 MCP Server](/topics/mcp-deep-dive/experiments/02-mcp-server/) — 使用本 Inspector 来调试你写的 Server

## 🎓 下一步

完成本实验后，你已经能"看见" MCP 通信了。接下来：

1. **实验 02**：自己实现一个 MCP Server，用 Inspector 验证它的协议流
2. **实验 03**：手写 MCP Client，深入理解协议细节
3. **实验 04**：构造恶意 Server，测试安全边界
