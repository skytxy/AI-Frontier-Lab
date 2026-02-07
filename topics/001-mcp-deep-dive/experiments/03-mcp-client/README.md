---
title: "从零实现 MCP Client"
experiment: 3
parent: 001-mcp-deep-dive
tags: [client, protocol, json-rpc, stdio]
difficulty: advanced
---

# Exp-03: 从零实现 MCP Client

## 📚 前置知识

**开始前你需要了解**：

- **JSON-RPC 2.0**：Request/Response 模型、消息格式、错误处理
- **Node.js Streams**：可读流（Readable）、可写流（Writable）、data 事件
- **Promise 异步编程**：async/await、Promise 链、错误处理
- **进程间通信**：stdin/stdout 管道、子进程 spawn

> **零基础？** 推荐先阅读：
> - [JSON-RPC 基础](../../concepts/json-rpc.md)
> - [stdio 传输原理](../../concepts/stdio-transport.md)
> - [消息分帧](../../concepts/framing.md)
> - **必须先完成**：[Exp-01 协议拦截器](../01-protocol-inspector/) 和 [Exp-02 MCP Server](../02-mcp-server/)

## 🎯 学习目标

完成本实验后，你将理解：

- [ ] **JSON-RPC 编解码**：手写 Request/Response/Notification 的序列化和反序列化
- [ ] **消息分帧处理**：正确处理粘包/半包问题
- [ ] **请求-响应匹配**：通过 ID 匹配异步响应
- [ ] **初始化握手**：完整的 MCP 协议协商流程
- [ ] **传输层抽象**：stdio 传输的实现细节
- [ ] **客户端 API 设计**：如何设计易用的高级 API

## 💡 为什么需要这个实验？

**你已经学会了**：
- Exp-01：观察 Server 和 Host 之间的消息流
- Exp-02：实现 Server，响应 Host 的请求

**现在轮到 Host 侧**：你自己实现 Client，主动发起请求、管理连接、处理响应。这是理解 MCP 协议最深的方式，因为：

1. **完全掌控**：不依赖任何 SDK，每条消息都由你构造和解析
2. **理解细节**：你必须处理所有边缘情况（超时、错误、分帧...）
3. **调试能力**：遇到问题时，你知道底层到底发生了什么

## 🛠️ 实验内容

### 背景知识

#### Client 的职责

MCP Client 是协议的**主动方**，负责：
1. 发起连接（spawn Server 进程）
2. 发送 `initialize` 请求
3. 发送 `initialized` 通知
4. 调用 tools/resources/prompts
5. 管理请求生命周期（超时、错误）
6. 关闭连接

#### 请求-响应匹配问题

**核心挑战**：stdio 是异步流，你发送了 3 个请求，响应可能乱序返回：

```
Client → Server: Request(id=1, tools/list)
Client → Server: Request(id=2, resources/list)
Client → Server: Request(id=3, prompts/list)

Server → Client: Response(id=2, [...])
Server → Client: Response(id=3, [...])
Server → Client: Response(id=1, [...])
```

**解决方案**：用 `Map<id, Promise>` 存储待处理的请求，收到响应时通过 ID 找到对应的 Promise 并 resolve。

#### 消息分帧问题

**核心挑战**：TCP/stdio 不保证消息边界，一次 `read()` 可能返回：

```
["{"jsonrpc":"2.0","id":1}\n",  // 一条完整消息
 {"jsonrpc":"2.0","id":2}\n{"jso",  // 一条半 + 下一条的开头
 "nrpc":"2.0","id":3}\n"]  // 剩余部分
```

**解决方案**：
1. 维护一个 buffer，累积所有数据
2. 用 `\n` 分割 buffer
3. 最后一行（不完整）保留在 buffer 中
4. 完整的行逐个解析

### 实现步骤

#### Step 1: 实现编解码器

**代码**：`src/protocol/jsonrpc.ts`

**功能**：
- `encodeRequest(id, method, params)` → JSON 字符串
- `encodeNotification(method, params)` → JSON 字符串
- `decodeMessage(line)` → JSON 对象或 null
- 类型守卫：`isRequest()`, `isResponse()`, `isNotification()`

**关键点**：
```typescript
// Request 和 Notification 的区别
interface JsonRpcRequest {
  id: string | number;  // 有 id
  method: string;
}

interface JsonRpcNotification {
  // 没有 id
  method: string;
}
```

#### Step 2: 实现 stdio 传输层

**代码**：`src/transport/stdio.ts`

**核心方法**：
- `start()`：启动 Server 进程
- `request(method, params)`：发送请求并等待响应
- `notify(method, params)`：发送通知（不等待响应）
- `stop()`：关闭连接

**关键实现**：消息分帧

```typescript
private buffer = '';

private handleData(data: Buffer): void {
  this.buffer += data.toString();
  
  const lines = this.buffer.split('\n');
  this.buffer = lines.pop() || '';  // 保留不完整的最后一行
  
  for (const line of lines) {
    const message = decodeMessage(line);
    if (message) {
      this.handleMessage(message);
    }
  }
}
```

**关键实现**：请求-响应匹配

```typescript
private pendingRequests = new Map();

async request(method: string, params?: unknown): Promise<unknown> {
  const id = ++this.requestId;
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      this.pendingRequests.delete(id);
      reject(new Error('Timeout'));
    }, 30000);
    
    this.pendingRequests.set(id, { resolve, reject, timeout });
    this.writeLine(encodeRequest(id, method, params));
  });
}

private handleMessage(message): void {
  if ('id' in message) {
    const pending = this.pendingRequests.get(message.id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    }
  }
}
```

#### Step 3: 实现生命周期管理

**代码**：`src/protocol/lifecycle.ts`

**功能**：封装初始化握手

```typescript
async initialize(clientInfo): Promise<ServerInfo> {
  // 1. 发送 initialize 请求
  const result = await this.transport.request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: { ... },
    clientInfo,
  });
  
  // 2. 发送 initialized 通知
  this.transport.notify('notifications/initialized');
  
  return result;
}
```

#### Step 4: 实现高级 Client API

**代码**：`src/client.ts`

**设计**：提供简洁的方法，隐藏底层协议细节

```typescript
class McpClient {
  async connect(): Promise<void> { ... }
  async listTools(): Promise<Tool[]> { ... }
  async callTool(name, args): Promise<any> { ... }
  async listResources(): Promise<Resource[]> { ... }
  async readResource(uri): Promise<any> { ... }
  async listPrompts(): Promise<Prompt[]> { ... }
  async getPrompt(name, args): Promise<any> { ... }
  async disconnect(): Promise<void> { ... }
}
```

#### Step 5: 运行演示

**前提**：先构建 Exp-02 Server

```bash
cd ../02-mcp-server
npm run build

cd ../03-mcp-client
npm run build
npm start /path/to/project
```

**预期输出**：
```
🚀 MCP Client Demo
Connecting to server with project root: /path/to/project

Step 1: Connecting to server...
✓ Connected

Step 2: Discovering tools...
✓ Found 2 tools:
  - file_search: Search for files matching a pattern (grep-style)
  - code_stats: Analyze codebase statistics (LOC, language distribution)

Step 3: Calling code_stats tool...
✓ Code statistics:
  Total files: 15
  Total lines: 2341
  Code lines: 1890
  Languages:
    - TypeScript: 12 files, 2100 lines
    - JSON: 3 files, 241 lines

Step 4: Discovering resources...
✓ Found 1 resources:
  - Project Files: List and read files in the project directory

Step 5: Discovering prompts...
✓ Found 1 prompts:
  - code_review: Generate a code review prompt for a file

Step 6: Getting code_review prompt...
✓ Generated prompt (first 500 chars):
# Code Review Request
...

Step 7: Disconnecting...
✓ Disconnected

✅ Demo completed successfully!
```

## 🧪 验证

### 成功标志

- [ ] Client 成功连接到 Exp-02 Server
- [ ] 完成初始化握手（3 条消息）
- [ ] 成功列出 tools/resources/prompts
- [ ] `code_stats` 工具返回正确的统计信息
- [ ] `code_review` prompt 生成正确的模板
- [ ] 连接正常关闭（Server 进程退出）

### 调试技巧

如果遇到问题：

1. **用 Exp-01 Inspector 包裹 Server**：
   ```bash
   npx tsx ../01-protocol-inspector/src/inspector.ts -- node ../02-mcp-server/dist/server.js /path/to/project
   ```

2. **修改 Client 连接到 Inspector**：
   ```typescript
   serverCommand: 'node';
   serverArgs: ['../01-protocol-inspector/dist/inspector.js', '--', 'node', '../02-mcp-server/dist/server.js', '/path/to/project'];
   ```

3. **观察消息流**：Inspector 会打印每条消息，帮助你定位问题

## 🔍 关键发现

### 1. JSON-RPC 的核心是"ID 匹配"

Request 和 Response 通过 `id` 字段关联。这是实现并发请求的基础：

```
Client 同时发送 3 个请求：
Request(id=1, tools/list)
Request(id=2, resources/list)
Request(id=3, prompts/list)

Server 可以乱序响应：
Response(id=2, [...])  // 通过 id=2 找到对应的 Promise
Response(id=3, [...])
Response(id=1, [...])
```

**Why?** 这允许高性能的并发通信，不需要等待上一个请求完成。

### 2. 消息分帧是"缓冲区 + 分行处理"

stdio 传输的本质是**字节流**，没有"消息"的概念。必须自己定义消息边界：

- **MCP 的选择**：换行符 (`\n`) 分隔
- **处理方式**：累积 buffer → 分行 → 解析完整行 → 保留不完整的行

**陷阱**：
- 不要假设一次 `data` 事件就是一条完整消息
- 不要用 `JSON.parse()` 解析整个流（会失败）
- 必须处理最后一行可能不完整的情况

### 3. 初始化握手是不可省略的协议协商

即使你只想调用一个工具，也必须：
1. 发送 `initialize`（声明协议版本和能力）
2. 接收 Server 的能力声明
3. 发送 `initialized` 通知

**Why?** 这是协议的"三次握手"，确保双方使用兼容的版本，并知道对方支持哪些功能。

### 4. Notification 不需要 ID，也无法匹配响应

Notification 是"即发即忘"的消息：

```typescript
// 发送 notification
this.transport.notify('notifications/initialized');

// 没有 id，也没有响应
// Server 收到后执行操作，但不回复
```

**Use Case**：
- `initialized` 通知（"我准备好了"）
- `notifications/progress`（进度报告）
- `notifications/cancelled`（取消请求）

### 5. 超时处理是必要的

网络/进程可能卡死，必须设置超时：

```typescript
const timeout = setTimeout(() => {
  this.pendingRequests.delete(id);
  reject(new Error('Request timeout'));
}, 30000);

// 收到响应时清除 timeout
clearTimeout(timeout);
```

**Why?** 没有 timeout，Pending Requests Map 会无限增长，导致内存泄漏。

### 6. 错误处理必须标准化

JSON-RPC 规定错误格式：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": { "details": "..." }
  }
}
```

**标准错误码**：
- `-32700`：Parse error（JSON 解析失败）
- `-32600`：Invalid Request（不是有效的 JSON-RPC）
- `-32601`：Method not found（Server 不支持这个 method）
- `-32602`：Invalid params（参数格式错误）
- `-32603`：Internal error（Server 内部错误）

## 🚧 常见问题

### Q1: 为什么 Client 发送了请求，但一直没收到响应？

**可能原因**：
1. Server 还没启动完成（需要等待 `spawn` 事件）
2. Server 崩溃了（检查 stderr 输出）
3. 请求 ID 冲突（确保每次请求用唯一的 ID）
4. 超时时间太短（增加 timeout）

**排查**：
```typescript
// 启用详细日志
transport.on('message', (msg) => {
  console.error('← Received:', JSON.stringify(msg));
});

// 在 writeLine 前打印
this.writeLine(line);
console.error('→ Sent:', line);
```

### Q2: 为什么 JSON.parse 会抛出异常？

**Answer**：可能是：
1. 数据不是完整的 JSON（还在 buffer 中）
2. 数据包含多条 JSON（需要逐行解析）

**解决方案**：
```typescript
// 错误的做法
const messages = JSON.parse(data.toString());  // 可能失败

// 正确的做法
const lines = data.toString().split('\n');
for (const line of lines) {
  if (line.trim()) {
    const message = JSON.parse(line);  // 逐行解析
  }
}
```

### Q3: 如何测试 Client 而不依赖 Exp-02 Server？

**Answer**：写一个 Mock Server：

```typescript
// mock-server.ts
process.stdin.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const msg = JSON.parse(line);
    if (msg.method === 'initialize') {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: { name: 'mock', version: '1.0.0' },
        },
      }) + '\n');
    }
  }
});
```

### Q4: 我能同时发送多个请求吗？

**Answer**：可以，但要注意：

1. 每个 ID 必须唯一
2. 并发数量不要太大（Server 可能处理不过来）
3. 准备好处理乱序响应

```typescript
// 并发发送 3 个请求
const [tools, resources, prompts] = await Promise.all([
  client.listTools(),
  client.listResources(),
  client.listPrompts(),
]);
```

### Q5: 为什么需要 `initialized` 通知？`initialize` 的响应还不够吗？

**Answer**：这是协议的设计选择：

- `initialize`（Request-Response）：**协商阶段**，交换能力和版本信息
- `initialized`（Notification）：**确认阶段**，告诉 Server"我已经收到了你的能力，可以开始处理实际请求了"

**Why?** 有些 Server 可能在 `initialized` 之后才初始化某些资源（如连接数据库），所以必须有两个阶段。

## 📚 延伸阅读

- [JSON-RPC 2.0 规范](https://www.jsonrpc.org/specification)
- [MCP 协议规范：Initialization](https://spec.modelcontextprotocol.io/specification/2024-11-05/basic/lifecycle/)
- [实验 01：协议拦截器](../01-protocol-inspector/) — 调试工具
- [实验 02：MCP Server](../02-mcp-server/) — 我们连接的 Server
- [实验 04：安全攻防](../04-security-lab/) — 安全边界测试

## 🎓 下一步

完成本实验后，你已经完全理解 MCP 协议了！接下来：

1. **实验 04**：构造恶意 Server，测试安全边界
2. **实战**：用这个 Client 连接其他 MCP Server（如 `@modelcontextprotocol/server-github`）
3. **优化**：添加重试、连接池、更完善的错误处理
