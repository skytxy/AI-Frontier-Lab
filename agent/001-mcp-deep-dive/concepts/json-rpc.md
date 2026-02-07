# JSON-RPC 2.0 基础

## 什么是 JSON-RPC？

JSON-RPC 是一种**轻量级的远程过程调用（RPC）协议**，使用 JSON 编码。

**核心思想**：发送"调用某个函数"的请求，接收"函数返回值"的响应。

## 消息格式

### Request（请求）

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": { ... }
}
```

- `jsonrpc`: 协议版本（必须是 "2.0"）
- `id`: 请求标识符（用于匹配响应）
- `method`: 要调用的函数名
- `params`: 函数参数（可选）

### Response（响应）

**成功响应**：
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

**错误响应**：
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": { ... }
  }
}
```

- `id`: 必须与对应的 Request 相同
- `result` 或 `error`: 二选一（成功或失败）

### Notification（通知）

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": { ... }
}
```

- **没有 `id`**：这是通知，不需要响应
- 用于"即发即忘"的消息（如进度更新）

## MCP 中的 JSON-RPC

MCP 使用 JSON-RPC 2.0 作为编码层，所有通信都是 JSON-RPC 消息：

**示例：初始化握手**

```json
// Request (Host → Server)
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "Claude Desktop", "version": "1.0.0" }
  }
}

// Response (Server → Host)
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {}, "resources": {} },
    "serverInfo": { "name": "filesystem", "version": "1.0.0" }
  }
}

// Notification (Host → Server)
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

## 关键特性

### 1. 请求-响应匹配

通过 `id` 字段关联请求和响应：

```
Host: Request(id=1, tools/list)
Host: Request(id=2, resources/list)

Server: Response(id=2, [...])  ← 可能乱序返回
Server: Response(id=1, [...])
```

### 2. 并发请求

可以同时发送多个请求，通过 `id` 区分响应。

### 3. 错误处理

标准化的错误格式：

| 错误码 | 含义 |
|--------|------|
| `-32700` | Parse error（JSON 解析失败） |
| `-32600` | Invalid Request（不是有效的 JSON-RPC） |
| `-32601` | Method not found（不支持的方法） |
| `-32602` | Invalid params（参数错误） |
| `-32603` | Internal error（Server 内部错误） |

### 4. 通知

不需要响应的消息（单向通信）：

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": { "requestId": 1, "reason": "User cancelled" }
}
```

## 与 MCP 的关系

MCP 在 JSON-RPC 之上定义了：

- **方法名**（如 `tools/call`、`resources/read`）
- **参数格式**（如 Zod schema）
- **响应格式**（如 `content` 数组）
- **通知类型**（如 `notifications/initialized`）

但核心的编码/解码、请求-响应匹配、错误处理都遵循 JSON-RPC 2.0 规范。
