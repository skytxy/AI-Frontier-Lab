# MCP 入门指南

## 什么是 MCP？

MCP (Model Context Protocol) 是一个**开放协议**，用于 AI 应用（如 Claude Desktop）与外部数据源和工具之间的标准化通信。

**核心思想**：让 LLM 能够安全、可控地访问外部资源（文件系统、API、数据库），而不需要为每个工具写自定义集成代码。

## 三方角色

```
┌─────────────┐                    ┌──────────────┐
│    Host     │  ← MCP Protocol →  │   Server     │
│  (Claude)   │                    │  (Your App)  │
└─────────────┘                    └──────────────┘
     ↑                                       ↑
   启动 Server                        暴露能力
   发送请求                            响应请求
   显示结果                            执行操作
```

| 角色 | 职责 | 示例 |
|------|------|------|
| **Host** | 启动 Server、发送请求、显示结果 | Claude Desktop、VS Code 插件 |
| **Server** | 暴露 tools/resources/prompts，响应请求 | filesystem Server、GitHub Server |
| **Client** | （可选）连接到远程 Server | 浏览器中的 Web 应用 |

## 三大能力原语

### Tools（工具）

Server 可以调用的函数，类似于 API 端点。

**示例**：
- `file_search`: 在文件中搜索文本
- `create_issue`: 在 GitHub 创建 issue
- `execute_sql`: 执行数据库查询

**调用流程**：
```
Host → Server: tools/call { name: "file_search", arguments: { pattern: "TODO" } }
Server → Host: { content: [{ type: "text", text: "Found 5 matches..." }] }
```

### Resources（资源）

Server 暴露的数据源，类似于文件系统或数据库。

**示例**：
- `file:///path/to/file.txt`: 文件内容
- `github://repo/issues`: Issue 列表
- `postgres://localhost/users`: 用户表

**读取流程**：
```
Host → Server: resources/read { uri: "file:///tmp/test.txt" }
Server → Host: { contents: [{ uri: "...", mimeType: "text/plain", text: "..." }] }
```

### Prompts（提示词模板）

预定义的提示词，可以参数化。

**示例**：
- `code_review`: 生成代码审查提示词
- `summarize_doc`: 总结文档

**使用流程**：
```
Host → Server: prompts/get { name: "code_review", arguments: { filePath: "/path/to/file.ts" } }
Server → Host: { messages: [{ role: "user", content: { type: "text", text: "Please review..." } }] }
```

## 传输层

MCP 不绑定特定传输方式，但最常用的是：

### stdio（标准输入/输出）

- **适用场景**：本地应用、CLI 工具
- **优点**：简单、无需网络配置
- **缺点**：只能本地使用

### Streamable HTTP (SSE)

- **适用场景**：Web 应用、远程访问
- **优点**：支持远程调用、可集成到 Web
- **缺点**：需要会话管理、CORS 处理

## 为什么需要 MCP？

**没有 MCP**：
- 每个 AI 应用都要为每个工具写集成代码
- 工具开发者要维护多个 SDK（Claude、ChatGPT、...）
- 没有标准化的安全模型

**有了 MCP**：
- 一次开发，到处运行（Server 可以被任何 Host 使用）
- 标准化的协议和能力协商
- 统一的安全模型（annotations、权限控制）

## 学习路径

1. **本实验（MCP Deep Dive）**：深入理解协议细节
2. **实现 Server**：封装你的工具为 MCP Server
3. **实现 Client**：理解 Host 的工作原理
4. **安全测试**：了解攻击向量和防御策略
