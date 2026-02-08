# Chapter Content Validator Skill - 完整设计理念

> **版本**: 1.0.0
> **日期**: 2026-02-08
> **状态**: 设计阶段

---

## 一、核心哲学

> **"授人以渔，而非授人以鱼"**

这个 Skill 的本质不是「检查文档」或「生成内容」，而是：

- **让学习者真正掌握知识** — 通过验证零基础学习者能否完成实战场景
- **从经验中持续进化** — 每次执行都让 Skill 变得更聪明
- **质量优先于速度** — 宁可多迭代，也不产出内容堆砌
- **真实体验模拟** — Learner 通过网页访问内容，模拟真实用户

---

## 二、通用性设计

### 2.1 Skill 是独立工具，不是项目脚本

```
Skill (.claude/skills/chapter-content-validator/)
├── 经验库: 学习什么场景用什么协作方式
├── 执行引擎: 协调 Agent 完成验证/生成
└── 反馈循环: 从结果中学习，持续优化

不包含任何项目特定配置
```

### 2.2 三层架构，职责明确

```
+---------------------------------------------------------------+
|              Paradigm (项目层方法论)                          |
|    docs/frameworks/chapter-validation-paradigm.md              |
|                                                               |
|  定义:                                                        |
|  - 什么是章节验证、为什么需要                                |
|  - 章节依赖关系（Algo: foundations → cnn/transformer → 论文）  |
|  - 质量标准、通用流程                                          |
|  - 网站验证隔离约定（端口分配、构建目录）                      |
|  - 不涉及: 具体协作模式、技术实现                              |
+---------------------------------------------------------------+
                           |
                           v
+---------------------------------------------------------------+
|                   Skill (通用协作引擎)                        |
|    .claude/skills/chapter-content-validator/                   |
|                                                               |
|  能力:                                                        |
|  - 经验库: 场景特征 → 协作模式的映射                           |
|  - 模式匹配: 分析场景，推荐最优协作方式                        |
|  - 执行引擎: 根据模式 + 平台能力协调 Agent                     |
|  - 反馈学习: 记录结果，更新经验库                              |
|  - 依赖解析: 读取 Paradigm，决定执行顺序                       |
|  - 网页验证: 利用 frontend-design 验证渲染效果                  |
|                                                               |
|  不涉及: 项目结构、章节目录、具体内容                          |
+---------------------------------------------------------------+
                           |
                           v
+---------------------------------------------------------------+
|           Chapter Config (可选，按需创建)                     |
|    .chapter-validation/config.yaml 或章节目录下的配置          |
|                                                               |
|  定义:                                                        |
|  - 章节类型 (academic_paper / technical_guide / ...)         |
|  - 特殊需求 (数学验证、外链检查等)                             |
|  - 覆盖默认协作模式                                            |
+---------------------------------------------------------------+
```

---

## 三、三种工作模式

| 模式 | 输入 | 输出 | 典型场景 |
|------|------|------|----------|
| **验证模式** | 现有文档 | 缺口报告 + 修复 | 作者写完检查质量 |
| **生成模式** | 论文/主题 | 完整教程 | 批量处理新论文 |
| **优化模式** | 文档 + 新需求 | 改进版本 | 定期更新内容 |

---

## 四、经验驱动的协作模式选择

### 4.1 核心机制

```
场景描述 → 特征提取 → 经验库匹配 → 模式推荐 → 执行 → 反馈学习
    ↑                                                            ↓
    └──────────────────────────────────────┘
                  持续进化
```

### 4.2 经验库结构

```yaml
# experience.yaml
patterns:
  - id: academic-paper-high-complexity
    signature:
      content_type: academic_paper
      complexity: high
      keywords: [论文, 复现, 数学, 公式]
    recommended_mode: triple-agent  # Learner + Author + Reviewer
    stats:
      success_rate: 0.9
      usage_count: 3
    feedback:
      - iteration: 1
        success: true
        notes: "Reviewer 发现了数学公式推导的错误"
```

### 4.3 Brainstorming 时的智能建议

```
用户: "我需要验证 attention-is-all-you-need 论文"
      ↓
Skill 分析:
  - content_type: academic_paper
  - complexity: high
  - 有数学推导需求
      ↓
Skill 建议:
  "根据经验库（3 次成功，成功率 90%），这类场景推荐 triple-agent 模式
   Reviewer 可以验证数学公式和论文一致性

   采用 triple-agent？[默认: dual-agent，输入 custom 自定义]"
```

---

## 五、质量保证机制

### 5.1 质量优先原则

```
生成 → 验证 → 不通过？ → 重新生成 → 再验证 → ... → 通过
```

**核心**：Learner 必须能完成场景，否则继续迭代

### 5.2 分层验证机制

#### 开发阶段（内容验证）

```typescript
// Learner 直接读取 Markdown 源文件
const content = await readFile('concepts/self-attention.md');

// 验证:
// - 概念是否清晰
// - 步骤是否完整
// - 逻辑是否连贯
```

#### 发布前（渲染验证）

```typescript
// 1. 构建网站
await buildSite();

// 2. Learner 访问网页
const html = await readBuiltHTML('algo/attention/self-attention/index.html');

// 3. 利用 frontend-design Skill 验证
await validateWithFrontendDesign(html, {
  checkContrast: true,
  checkThemeSwitch: true,
  checkResponsive: true
});
```

### 5.3 知识依赖保障

```
foundation 章节 → CNN 章节
      ↓                    ↓
   必须先完成          作为前置知识可访问
                      Learner 验证时可读取
```

Skill 读取 Paradigm.md 的依赖图，自动处理执行顺序

### 5.4 外链有效性验证

```typescript
// 文档中的外链 → HTTP 状态检测
for (const link of extractLinks(document)) {
  const status = await fetch(link.href).status;
  if (status === 404) {
    reportIssue(`失效链接: ${link.href}`);
  }
}
```

---

## 六、并行与依赖处理

### 6.1 依赖关系定义（Paradigm 层）

```markdown
## Algo 领域依赖图

foundations/
├── gradient-descent/     # 基础
├── backpropagation/      # 依赖: gradient-descent
└── optimization/

cnn/
├── lenet/                # 依赖: foundations/*
└── resnet/              # 依赖: foundations/*, lenet

transformer/
├── original/             # 依赖: foundations/*
└── attention/
    ├── self-attention/   # 依赖: foundations/*
    └── attention-is-all-you-need/  # 依赖: self-attention
```

### 6.2 Skill 的依赖处理

```typescript
// 1. 读取 Paradigm.md 解析依赖图
const dependencyGraph = await parseParadigmDependencies();

// 2. 检查依赖章节是否完成
const completed = await checkCompletedChapters();

// 3. 决定执行顺序
const executionPlan = topologicalSort(dependencyGraph, completed);

// 4. 并行执行独立章节
for (const batch of executionPlan.parallelBatches) {
  await executeInParallel(batch, {
    isolation: 'git-worktree',  // 或 'port-isolation'
    coordination: 'messaging'    // Agent Teams 消息机制
  });
}
```

### 6.3 网站验证隔离约定

```markdown
## 端口分配

| 用途 | 端口 | 说明 |
|------|------|------|
| 开发服务器 | 3000 | `npm run dev` 默认 |
| 验证服务器 1 | 3001 | Learner 验证使用 |
| 验证服务器 2 | 3002 | Reviewer 验证使用 |
| ... | ... | 按需分配 |

## 构建目录隔离

```
site/           # 开发环境
site.build/     # 验证构建输出
site.dist/      # 生产构建输出
```
```

---

## 七、版本兼容性设计

### 7.1 配置集中化

```
.chapter-validation/
└── config.yaml          # 唯一的配置入口

章节目录保持干净，无配置文件散落
```

### 7.2 Schema + 默认值

```typescript
// Skill 内置完整 Schema，所有字段可选
interface ChapterConfig {
  sections?: string[];
  collaboration_mode?: CollaborationMode;
  // ...所有字段都有默认值
}

// 用户只需覆盖想自定义的部分
```

### 7.3 升级策略

| 层级 | 升级影响 | 处理方式 |
|------|----------|----------|
| Skill | 新增字段/功能 | 默认值保证兼容 |
| 项目配置 | 新增可选配置 | 按需更新 |
| 章节配置 | 大多数情况不变 | 无需操作 |

---

## 八、跨平台适配

### 8.1 平台能力检测

```yaml
platform_capabilities:
  claude-code:
    supports_agent_teams: true
    supports_parallel: true
    supports_messaging: true
  other:
    supports_agent_teams: false
    fallback: "sequential"  # 降级为串行模拟
```

### 8.2 优雅降级

```
Claude Code (Agent Teams) → 并行执行，消息协调
其他平台 (SubAgent)       → 串行模拟，功能不变
```

---

## 九、反哺循环：从每次执行中学习

### 9.1 记录的内容

```yaml
# execution-log.yaml
executions:
  - timestamp: 2026-02-08T10:30:00Z
    scenario: "验证 attention-is-all-you-need"
    mode_used: triple-agent
    success: true
    iterations: 3
    gaps_resolved: 5
    duration_minutes: 25

    feedback:
      learner: "数学推导部分一开始不理解"
      author: "补充了公式推导步骤"
      reviewer: "发现并修正了一个符号错误"

    lessons_learned:
      - "数学类论文需要 Reviewer 验证"
      - "公式推导需要逐步展开"
```

### 9.2 学习的内容

- 哪种场景用什么模式成功率最高
- 哪些内容类型容易出问题
- 如何优化迭代次数
- 如何估算执行时间

### 9.3 持续优化机制

```typescript
// 每次执行后
async recordExecution(result: ExecutionResult) {
  // 1. 记录到经验库
  await experienceStore.record(result);

  // 2. 更新模式成功率
  await experienceStore.updateStats(result.mode, result.success);

  // 3. 提取新的模式特征
  const newPattern = await extractPattern(result);
  if (newPattern) {
    await experienceStore.addPattern(newPattern);
  }

  // 4. 生成改进建议
  const suggestions = await generateImprovements(result);
  return suggestions;
}
```

---

## 十、设计原则总结

| 原则 | 说明 |
|------|------|
| **通用性** | Skill 不绑定项目结构，适用于任何内容验证场景 |
| **质量优先** | Learner 必须能学会，否则继续迭代 |
| **经验驱动** | 从历史执行中学习，持续优化 |
| **职责清晰** | Paradigm 定方法，Skill 定执行，Config 定差异 |
| **向前兼容** | 版本升级不破坏现有配置 |
| **跨平台** | 根据平台能力自动适配 |
| **尊重依赖** | 知识有先后，顺序不能乱 |
| **真实模拟** | Learner 通过网页访问，模拟真实用户体验 |
| **并行友好** | 支持多章节并行验证，隔离机制避免冲突 |
| **持续进化** | 每次执行都让 Skill 变得更聪明 |

---

## 附录：协作模式定义

```yaml
collaboration_modes:
  single-agent:
    name: "单 Agent 自检"
    agents: [validator]
    use_case: "简单验证场景"

  dual-agent:
    name: "双 Agent 协作"
    agents: [learner, author]
    use_case: "通用内容验证"

  triple-agent:
    name: "三 Agent 审查"
    agents: [learner, author, reviewer]
    use_case: "论文复现、数学验证"

  parallel-agents:
    name: "多 Agent 并行"
    agents: [learner1, learner2, ..., author]
    use_case: "多个独立场景同时验证"
```

---

**下一步**: 将此设计文档提交到 git，然后开始实现。
