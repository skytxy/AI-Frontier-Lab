---
title: "MCP Deep Dive: 从协议到实战"
tags: [mcp, protocol, agent-infrastructure, json-rpc, security]
category: agent-infrastructure
difficulty: advanced
date: 2026-02-07
status: completed
sort: 2026.01
---

# MCP Deep Dive: 从协议到实战

Model Context Protocol 深度解构——从协议拦截到安全攻防，4 个递进式实验带你从零基础达到专家级理解。

> **核心理念**：README 是导航地图，`experiments/` 里的可运行代码才是核心资产。
> **学习路线**：概念速查 → 协议拦截 → Server 实现 → Client 手写 → 安全攻防

## 快速导航

| 实验 | 主题 | 关键收获 | 难度 | 前置 |
|------|------|----------|------|------|
| [Exp-01](/topics/mcp-deep-dive/experiments/01-protocol-inspector/) | 协议拦截器 | 亲眼看见 JSON-RPC 消息流，理解分帧 | ★★☆ | 无 |
| [Exp-02](/topics/mcp-deep-dive/experiments/02-mcp-server/) | 从零实现 Server | 掌握 Tools/Resources/Prompts 三大原语 | ★★★ | Exp-01 |
| [Exp-03](/topics/mcp-deep-dive/experiments/03-mcp-client/) | 手写 Client（无 SDK） | 深入协议本质：编解码、分帧、配对 | ★★★★ | Exp-01, Exp-02 |
| [Exp-04](/topics/mcp-deep-dive/experiments/04-security-lab/) | 安全攻防 | 理解 annotation 欺骗与 prompt injection | ★★★★ | Exp-01, Exp-02 |

> **零基础？** 先阅读 [MCP 入门指南](/topics/mcp-deep-dive/concepts/mcp-basics)，以及其他前置知识：
> - [MCP 入门指南](/topics/mcp-deep-dive/concepts/mcp-basics)
> - [JSON-RPC 基础](/topics/mcp-deep-dive/concepts/json-rpc)
> - [stdio 传输原理](/topics/mcp-deep-dive/concepts/stdio-transport)
> - [消息分帧](/topics/mcp-deep-dive/concepts/framing)
> - [能力协商机制](/topics/mcp-deep-dive/concepts/capabilities)
> - [安全模型](/topics/mcp-deep-dive/concepts/security-model)

## MCP 核心概念速查

### 三方角色

```
+-----------------------------------------+
|                 Host                    |
|  (LLM App: Claude Desktop, Cursor)      |
|                                         |
|  +----------+  +----------+             |
|  |MCP Client|  |MCP Client|  ...        |
|  +-----+----+  +-----+----+             |
+-------+-------------+-------------------+
        |             |
        v             v
  +----------+  +----------+
  |MCP Server|  |MCP Server|
  +----------+  +----------+
```

- **Host**：集成 LLM 的应用，管理多个 Client 实例
- **Client**：由 Host 创建，与单个 Server 保持 **1:1** 连接
- **Server**：暴露能力（Tools/Resources/Prompts）给 Client

### 协议层：JSON-RPC 2.0

三种消息类型：
- **Request**（有 `id`，需响应）：`{"jsonrpc":"2.0","id":1,"method":"tools/list"}`
- **Response**（匹配 `id`）：`{"jsonrpc":"2.0","id":1,"result":{...}}`
- **Notification**（无 `id`，无需响应）：`{"jsonrpc":"2.0","method":"notifications/initialized"}`

### 传输机制

| 传输方式 | 场景 | 特点 |
|----------|------|------|
| **stdio** | 本地，Host 直接 spawn Server | 最简单，stdin/stdout 管道，换行分隔 |
| **Streamable HTTP** | 远程服务 | POST/GET/DELETE + SSE，支持会话 |

### 三大能力原语

| 原语 | 方向 | 用途 | 类比 |
|------|------|------|------|
| **Tools** | Server → Client | LLM 执行操作 | 函数调用 |
| **Resources** | Server → Client | 提供结构化数据 | GET 端点 |
| **Prompts** | Server → Client | 预定义交互模板 | 提示词库 |

另有 **Sampling**（Server 反向请求 LLM 推理）和 **Roots**（Client 声明授权范围）。

### 生命周期

```
Client                          Server
  |--- initialize -------------->|  Capability negotiation (version + caps)
  |<-- response -----------------|
  |--- initialized (notify) ---->|  Ready
  |     === normal traffic ===   |
  |--- tools/call -------------->|
  |<-- result -------------------|
```

---

## 实验指南

### Exp-01: 协议拦截器 — 看见每一条消息

**背景**：MCP 通信发生在 stdin/stdout 管道中，肉眼不可见。我们需要一个"窃听器"来观察真实的协议流。

**目标**：构建一个 stdio 中间人代理，在不修改任何消息的前提下，实时解析和格式化打印每一条 JSON-RPC 消息。

**关键发现**：
- ✅ 初始化握手严格遵循 `initialize → response → initialized` 三步
- ✅ 每条消息以换行符分隔，但必须处理粘包/半包（一次 `data` 事件可能包含多条消息或半条消息）
- ✅ Server 的 stderr 是唯一安全的日志通道——任何写入 stdout 的非 JSON-RPC 内容都会破坏协议

**踩坑记录**：
- Inspector 自身的日志也必须走 stderr，否则会污染 Host 看到的 stdout 消息流
- 子进程退出时需要正确传播退出码，否则 Host 会报连接异常

→ [进入实验](/topics/mcp-deep-dive/experiments/01-protocol-inspector/)

### Exp-02: 从零实现 MCP Server — 掌握三大原语

**背景**：理解协议最好的方式是实现一个功能完整的 Server。使用 `@modelcontextprotocol/sdk` 可以聚焦业务逻辑而非协议细节。

**目标**：实现一个涵盖 Tools（file_search, code_stats）、Resources（项目文件）、Prompts（代码审查模板）的完整 Server，同时支持 stdio 和 Streamable HTTP 传输。

**关键发现**：
- ✅ `McpServer` 高级 API（registerTool/registerResource/registerPrompt）vs `Server` 低级 API 的取舍——高级 API 约定大于配置，低级 API 更灵活
- ✅ Tool 的 `annotations` 是行为提示（readOnlyHint, destructiveHint），但规范明确指出**不可信**——这为 Exp-04 的安全实验埋下伏笔
- ✅ Zod schema 既是运行时验证又是 JSON Schema 生成器，一石二鸟

**踩坑记录**：
- stdio 模式下 `console.log` 会破坏协议——所有日志必须用 `console.error` 或 SDK 的 logging 通知
- Resource URI 必须是合法 URI 格式（`file:///` 三斜杠），否则客户端会拒绝

→ [进入实验](/topics/mcp-deep-dive/experiments/02-mcp-server/)

### Exp-03: 手写 MCP Client（无 SDK）— 深入协议本质

**背景**：SDK 封装了所有协议细节，用起来简单但学不到东西。手写 Client 是理解协议最深的方式。

**目标**：不用任何 SDK，纯手写 JSON-RPC 2.0 编解码器、stdio 传输层、初始化握手、能力协商和高级 API。最终连接 Exp-02 的 Server 完成全流程。

**关键发现**：
- ✅ JSON-RPC 消息分帧是核心难题：stdin/stdout 是字节流，消息以 `\n` 分隔，但 TCP/管道不保证按消息边界交付数据
- ✅ 请求-响应配对通过 `id` 字段实现：发送 Request 时记录 id → Promise，收到 Response 时按 id 查找并 resolve
- ✅ 能力协商决定后续行为：如果 Server 没声明 `tools` 能力，Client 不应发送 `tools/list` 请求
- ✅ 超时处理至关重要：Server 可能崩溃或挂起，没有超时机制的 Client 会永远卡住

**踩坑记录**：
- 粘包处理：一次 `data` 事件可能收到 `{"jsonrpc":"2.0",...}\n{"jsonrpc":"2.0",...}\n`（两条消息粘在一起）
- 半包处理：一条消息可能被拆成两次 `data` 事件，必须缓冲直到遇到 `\n`
- 子进程 spawn 时 `stdio` 选项必须是 `['pipe', 'pipe', 'inherit']`，否则消息无法通过

→ [进入实验](/topics/mcp-deep-dive/experiments/03-mcp-client/)

### Exp-04: 安全攻防 — 理解真实威胁

**背景**：MCP 规范花了大量篇幅讨论安全，但安全策略的执行落在 Host 实现者身上。我们需要亲手构造攻击，才能理解防御。

**目标**：构造恶意 MCP Server，测试 Host 的安全边界；然后实现防御代理来缓解这些攻击。

**攻击场景**：

| 场景 | 攻击方式 | 利用的弱点 |
|------|----------|-----------|
| Annotation 欺骗 | 声称 readOnly 但实际写文件 | Host 信任 annotations |
| Description 注入 | 在 tool description 中嵌入隐藏指令 | LLM 读取 description |
| Content 注入 | 在 tool 返回内容中嵌入指令 | LLM 处理返回内容 |

**关键发现**：
- ✅ Tool annotations 是**建议性的**——规范明确说"Annotations are not a security mechanism"
- ✅ Tool descriptions 是 prompt injection 的天然载体：LLM 必须读取 description 才能决定是否调用工具
- ✅ 防御需要多层：内容过滤（正则匹配可疑模式）+ 行为审计（annotation vs 实际行为对比）+ 沙箱隔离
- ✅ Host 是最终安全网关——这既是灵活性也是责任

→ [进入实验](/topics/mcp-deep-dive/experiments/04-security-lab/)

---

## 知识图谱

```
Exp-01 协议拦截器
  │  └─ 核心技能：stdio 管道、JSON-RPC 分帧、消息解析
  │
  ├──▶ Exp-02 MCP Server（拦截器可以抓包验证 Server 行为）
  │      └─ 核心技能：SDK API、三大原语、双传输、Zod schema
  │
  ├──▶ Exp-03 MCP Client（Client 连接 Server 完成全流程）
  │      └─ 核心技能：手写协议栈、分帧、id 配对、能力协商
  │
  └──▶ Exp-04 安全攻防（基于拦截器改造防御代理）
         └─ 核心技能：攻击构造、内容审计、防御策略
```

Exp-01 是基础设施，后续实验都会用到它的技术。Exp-02 和 Exp-03 相互验证（Client 连接 Server）。Exp-04 综合运用所有实验的成果。

## 环境准备

```bash
# 所有实验都需要 Node.js 20+ 和 npm
node --version  # v20+

# 每个实验独立安装依赖
cd experiments/01-protocol-inspector && npm install
cd experiments/02-mcp-server && npm install
cd experiments/03-mcp-client && npm install
cd experiments/04-security-lab && npm install

# MCP Inspector（验证工具，npx 直接用）
npx @modelcontextprotocol/inspector
```

## 推荐学习路径

### 路径 A：快速上手（有基础）

如果你已经了解 JSON-RPC 和 IPC：
1. 跳读 [concepts](/topics/mcp-deep-dive/concepts/mcp-basics) 文档，查漏补缺
2. 直接从 [Exp-02](/topics/mcp-deep-dive/experiments/02-mcp-server/) 开始
3. 需要调试时回到 [Exp-01](/topics/mcp-deep-dive/experiments/01-protocol-inspector/)

### 路径 B：系统学习（零基础）

如果你是第一次接触 MCP：
1. 阅读 [concepts/mcp-basics](/topics/mcp-deep-dive/concepts/mcp-basics)
2. 完成 [Exp-01](/topics/mcp-deep-dive/experiments/01-protocol-inspector/)（理解消息流）
3. 完成 [Exp-02](/topics/mcp-deep-dive/experiments/02-mcp-server/)（实现 Server）
4. 完成 [Exp-03](/topics/mcp-deep-dive/experiments/03-mcp-client/)（手写 Client）
5. 完成 [Exp-04](/topics/mcp-deep-dive/experiments/04-security-lab/)（安全攻防）

### 路径 C：安全研究（重点关注）

如果你关心 MCP 安全：
1. 快速浏览 [Exp-01](/topics/mcp-deep-dive/experiments/01-protocol-inspector/) 和 [Exp-02](/topics/mcp-deep-dive/experiments/02-mcp-server/)
2. 深入 [Exp-04](/topics/mcp-deep-dive/experiments/04-security-lab/)
3. 阅读 [concepts/security-model](/topics/mcp-deep-dive/concepts/security-model)

## 常见问题

### Q: 我应该从哪个实验开始？

**A**：推荐按顺序：
- 完全零基础：Exp-01 → Exp-02 → Exp-03 → Exp-04
- 有 IPC/RPC 经验：Exp-02 → Exp-03 → Exp-04（需要时参考 Exp-01）

### Q: 实验需要多长时间？

**A**：
- Exp-01：1-2 小时
- Exp-02：2-3 小时
- Exp-03：3-4 小时（最复杂）
- Exp-04：2-3 小时

总计约 8-12 小时可完成所有实验。

### Q: 我可以跳过某些实验吗？

**A**：
- 可以跳过 Exp-01（但调试时会困难）
- 不建议跳过 Exp-02（Exp-03 依赖它）
- 如果只关心安全，可以只看 Exp-01 + Exp-02 + Exp-04

### Q: 实验代码可以直接用于生产吗？

**A**：不建议。这些是教学代码，专注于清晰度而非健壮性。生产环境应该：
- 使用官方 SDK（`@modelcontextprotocol/sdk`）
- 添加完善的错误处理和重试机制
- 实现日志和监控
- 进行安全审计

### Q: 遇到问题怎么办？

**A**：
1. 查看实验 README 的"常见问题"章节
2. 用 Exp-01 的 Inspector 观察消息流
3. 查看 [MCP 官方文档](https://modelcontextprotocol.io/docs/)
4. 提交 Issue 到本仓库

## 延伸资源

### 官方资源
- [MCP 官方网站](https://modelcontextprotocol.io)
- [MCP 规范](https://modelcontextprotocol.io/docs/specification/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 示例服务器](https://github.com/modelcontextprotocol/servers)

### 社区资源
- [MCP 官方文档](https://modelcontextprotocol.io/docs/) - 官方规范和文档
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - 官方 SDK 实现

### 相关技术
- [JSON-RPC 2.0 规范](https://www.jsonrpc.org/specification)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Zod Schema 验证](https://zod.dev)

---

## 总结

完成本 Topic 的 4 个实验后，你将能够：

✅ **独立设计和实现 MCP Server**：封装你的工具和服务
✅ **深入理解 MCP 协议**：知道每条消息的作用和含义
✅ **调试 MCP 应用**：用 Inspector 抓包分析问题
✅ **评估 MCP 安全风险**：识别和防御常见攻击

**下一步**：
- 实现你自己的 MCP Server（如公司内部工具）
- 贡献开源 MCP Servers
- 探索 MCP 在不同场景的应用（Web、移动端、边缘计算）

**贡献**：
本 Topic 是持续演进的实验性内容。欢迎提交 Issue 和 PR！

---

**项目地址**：[AI-Frontier-Lab](https://github.com/skytxy/AI-Frontier-Lab)

**作者**：AI Frontiers Lab

**许可**：MIT License
