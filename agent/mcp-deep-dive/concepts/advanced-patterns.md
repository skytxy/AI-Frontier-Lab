# 高级服务端模式

## 概述

基础 MCP Server 实现主要关注请求-响应模式，但实际生产环境需要更复杂的能力：

- **流式响应**：长时间运行的操作需要进度反馈
- **工具取消**：允许中断正在执行的操作
- **服务端通知**：Server 主动推送更新
- **资源订阅**：监听资源变化

## 进度通知 (Progress Notifications)

### 什么是进度通知？

进度通知允许 Server 在 Tool 执行过程中向 Host 报告进度，而不是等待完成后才返回结果。

### 工作原理

```
Host                          Server
│                              │
│ tools/call {                │
│   _progressToken: "abc123"  │
│ }                           │
│ ──────────────────────────► │
│                              │  [执行中...]
│                              │ ◄──────────────────
│ notifications/progress {     │  progress: 0.25
│   progressToken: "abc123"   │  message: "Scanning..."
│   progress: 0.25             │ }
│   message: "Scanning..."     │
│ }                           │
│                              │  [继续执行...]
│                              │ ◄──────────────────
│ notifications/progress {     │  progress: 0.50
│   progressToken: "abc123"   │  message: "Analyzing..."
│   progress: 0.50             │ }
│   message: "Analyzing..."    │
│ }                           │
│                              │  [完成]
│                              │ ◄──────────────────
│ { result: {...} }            │
```

### 实现

**Server 侧**：

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'progress-server',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const progressToken = (args as any)?._progressToken;

  if (name === 'long_running_task') {
    const steps = 10;

    for (let i = 0; i < steps; i++) {
      // 执行实际工作
      await doStep(i);

      // 发送进度更新
      if (progressToken) {
        await server.sendNotification('notifications/progress', {
          progressToken,
          progress: (i + 1) / steps,
          message: `Processing step ${i + 1} of ${steps}`
        });
      }
    }

    return {
      content: [{ type: 'text', text: 'Task completed!' }]
    };
  }
});
```

**Host 侧**：

```typescript
// 调用时传入 progressToken
const result = await client.request({
  method: 'tools/call',
  params: {
    name: 'long_running_task',
    arguments: {
      _progressToken: generateToken()  // Host 生成唯一 token
    }
  }
});

// 监听进度通知
client.setNotificationHandler('notifications/progress', (notification) => {
  const { progress, message } = notification.params;
  updateUI(progress, message);  // 更新进度条
});
```

### 最佳实践

1. **进度值范围**：0.0 到 1.0（0% 到 100%）
2. **消息要具体**：告诉用户正在做什么，而不是重复"Processing..."
3. **处理取消**：检查是否已取消，避免继续发送通知
4. **错误时的进度**：进度 1.0 不总是表示成功，可能表示失败

## 工具取消 (Tool Cancellation)

### 什么是工具取消？

工具取消允许 Host 中断正在执行的 Tool 操作，释放资源并返回部分结果。

### 工作原理

```
Host                          Server
│                              │
│ tools/call {                 │
│   name: "expensive_task"     │
│ }                            │
│ ──────────────────────────► │
│                              │  [开始执行...]
│                              │
│ [用户点击取消]                │
│                              │
│ tools/cancel {               │
│   requestId: 123,            │
│   reason: "User cancelled"   │
│ }                            │
│ ──────────────────────────► │
│                              │  [清理资源...]
│                              │ ◄──────────────────
│ { error: {                   │  code: -32800
│   code: -32800,              │  message: "Cancelled"
│   message: "Cancelled"        │ }
│ } }                          │
```

### 实现

**Server 侧（使用 AbortController）**：

```typescript
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// 存储活跃请求的 AbortController
const activeRequests = new Map<string | number, AbortController>();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const requestId = request.id;
  const abortController = new AbortController();

  activeRequests.set(requestId, abortController);

  try {
    // 传递 signal 到异步操作
    const result = await performExpensiveTask(abortController.signal);
    return { content: [{ type: 'text', text: result }] };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new McpError(
        ErrorCodes.RequestCancelled,
        'Request was cancelled by the client'
      );
    }
    throw error;
  } finally {
    activeRequests.delete(requestId);
  }
});

// 注册取消处理器
server.setRequestHandler('tools/cancel', async (request) => {
  const { requestId, reason } = request.params;

  const abortController = activeRequests.get(requestId);
  if (abortController) {
    abortController.abort(reason);
    return { success: true };
  }

  throw new McpError(
    ErrorCodes.InvalidRequest,
    `No active request with ID ${requestId}`
  );
});

// 支持取消的长时间任务
async function performExpensiveTask(signal: AbortSignal): Promise<string> {
  const items = await fetchLargeList();

  for (const item of items) {
    // 每次迭代检查是否取消
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    await processItem(item);
  }

  return 'Completed';
}
```

### 最佳实践

1. **快速响应取消**：一旦收到取消请求，立即停止操作
2. **清理资源**：关闭文件、数据库连接、网络请求
3. **返回部分结果**：如果可能，返回已完成的工作
4. **幂等取消**：多次取消同一请求不应导致错误

## 服务端通知 (Server-Initiated Notifications)

### 什么是服务端通知？

服务端通知允许 Server 在没有 Host 请求的情况下主动推送消息。

### 通知类型

| 通知类型 | 用途 | Server 能力要求 |
|---------|------|----------------|
| `notifications/progress` | 工具执行进度 | 无特殊要求 |
| `notifications/resources/list_changed` | 资源列表变化 | `resources.listChanged: true` |
| `notifications/roots/list_changed` | 根列表变化 | Host 能力 `roots.listChanged` |
| `notifications/cancelled` | 请求被取消 | 无特殊要求 |

### 资源列表变化通知

```typescript
// Server 声明能力
const server = new Server({
  name: 'dynamic-resource-server',
  version: '1.0.0'
}, {
  capabilities: {
    resources: {
      listChanged: true  // 声明支持动态资源列表
    }
  }
});

// 当资源变化时发送通知
async function onResourceChanged() {
  await server.sendNotification(
    'notifications/resources/list_changed',
    {}
  );

  // Host 会重新调用 resources/list 获取新列表
}
```

**使用场景**：
- 文件系统 Server：文件被创建/删除
- Git Server：分支/标签变化
- 数据库 Server：表结构变化

### 自定义通知

MCP 允许自定义通知类型，但需要 Host 和 Server 事先约定：

```typescript
// Server 定义自定义通知
interface LogNotification {
  method: 'notifications/log';
  params: {
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  };
}

// Server 发送
await server.sendNotification('notifications/log', {
  level: 'info',
  message: 'Database connection established',
  timestamp: new Date().toISOString()
});

// Host 监听
client.setNotificationHandler('notifications/log', (notification) => {
  const { level, message } = notification.params;
  logger.log(level, message);
});
```

### 最佳实践

1. **通知频率控制**：避免通知风暴（如文件变化频繁时）
2. **使用防抖/节流**：合并短时间内的大量通知
3. **提供上下文**：通知应该包含足够的信息让 Host 理解变化
4. **处理断连**：重新连接后应该同步状态

## 资源订阅 (Resource Subscriptions)

### 什么是资源订阅？

资源订阅允许 Host 订阅特定资源的变化，Server 在资源变化时主动推送更新。

### 工作原理

```
Host                          Server
│                              │
│ resources/subscribe {        │
│   uri: "config://app"        │
│ }                            │
│ ──────────────────────────► │
│                              │  [订阅成功]
│ { result: { success: true } } │
│ ◄─────────────────────────── │
│                              │
│                              │  [配置变化]
│                              │ ◄──────────────────
│ notifications/resources/list_changed │
│                              │
│ resources/read {             │  [读取新值]
│   uri: "config://app"        │
│ }                            │
│ ──────────────────────────► │
```

### 实现

**Server 侧**：

```typescript
import { ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// 存储订阅关系
const subscriptions = new Set<string>();

// 注册订阅处理器
server.setRequestHandler('resources/subscribe', async (request) => {
  const { uri } = request.params;

  // 验证 URI
  if (!isValidResourceUri(uri)) {
    throw new McpError(
      ErrorCodes.InvalidRequest,
      `Invalid resource URI: ${uri}`
    );
  }

  subscriptions.add(uri);

  // 设置监听器
  setupResourceWatcher(uri, () => {
    server.sendNotification(
      'notifications/resources/list_changed',
      {}
    );
  });

  return { success: true };
});

// 注册取消订阅处理器
server.setRequestHandler('resources/unsubscribe', async (request) => {
  const { uri } = request.params;
  subscriptions.delete(uri);
  cleanupResourceWatcher(uri);
  return { success: true };
});

// 声明能力
const server = new Server({
  name: 'subscribable-server',
  version: '1.0.0'
}, {
  capabilities: {
    resources: {
      subscribe: true,  // 声明支持订阅
      listChanged: true
    }
  }
});
```

**Host 侧**：

```typescript
// 订阅资源
await client.request({
  method: 'resources/subscribe',
  params: { uri: 'config://app' }
});

// 监听变化
client.setNotificationHandler(
  'notifications/resources/list_changed',
  async () => {
    // 重新读取资源
    const result = await client.request({
      method: 'resources/read',
      params: { uri: 'config://app' }
    });

    updateUI(result);
  }
);
```

### 订阅生命周期

```
订阅 -> 活跃 -> 通知 -> 通知 -> ... -> 取消订阅
                ↓
             连接断开（自动取消所有订阅）
```

### 最佳实践

1. **限制订阅数量**：防止资源耗尽
2. **清理断连订阅**：连接断开时自动清理
3. **批量通知**：多个资源变化时发送单个通知
4. **订阅验证**：检查订阅权限和资源存在性

## 组合模式

### 流式响应 + 取消

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const progressToken = (args as any)?._progressToken;
  const abortController = new AbortController();

  // 支持取消
  activeRequests.set(request.id!, abortController);

  try {
    for (let i = 0; i < 100; i++) {
      if (abortController.signal.aborted) {
        return {
          content: [{
            type: 'text',
            text: `Partially completed: ${i}/100 items`
          }]
        };
      }

      await processItem(i);

      // 发送进度
      if (progressToken) {
        await server.sendNotification('notifications/progress', {
          progressToken,
          progress: i / 100,
          message: `Processed ${i} items`
        });
      }
    }

    return {
      content: [{ type: 'text', text: 'Completed 100 items' }]
    };
  } finally {
    activeRequests.delete(request.id!);
  }
});
```

### 资源订阅 + 服务端通知

```typescript
// 订阅文件系统变化
server.setRequestHandler('resources/subscribe', async (request) => {
  const { uri } = request.params;
  const path = uriToFilesystemPath(uri);

  // 设置文件监听器
  const watcher = fs.watch(path, async (eventType) => {
    if (eventType === 'change') {
      // 通知 Host 资源变化
      await server.sendNotification(
        'notifications/resources/list_changed',
        {}
      );
    }
  });

  watchers.set(uri, watcher);
  return { success: true };
});
```

## 总结

| 模式 | 适用场景 | 复杂度 |
|------|---------|-------|
| **进度通知** | 长时间运行的任务 | 低 |
| **工具取消** | 可中断的操作 | 中（需要状态管理） |
| **服务端通知** | 主动推送更新 | 低（单个通知）/ 中（自定义通知） |
| **资源订阅** | 实时数据同步 | 高（需要监听器、清理逻辑） |

**实现建议**：
1. 从进度通知开始，用户体验提升最明显
2. 根据需要添加取消支持
3. 谨慎使用资源订阅，确保有完整的生命周期管理

## 延伸阅读

- [MCP 规范 - 进度通知](https://modelcontextprotocol.io/docs/concepts/notifications/)
- [实验 02：MCP Server 实现](/topics/mcp-deep-dive/experiments/02-mcp-server/)
- [生产部署模式](/topics/mcp-deep-dive/concepts/production-deployment)
