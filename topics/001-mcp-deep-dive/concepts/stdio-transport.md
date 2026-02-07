# stdio 传输原理

## 什么是 stdio？

**stdio** = Standard Input/Output（标准输入/输出），是进程间通信（IPC）的最简单形式。

```
┌─────────────┐                    ┌──────────────┐
│   Host      │                    │   Server     │
│             │                    │              │
│  stdin   ───┼────────────────────┼──► stdout    │
│  stdout  ───┼────────────────────┼───► stdin    │
│  stderr  ───┼────────────────────┼───► stderr   │
└─────────────┘                    └──────────────┘
```

## 工作原理

### 1. 进程启动

Host 启动 Server 进程：

```typescript
const serverProcess = spawn('node', ['server.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});
```

- `stdio: ['pipe', 'pipe', 'inherit']`:
  - `stdin`: 管道（Host 写入，Server 读取）
  - `stdout`: 管道（Server 写入，Host 读取）
  - `stderr`: 继承（直接输出到终端）

### 2. 双向通信

**Host → Server**（写数据到 Server 的 stdin）：

```typescript
serverProcess.stdin.write('{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n');
```

**Server → Host**（从 Server 的 stdout 读取）：

```typescript
serverProcess.stdout.on('data', (data) => {
  const message = data.toString();
  // 处理消息
});
```

### 3. stderr 独立通道

stderr 通常直接输出到终端，不经过 JSON-RPC 编码：

```
Server console.error('Debug message');
→ 直接显示在终端，不混入协议流
```

## 消息分帧

### 问题：粘包/半包

TCP/stdio 是**字节流**，不保证消息边界：

```
一次 read() 可能返回：
["{"jsonrpc":"2.0","id":1}\n",           // 一条完整消息
 {"jsonrpc":"2.0","id":2}\n{"jso",       // 一条半 + 下一条的开头
 "nrpc":"2.0","id":3}\n"]                // 剩余部分
```

### MCP 的解决方案：换行分隔

每条 JSON-RPC 消息用换行符（`\n`）分隔：

```
{"jsonrpc":"2.0","id":1,"method":"initialize",...}\n
{"jsonrpc":"2.0","id":1,"result":{...}}\n
{"jsonrpc":"2.0","method":"notifications/initialized"}\n
```

**处理逻辑**：

```typescript
let buffer = '';

stdout.on('data', (data) => {
  buffer += data.toString();
  
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';  // 保留不完整的最后一行
  
  for (const line of lines) {
    if (line.trim()) {
      const message = JSON.parse(line);
      handleMessage(message);
    }
  }
});
```

## 优缺点

### 优点

- **简单**：不需要网络配置、端口管理
- **安全**：本地通信，无需认证
- **高效**：无网络开销
- **通用**：所有语言/平台都支持

### 缺点

- **只能本地使用**：无法远程访问
- **单向流**：需要重启进程才能重连
- **调试困难**：需要用 Inspector 等工具观察消息流

## 与 HTTP (SSE) 的对比

| 特性 | stdio | HTTP (SSE) |
|------|-------|------------|
| **连接模式** | 单向流（单连接） | 双向（Server-Sent Events） |
| **会话管理** | 不需要 | 需要（多路复用） |
| **远程访问** | ❌ 不支持 | ✅ 支持 |
| **Web 集成** | ❌ 不适用 | ✅ 适用 |
| **复杂度** | 简单 | 复杂（需要会话 ID、CORS） |
| **性能** | 高 | 中 |

## 何时使用 stdio？

- ✅ 本地应用（如 Claude Desktop）
- ✅ CLI 工具
- ✅ 快速原型开发
- ❌ Web 应用
- ❌ 远程访问
- ❌ 需要多客户端连接
