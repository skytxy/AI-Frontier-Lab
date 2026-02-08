# 生产部署模式

## 概述

将 MCP Server 部署到生产环境需要考虑可靠性、可观测性、安全性和可扩展性。本文档涵盖**MCP 特定**的部署要点，通用部署模式请参考外部文档。

## MCP 特定部署要点

### stdio 进程管理

stdio 传输需要特殊的进程管理：

```typescript
import { spawn } from 'child_process';

class ManagedMCPProcess {
  private process?: ChildProcess;
  private restartAttempts = 0;
  private readonly maxRestarts = 5;

  start(command: string, args: string[]) {
    this.process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'inherit'],  // stderr 直接输出
    });

    // 自动重启
    this.process.on('exit', (code) => {
      if (code !== 0 && this.restartAttempts < this.maxRestarts) {
        this.restartAttempts++;
        console.info(`Restarting server (attempt ${this.restartAttempts})`);
        setTimeout(() => this.start(command, args), 1000);
      }
    });
  }

  stop() {
    this.process?.kill('SIGTERM');
  }
}
```

### 能力协商验证

生产环境必须验证 Server 能力：

```typescript
async function validateCapabilities(client: MCPClient): Promise<void> {
  const { capabilities } = await client.initialize();

  const required = ['tools', 'resources'];
  const missing = required.filter(c => !capabilities[c]);

  if (missing.length > 0) {
    throw new Error(`Missing required capabilities: ${missing.join(', ')}`);
  }
}
```

### 错误处理模式

**重试策略**：使用指数退避处理可重试错误（网络超时、内部错误）

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (error) {
      if (attempt === maxRetries || !isRetriable(error)) throw error;
      await sleep(Math.min(100 * 2 ** attempt, 5000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**超时保护**：所有工具调用必须有超时

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await withTimeout(
    () => executeTool(request.params),
    30000  // 30s 默认超时
  );
});
```

> 详见：[MCP 规范 - 错误处理](https://modelcontextprotocol.io/docs/specification/)

## 多 Server 架构

### 服务发现与路由

```typescript
interface MCPServerDescriptor {
  id: string;
  endpoint: string;
  capabilities: ServerCapabilities;
  health: 'healthy' | 'down';
}

class MCPServerRegistry {
  private servers = new Map<string, MCPServerDescriptor>();

  // 根据能力路由请求
  async routeToolCall(toolName: string, args: any): Promise<any> {
    const servers = Array.from(this.servers.values())
      .filter(s => s.health === 'healthy' && s.capabilities.tools);

    // 查找支持该工具的 Server
    for (const server of servers) {
      const client = new MCPClient(server.endpoint);
      const tools = await client.listTools();
      if (tools.tools?.find(t => t.name === toolName)) {
        return await client.callTool(toolName, args);
      }
    }

    throw new Error(`Tool ${toolName} not found`);
  }
}
```

### Server 隔离

使用 Worker 进程隔离不信任的 Server：

```typescript
import { Worker } from 'worker_threads';

class IsolatedMCPHost {
  private workers = new Map<string, Worker>();

  startServer(serverId: string, scriptPath: string) {
    const worker = new Worker(scriptPath, {
      stdout: true,
      stderr: 'inherit',
      resourceLimits: {  // 资源限制
        maxOldGenerationSizeMb: 128,
      }
    });

    worker.on('exit', () => this.workers.delete(serverId));
    this.workers.set(serverId, worker);
  }
}
```

## 认证与授权

### Token 认证（HTTP 模式）

```typescript
class AuthMiddleware {
  constructor(private readonly tokens: Set<string>) {}

  verify(authHeader: string | undefined): boolean {
    if (!authHeader) return false;
    const token = authHeader.replace(/^Bearer\s+/, '');
    return this.tokens.has(token);
  }
}
```

> OAuth 2.0 / PKCE 实现请参考：[RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) 和 [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)

## 部署模式

### 容器化部署

**关键要点**：
- 使用非 root 用户运行
- 设置健康检查
- 限制资源使用

**Docker 示例**（简化版）：
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN addgroup -g 1001 -S mcp && adduser -S -u 1001 -G mcp mcp
USER mcp
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**完整部署配置**（Docker Compose / K8s）请参考：
- [Docker 官方文档](https://docs.docker.com/compose/)
- [Kubernetes 部署最佳实践](https://kubernetes.io/docs/concepts/configuration/overview/)

### 无服务器部署

对于 HTTP (SSE) 传输，可以部署到 AWS Lambda / Cloud Functions：

> 参考平台特定的适配器文档：
> - [AWS Lambda 适配器](https://docs.aws.amazon.com/lambda/latest/dg/invocation-events.html)
> - [Cloud Functions 文档](https://cloud.google.com/functions/docs)

## 监控与可观测性

### 核心指标

```typescript
// 使用 prom-client 或类似库
const mcpRequestsTotal = new Counter({
  name: 'mcp_requests_total',
  help: 'Total MCP requests',
  labelNames: ['method', 'status'],
});

const mcpToolDuration = new Histogram({
  name: 'mcp_tool_duration_seconds',
  help: 'Tool execution duration',
  labelNames: ['tool_name'],
});
```

### 结构化日志

```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: { level: (label) => ({ level: label }) },
});

logger.info({
  event: 'tool_call',
  tool: request.params.name,
  duration: elapsedMs,
});
```

> 分布式追踪（OpenTelemetry）详见：[OpenTelemetry 文档](https://opentelemetry.io/docs/instrumentation/js/)

## 配置管理

```typescript
interface ServerConfig {
  transport: 'stdio' | 'http';
  logLevel: 'debug' | 'info' | 'warn';
  auth?: { tokens: string[] };
  rateLimit?: { requestsPerMinute: number };
}

function loadConfig(): ServerConfig {
  return {
    transport: process.env.MCP_TRANSPORT as any || 'stdio',
    logLevel: (process.env.MCP_LOG_LEVEL as any) || 'info',
    auth: process.env.MCP_AUTH_TOKENS
      ? { tokens: process.env.MCP_AUTH_TOKENS.split(',') }
      : undefined,
  };
}
```

## 总结

| 方面 | MCP 特定要点 |
|------|-------------|
| **进程管理** | stdio 需要自动重启、资源限制 |
| **能力验证** | 启动时检查 Server 能力 |
| **错误处理** | 超时保护、指数退避重试 |
| **多 Server** | 基于能力的动态路由 |
| **监控** | 请求计数、工具执行延迟 |
| **安全** | Token 认证（HTTP）、进程隔离 |

## 延伸阅读

- [MCP 规范 - 安全](https://modelcontextprotocol.io/docs/concepts/security/)
- [实验 02：MCP Server 实现](/topics/mcp-deep-dive/experiments/02-mcp-server/)
- [高级服务端模式](/topics/mcp-deep-dive/concepts/advanced-patterns)
