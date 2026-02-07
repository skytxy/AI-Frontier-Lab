# 消息分帧（Framing）

## 什么是消息分帧？

**消息分帧** = 在字节流中划分消息边界的机制。

**问题**：TCP/stdio 是连续的字节流，没有"消息"的概念。接收方需要知道：
- 一条消息从哪里开始
- 一条消息在哪里结束
- 下一条消息从哪里开始

## 分帧方式

### 1. 长度前缀（Length-Prefix Framing）

**格式**：`[4字节长度][消息内容]`

```
00000089{"jsonrpc":"2.0","id":1,"method":"tools/list"}
^^^^^^^
长度（137 字节）
```

**优点**：
- 高效（一次 `read()` 就能知道完整消息长度）
- 支持二进制消息

**缺点**：
- 需要处理字节序（大端/小端）
- 实现复杂

**示例**：WebSocket、gRPC、很多 RPC 框架

### 2. 分隔符（Delimiter Framing）

**格式**：`消息1\n消息2\n消息3\n`

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n
{"jsonrpc":"2.0","id":1,"result":{...}}\n
{"jsonrpc":"2.0","method":"notifications/initialized"}\n
```

**优点**：
- 简单（字符串操作）
- 人类可读（便于调试）

**缺点**：
- 消息内容不能包含分隔符（需要转义）
- 需要逐行解析（性能略低）

**示例**：MCP、JSON-RPC（通常）

### 3. 固定长度（Fixed-Length Framing）

**格式**：每条消息固定 N 字节

```
[64 字节][64 字节][64 字节]
```

**优点**：
- 极快（直接计算偏移量）

**缺点**：
- 浪费空间（短消息也要填充）
- 不灵活

**示例**：某些金融协议

## MCP 的选择：分隔符（`\n`）

MCP 使用**换行符分隔**的 JSON-RPC 消息。

### 为什么不用长度前缀？

1. **简化实现**：不需要处理字节序、二进制编码
2. **人类可读**：可以直接在终端查看消息流
3. **JSON 友好**：JSON 消息天然不包含换行符（除非在字符串中）

### 字符串中的换行符怎么办？

JSON 字符串中的 `\n` 是转义字符，不会影响分帧：

```json
{"text":"Line 1\nLine 2\nLine 3"}\n
                                ↑
                            真正的分隔符
```

## 实现

### 读取和解析

```typescript
let buffer = '';

stream.on('data', (chunk) => {
  buffer += chunk.toString();
  
  // 按换行符分割
  const lines = buffer.split('\n');
  
  // 保留最后不完整的行
  buffer = lines.pop() || '';
  
  // 处理完整的行
  for (const line of lines) {
    if (line.trim()) {
      const message = JSON.parse(line);
      handleMessage(message);
    }
  }
});
```

### 发送消息

```typescript
function sendMessage(message: object): void {
  const json = JSON.stringify(message);
  stream.write(json + '\n');  // 添加换行符
}
```

## 边缘情况

### 1. 空行

```typescript
{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n
\n  ← 空行，跳过
{"jsonrpc":"2.0","id":2,"method":"resources/list"}\n
```

**处理**：`if (!line.trim()) continue;`

### 2. 多个换行符

```typescript
{"jsonrpc":"2.0","id":1}\n\n\n
```

**处理**：`split('\n')` 会产生空字符串，跳过即可

### 3. 巨大消息

```typescript
{"result":{"data":[...100MB数据...]}}\n
```

**问题**：一次性读取可能占用大量内存

**处理**：流式解析（但 MCP 不支持，消息必须完整）

## 性能考虑

### Buffer 大小

```typescript
// ❌ 错误：可能丢失不完整的行
stream.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  // ...
});

// ✅ 正确：累积 buffer
let buffer = '';
stream.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  // ...
});
```

### 内存泄漏

```typescript
// ❌ 危险：buffer 无限增长
let buffer = '';
stream.on('data', (chunk) => {
  buffer += chunk.toString();
  // 忘记处理和清空 buffer
});

// ✅ 正确：及时处理
let buffer = '';
stream.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';  // 保留少量数据
  
  for (const line of lines) {
    // 处理并丢弃
  }
});
```

## 调试技巧

### 打印原始字节流

```typescript
stream.on('data', (chunk) => {
  console.error('Raw:', chunk.toString());
  // 然后再解析
});
```

### 用 Inspector 观察

实验 01 的 Inspector 可以显示所有消息流，帮助调试分帧问题。

## 总结

- MCP 使用 `\n` 分隔消息（简单、可读）
- 必须处理粘包/半包（累积 buffer + 逐行解析）
- 注意边缘情况（空行、多个换行符、巨大消息）
- 及时清空 buffer，避免内存泄漏
