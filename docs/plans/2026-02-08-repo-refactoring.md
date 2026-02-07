# AI-Frontier-Lab 重构架构设计

> **日期**: 2026-02-08
> **状态**: 设计阶段
> **目标**: 将项目拆分为 Agent 和 Algo 两个方向，支持技术演进图谱

---

## 1. 背景

现有 AI-Frontier-Lab 聚焦于 Agent 相关技术（MCP、Agent Workflows、LSP 等）。随着探索深入，需要引入 **Algo 方向**（深度学习、强化学习、LLM、SORA 等），并建立清晰的技术演进关系图谱。

**核心需求**：
1. 将项目拆分为 `agent/` 和 `algo/` 两个顶级目录
2. Algo 方向需要支持**论文解读 → 系统实现 → 应用落地**的学习闭环
3. 建立技术演进关系图谱，清晰展示 CNN、Transformer、Attention 等技术的演进脉络
4. 支持跨领域技术（如 Attention）的独立表达
5. 展示站点统一，条件加载重型组件（KaTeX、D3.js）

---

## 2. 目录结构

```
AI-Frontier-Lab/
├── agent/                    # Agent 方向（现有项目本体）
│   ├── _template/            # Agent Topic 模板
│   ├── agent-001-mcp-deep-dive/
│   ├── agent-002-agent-workflows/
│   ├── agent-003-lsp-enhancement/
│   └── agent-004-hooks/
│
├── algo/                     # Algo 方向（新增）
│   ├── foundations/          # 通用基础知识
│   │   ├── gradient-descent/
│   ├── backpropagation/
│   │   └── optimization/
│   │
│   ├── cnn/                 # 大领域目录
│   │   ├── lenet/
│   │   ├── alexnet/
│   │   ├── vgg/
│   │   ├── resnet/
│   │   └── repvgg/
│   │
│   ├── transformer/         # 大领域目录
│   │   ├── original/
│   │   ├── encoder/
│   │   └── decoder/
│   │
│   ├── rl/                  # 大领域目录
│   │   ├── dqn/
│   │   ├── policy-gradient/
│   │   └── ppo/
│   │
│   ├── attention/           # 跨领域技术（独立目录）
│   │   ├── bahdanau/
│   │   ├── self-attention/
│   │   └── efficient/
│   │
│   ├── diffusion/           # 跨领域技术（独立目录）
│   │   ├── ddpm/
│   │   ├── stable-diffusion/
│   │   └── diffusion-lm/
│   │
│   └── _template/           # Algo Topic 模板
│
├── shared/                   # 按功能分组的共享资源
│   └── scripts/
│       ├── training/        # 训练相关脚本
│       ├── mcp/             # MCP 相关
│       ├── lint/            # 质量检查
│       └── utils/           # 通用工具
│
├── site/                     # 统一展示站点
│   ├── src/
│   │   ├── collections/     # Astro collections: agent, algo
│   │   ├── pages/           # 路由页面
│   │   ├── components/
│   │   │   ├── graph/       # D3.js 关系图谱组件
│   │   │   ├── katex/       # KaTeX 公式渲染
│   │   │   └── ...
│   │   └── content/
│   └── package.json
│
├── docs/
│   ├── plans/               # 设计文档
│   │   └── 2026-02-08-repo-refactoring.md
│   └── evolution/           # 技术演进图谱数据
│       ├── attention.yaml
│       ├── cnn.yaml
│       ├── transformer.yaml
│       └── ...
│
├── .agents/                  # Agent 配置
├── shared/scripts/
│   ├── new-agent-topic.sh  # 创建 Agent Topic
│   └── new-algo-topic.sh    # 创建 Algo Topic
│
└── [现有文件: README.md, LICENSE, .gitignore, etc.]
```

---

## 3. Topic 命名与组织

### 3.1 Agent Topic

- **目录结构**: `agent/agent-001-xxx/`
- **命名格式**: `agent-{编号}-{简短名称}`
- **编号规则**: 从 001 开始，全局递增

### 3.2 Algo Topic

- **目录结构**: 按领域组织，领域内按技术名称
  - 大领域: `algo/cnn/`, `algo/transformer/`, `algo/rl/`
  - 跨领域技术: `algo/attention/`, `algo/diffusion/`
  - 具体技术: `algo/cnn/resnet/`, `algo/transformer/original/`

- **命名规则**: 目录名使用技术简称（小写、连字符），不用编号
  - ✅ `algo/cnn/resnet/`
  - ✅ `algo/attention/self-attention/`
  - ❌ `algo/cnn/004-resnet/`

---

## 4. Frontmatter 契约

### 4.1 通用字段（Agent 和 Algo 共用）

```yaml
---
title: "主题标题"
tags: [tag1, tag2, tag3]
category: category-name
difficulty: beginner | intermediate | advanced
date: YYYY-MM-DD
status: draft | in-progress | published
sort: 2015.5  # 排序字段（默认为年份，可手动调整为小数）
---
```

### 4.2 Algo 专用字段（可选）

```yaml
---
# 论文相关（如有）
paper_title: "Attention Is All You Need"
paper_arxiv: "1706.03762"
paper_year: 2017

# 技术类型
type: "classic" | "survey" | "implementation" | "application"

# 前置知识（可链接到 foundations 或其他 algo topic）
prerequisites:
  - "algo/foundations/backprop"
  - "algo/attention/self-attention"

# 关联论文（多对多关系）
papers:
  - id: "bahdanau-2014"
    role: "predecessor"
  - id: "luong-2015"
    role: "improvement"
---
```

### 4.3 排序机制

- **默认排序**: 使用 `date` 字段的年份
- **手动调整**: 通过 `sort` 字段微调
  - `sort: 2015.5` - 2015 年的第 5 篇
  - `sort: 2015.33` - 插入到 2015.3 和 2015.4 之间
- **站点行为**: 优先使用 `sort`，不存在时使用 `date`

---

## 5. Topic 内容结构（Algo）

```markdown
---
# frontmatter
---

## Prerequisites

必要的前置知识 → 链接到 `algo/foundations/` 或其他 Algo Topic

## [论文/技术概述]

### 核心问题
这项技术要解决什么问题？为什么重要？

### 关键设计
最重要的设计决策是什么？

## 数学原理

### 核心公式
[关键公式及其解释]

### 直观理解
用通俗语言解释数学背后的直觉

## 系统实现

### 架构设计
从 C++ 系统工程师的视角，如何组织代码？

### 关键算子
需要实现哪些核心算子？性能优化点在哪里？

### 代码结构
```
code/
├── core/          # 核心实现
├── ops/           # 自定义算子
└── benchmarks/    # 性能测试
```

## 应用与落地

### 典型应用场景
这个技术在实际中怎么用？

### 相关产品/论文
还有哪些相关工作？

## Experiments
[复现代码、实验记录]
```

---

## 6. 双向关联数据结构

Topic 和论文是多对多关系，通过 YAML 配置表达：

```yaml
# docs/evolution/attention.yaml

# Topic 定义
topics:
  - id: attention-001-seq2seq
    title: "Seq2Seq with Attention"
    category: "attention"
    papers: [bahdanau-2014, luong-2015]

  - id: attention-002-self
    title: "Self-Attention"
    category: "transformer"
    papers: [self-attention-2017]
    also_discussed_in: [transformer-001-original]  # 跨领域关联

# 论文定义
papers:
  - id: bahdanau-2014
    title: "Neural Machine Translation by Jointly Learning to Align and Translate"
    year: 2014
    arxiv: "1409.0473"
    topics: [attention-001-seq2seq]
    innovation: "引入注意力机制解决序列对齐问题"

  - id: self-attention-2017
    title: "Attention Is All You Need"
    year: 2017
    arxiv: "1706.03762"
    topics: [attention-002-self, transformer-001-original]
    innovation: "Self-Attention 替代 RNN，并行化训练"

# 关系定义
relations:
  - from: bahdanau-2014
    to: self-attention-2017
    type: "evolution"
    description: "从 Additive 到 Scaled Dot-Product"

  - from: self-attention-2017
    to: vit-2020
    type: "cross_domain"
    category: "cv_application"
    description: "Self-Attention 应用于计算机视觉"
```

---

## 7. 关系图谱设计

### 7.1 图谱类型

**全局图谱** (`/graph` 页面):
- 展示所有技术领域的演进关系
- 支持缩放、筛选、时间轴视图

**局部图谱** (每个 Topic 页面底部):
- 显示与当前 Topic 直接相关的节点
- 突出显示演进链和跨域关系

### 7.2 关系类型

| 类型 | 说明 | 视觉表达 |
|------|------|----------|
| `evolution` | 技术演进 | 实线箭头 |
| `improvement` | 改进优化 | 虚线箭头 |
| `cross_domain` | 跨域应用 | 点线箭头 |
| `combination` | 技术组合 | 双向箭头 |
| `contrast` | 对比研究 | 双虚线 |
| `dependency` | 依赖关系 | 虚线 |

### 7.3 数据格式

```yaml
# docs/evolution/[domain].yaml
meta:
  title: "Attention Mechanism"
  description: "从 Seq2Seq 到 Self-Attention 的演进"
  color: "#e94560"  # 可视化用颜色

timeline:
  - year: 2014
    event: "Bahdanau Attention 提出"
  - year: 2015
    event: "Luong Attention"
  - year: 2017
    event: "Self-Attention (Transformer)"

nodes: [...]
edges: [...]
```

### 7.4 渲染技术

- **图表库**: D3.js (Force Layout, Timeline, Sankey)
- **公式渲染**: KaTeX (条件加载，仅在 Algo 页面)
- **交互**: Zoom、Pan、Tooltip、Filter by domain/year

---

## 8. 展示站点架构

### 8.1 Astro Collections

```typescript
// astro.config.mjs
export const collections = ['agent', 'algo'];
```

```typescript
// src/content/config.ts
import { defineCollection } from 'astro:content';

export const agent = defineCollection({
  loader: glob({ pattern: 'agent/agent-*/**/*.md' }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    date: z.date(),
    status: z.enum(['draft', 'in-progress', 'published']),
    sort: z.number().optional(),
  }),
});

export const algo = defineCollection({
  loader: glob({ pattern: 'algo/**/*.md' }),
  schema: z.object({
    // 通用字段（同 agent）
    title: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    date: z.date(),
    status: z.enum(['draft', 'in-progress', 'published']),
    sort: z.number().optional(),

    // Algo 专用字段（可选）
    paper_title: z.string().optional(),
    paper_arxiv: z.string().optional(),
    paper_year: z.number().optional(),
    type: z.enum(['classic', 'survey', 'implementation', 'application']).optional(),
    prerequisites: z.array(z.string()).optional(),
    papers: z.array(z.string()).optional(),
  }),
});
```

### 8.2 页面结构

```
site/src/
├── pages/
│   ├── index.astro              # 首页（All/Agent/Algo 视图切换）
│   ├── graph.astro              # 全局关系图谱页
│   ├── agent/
│   │   └── [id].astro           # Agent Topic 页面
│   └── algo/
│       └── [...slug].astro     # Algo Topic 页面（支持多级路径）
├── components/
│   ├── TopicCard.astro
│   ├── GraphView.tsx           # D3.js 关系图谱
│   ├── KaTeXRenderer.astro     # 条件加载 KaTeX
│   └── LocalGraph.astro        # 局部关系图谱
└── lib/
    ├── graph-parser.ts         # 解析 evolution YAML
    └── graph-layout.ts         # D3.js 布局算法
```

### 8.3 条件加载策略

```typescript
// 仅在 Algo 页面加载重型组件
import KaTeXRenderer from '~/components/KaTeXRenderer.astro';

const { currentCollection } = Astro.props;
const isAlgo = currentCollection === 'algo';

{isAlgo && <KaTeXRenderer />}
```

---

## 9. Git Worktree 工作流

### 9.1 阶段一：初期（当前状态）

创建两个 worktree：
```bash
git worktree add worktrees/agent feature/agent-refactor
git worktree add worktrees/algo feature/algo-init
```

### 9.2 阶段二：稳定后

按 Topic 创建 worktree：
```bash
git worktree add worktrees/agent-001-mcp
git worktree add worktrees/algo-001-transformer
```

---

## 10. 迁移计划

### 10.1 目录迁移

```bash
# 创建新目录
mkdir -p agent algo

# 迁移现有 topics
mv topics/agent-* agent/
mv topics/004-hooks agent/agent-004-hooks

# 移除空的 topics 目录
rmdir topics
```

### 10.2 脚本更新

**新建脚本**:
- `shared/scripts/new-agent-topic.sh` - 创建 Agent Topic
- `shared/scripts/new-algo-topic.sh` - 创建 Algo Topic

**更新脚本**:
- `shared/scripts/new-topic.sh` → 废弃，提示使用新脚本

### 10.3 站点更新

- 更新 Astro collections 配置
- 添加 D3.js、KaTeX 依赖
- 实现关系图谱组件
- 更新路由和页面模板

---

## 11. 自动化发现与审批流程设计

### 11.1 设计目标

**核心问题**：避免"后知后觉"——建立自动化论文发现机制，确保里程碑技术能及时纳入，同时保持内容质量门槛。

**参考模型**：C++ 标准提案通过 Pull Request 维护和更新

### 11.2 工作流程

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  自动发现脚本    │ -> │   候选推荐      │ -> │   用户决策      │
│ (discover-papers)│    │ (candidates/)    │    │ (创建/忽略)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       v
                                              ┌─────────────────┐
                                              │   创建提案      │
                                              │ (proposals/)    │
                                              └─────────────────┘
                                                       │
                                                       v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   自动执行      │ <- │   提案接受      │ <- │   审核评审      │
│(promote-proposal)│    │ (status:accepted)│    │(review-comments)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 11.3 自动发现机制

**脚本**: `shared/scripts/papers/discover-papers.sh`

**信号源**：
- arXiv API（每日扫描 cs.AI, cs.LG, cs.CL）
- Hugging Face Trending Models
- Paper Digest（高质量推荐）

**候选输出**: `docs/candidates/YYYY-MM-DD-candidates.md`

```markdown
---
date: 2026-02-08
scanner: "auto-discover-v1"
---

# 候选论文推荐

## 📊 高置信度候选

### [1] FlashAttention-3
- **arXiv**: 2025.xxxxx
- **来源**: Hugging Face Trending
- **信号强度**: ⭐⭐⭐⭐⭐
- **理由**：
  - 引用激增（2周内100+）
  - 多个实现仓库破1k stars
  - 知名团队（Tri Dao et al.）

### [2] ...

## 🤔 中等置信度候选
...

## 📋 低置信度候选（仅供参考）
...
```

**运行频率**：
- 手动触发：`bash shared/scripts/papers/discover-papers.sh`
- CI 定时任务：每周一次（可选）

### 11.4 提案格式

**目录**: `docs/proposals/`

**命名**: `PROPO-YYYY-NNN-title.md`（NNN 为当年序号）

**模板**: `docs/proposals/_template.md`

```markdown
---
proposal_id: PROPO-2025-001
title: "纳入 Self-Attention 作为独立 Algo Topic"
type: "new_topic" | "major_update" | "cross_domain"
status: "open" | "under_review" | "accepted" | "rejected" | "withdrawn"
created: 2025-02-08
author: "skytxy"

# 论文信息
paper:
  title: "Attention Is All You Need"
  arxiv: "1706.03762"
  year: 2017
  venue: "NeurIPS 2017"
  citations: 50000+  # 从 Google Scholar 获取

# 目标目录
directory: "algo/attention/self-attention/"
sort: 2017.5  # 手动排序值

# 动机说明（为什么这篇论文重要？）
motivation: |
  Self-Attention 开创了 Transformer 架构，彻底改变了 NLP 和 CV 领域。
  它是理解现代 LLM 的必修内容，且已跨域应用到计算机视觉（ViT）。

# 关联主题
related_topics:
  - "algo/foundations/attention-intro"
  - "algo/transformer/original"

# 计划实现的实验
experiments:
  - "Self-Attention 机制解析（数学+图解）"
  - "Multi-head Attention 实现与可视化"
  - "与 Bahdanau Attention 的对比实验"

# 评审检查清单
review_questions:
  - [ ] 该论文是否开创了新范式？
  - [ ] 引用量是否足够高（>1000 且持续增长）？
  - [ ] 是否有跨领域应用？
  - [ ] 是否建立了清晰的认知框架？
  - [ ] 是否有可复现的代码实现？

# 讨论记录
discussion: |
  ## 2025-02-08: 创建提案
  - 初始创建

  ## 2025-02-09: 评审反馈
  - @skytxy: 同意接受，立即执行
---
```

### 11.5 状态转换

```
     open
       │
       v (用户开始审核)
  under_review
       │
       ├─────────────────┐
       │                 │
       v (接受)          v (拒绝)
  accepted          rejected
       │                 │
       v                 │
  (自动执行)            │
       │                 │
       └─────────────────┘
              │
              v (随时)
         withdrawn
```

### 11.6 自动执行脚本

**脚本**: `shared/scripts/papers/promote-proposal.sh PROPO-YYYY-NNN`

**功能**：
1. 验证提案状态为 `accepted`
2. 创建目标目录结构
3. 从提案生成 README.md（frontmatter + 模板内容）
4. 创建实验目录结构
5. 更新 `docs/evolution/` 相关 YAML
6. 创建 git commit
7. 创建 PR（可选）

### 11.7 站点集成

**新路由**: `/proposals` 页面展示所有提案

**功能**：
- 按状态分组（open/under_review/accepted/rejected）
- 支持评论和讨论（GitHub Issues 关联）
- 显示统计信息（本月新增/接受/拒绝）

### 11.8 Git 工作流

```bash
# 1. 发现脚本运行（在 main 分支）
bash shared/scripts/papers/discover-papers.sh
# 生成 docs/candidates/2026-02-08-candidates.md

# 2. 用户创建提案（在 main 分支）
cp docs/proposals/_template.md docs/proposals/PROPO-2026-001-flash-attn.md
# 填写内容，status: "open"

# 3. 提交提案
git add docs/proposals/PROPO-2026-001-flash-attn.md
git commit -m "proposal: add FlashAttention-3 topic"
git push

# 4. 评审（修改 status: "under_review"）
# 可在 GitHub Issues 上讨论

# 5. 接受（修改 status: "accepted"）
git commit --amend  # 或新 commit
git push

# 6. 自动执行
bash shared/scripts/papers/promote-proposal.sh PROPO-2026-001
# 创建 branch: feat/proposals/PROPO-2026-001
# 生成目录结构和内容
# 创建 commit 和 PR
```

### 11.9 质量门槛

**milestone 论文判断标准**：
1. **范式开创性**：是否引入了全新的技术范式？
2. **影响力**：引用量 > 1000 且持续增长（或早期论文>5000）
3. **跨域应用**：是否被多个领域采用？
4. **认知框架**：是否建立了清晰的技术认知框架？
5. **可复现性**：是否有可用的开源实现？

**自动信号**（用于候选推荐）：
- Hugging Face Trending 前10
- arXiv cs.AI/cs.LG/cs.CL 每周高亮
- Paper Digest 高分推荐
- GitHub 实现仓库破1000 stars

**最终决策**：人工审核，系统不自动接受。

---

## 12. 待定事项

- [ ] 确认 foundations/ 的具体内容范围
- [ ] 设计关系图谱的具体交互方式
- [ ] 决定是否需要"精选/Featured"机制
- [ ] 规划 Algo 第一个 Topic 的具体内容
- [ ] 确认是否需要将现有 `topics/` 内容全部迁移到 `agent/` 目录
- [x] 设计自动化发现与审批流程

---

## 13. 相关文档

- [原始架构设计](./2026-02-07-repo-architecture-design.md)
- [能力建设框架](../frameworks/capability-building.md)
