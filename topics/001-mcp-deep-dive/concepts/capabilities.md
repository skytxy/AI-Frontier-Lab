# 能力协商机制

## 什么是能力协商？

**能力协商** = Host 和 Server 交换信息，确定对方支持哪些功能。

**类比**：握手
- Host: "我会 A、B、C，你会什么？"
- Server: "我会 X、Y、Z"
- Host: "好，那我们可以用 X 和 Y 通信"

## 为什么需要能力协商？

### 问题：版本不兼容

```
Host (v1.0):                Server (v2.0):
- tools                     - tools
- resources                 - resources
                            - prompts  ← Host 不知道！
```

如果 Host 不知道 Server 支持 `prompts`，就不会使用它。

### 解决方案：声明和发现

1. **Host 声明能力**（`initialize` 请求）
2. **Server 声明能力**（`initialize` 响应）
3. **双方根据能力调整行为**

## 协商流程

```
Host → Server: initialize {
  protocolVersion: "2024-11-05",
  capabilities: {
    roots: { listChanged: true },
    sampling: {}
  },
  clientInfo: { name: "Claude Desktop", version: "1.0.0" }
}

Server → Host: {
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: {},
    resources: { subscribe: true, listChanged: true },
    prompts: {}
  },
  serverInfo: { name: "filesystem", version: "1.0.0" }
}

Host → Server: notifications/initialized {}
```

## Host 能力

Host 在 `initialize` 请求中声明自己的能力：

```json
{
  "capabilities": {
    "roots": {
      "listChanged": true
    },
    "sampling": {}
  }
}
```

| 能力 | 含义 | Server 如何使用 |
|------|------|----------------|
| `roots.listChanged` | Host 支持动态根列表 | Server 可以发送 `roots/list_changed` 通知 |
| `sampling` | Host 支持采样（LLM 生成） | Server 可以请求 Host 调用 LLM |

## Server 能力

Server 在 `initialize` 响应中声明自己的能力：

```json
{
  "capabilities": {
    "tools": {},
    "resources": {
      "subscribe": true,
      "listChanged": true
    },
    "prompts": {},
    "logging": {}
  }
}
```

| 能力 | 含义 | Host 如何使用 |
|------|------|--------------|
| `tools` | Server 提供工具 | Host 可以调用 `tools/list` 和 `tools/call` |
| `resources.subscribe` | 支持资源订阅 | Host 可以调用 `resources/subscribe` |
| `resources.listChanged` | 资源列表动态变化 | Server 可以发送 `resources/list_changed` 通知 |
| `prompts` | Server 提供提示词模板 | Host 可以调用 `prompts/list` 和 `prompts/get` |
| `logging` | Server 支持日志级别 | Host 可以发送 `setLevel` 通知 |

## 实际示例

### 场景 1：Server 不支持 resources

```json
// Host: 我想要 resources
Host → Server: initialize {
  capabilities: {}  // 不声明 resources
}

// Server: 我也不支持
Server → Host: {
  capabilities: {
    "tools": {}
    // 没有 resources
  }
}

// 结果：Host 不会调用 resources/list
```

### 场景 2：Host 支持采样

```json
// Host: 我支持 sampling
Host → Server: initialize {
  capabilities: {
    "sampling": {}
  }
}

// Server: 太好了，我可以请求你调用 LLM
Server → Host: sampling/createMessage {
  "messages": [...],
  "maxTokens": 1000,
  "includeContext": true
}
```

### 场景 3：动态资源列表

```json
// Server: 我支持资源订阅
Server → Host: {
  capabilities: {
    "resources": {
      "subscribe": true,
      "listChanged": true
    }
  }
}

// Host: 订阅资源
Host → Server: resources/subscribe {
  "uri": "config://system"
}

// Server: 稍后通知变化
Server → Host: notifications/resources/list_changed {}
```

## 未声明能力的行为

### Host 使用未声明的能力

```
Server 声明: { "tools": {} }  // 没有 prompts
Host 调用: prompts/list
Server 响应: error { code: -32601, message: "Method not found" }
```

### Server 发送未通知的能力

```
Server 声明: { "resources": {} }  // 没有 listChanged
Server 发送: notifications/resources/list_changed
Host 行为: 忽略或报错（取决于实现）
```

## 最佳实践

### 1. 声明所有支持的能力

```typescript
// ✅ 正确
const capabilities = {
  tools: {},
  resources: { subscribe: true, listChanged: true },
  prompts: {},
};

// ❌ 错误：忘记声明
const capabilities = {
  tools: {}
  // 忘记 prompts，但实际实现了
};
```

### 2. 检查对方能力再使用

```typescript
// ✅ 正确：检查能力
if (serverCapabilities.resources?.subscribe) {
  await callResourceSubscribe();
}

// ❌ 错误：盲目调用
await callResourceSubscribe();  // 可能失败
```

### 3. 优雅降级

```typescript
// Server 支持 prompts
if (serverCapabilities.prompts) {
  const prompt = await getPrompt('code_review');
  usePrompt(prompt);
} else {
  // 降级到手动构建提示词
  const manualPrompt = buildManualPrompt();
  usePrompt(manualPrompt);
}
```

## 总结

- 能力协商确保 Host 和 Server 使用兼容的功能
- Host 在 `initialize` 请求中声明能力
- Server 在 `initialize` 响应中声明能力
- 双方应该检查对方能力再使用相应功能
- 未声明的能力不应该被使用（可能失败）
