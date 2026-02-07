# AI-Frontier-Lab 重构实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将项目拆分为 agent/ 和 algo/ 两个方向，建立统一的展示站点和技术演进图谱

**Architecture:**
- 创建 agent/ 和 algo/ 顶级目录，迁移现有 topics/
- 更新 Astro Content Collections 支持双集合
- 创建分离的 topic 创建脚本
- 建立 docs/evolution/ 用于关系图谱数据
- 创建 docs/proposals/ 用于自动化发现流程

**Tech Stack:** Astro 5, TypeScript, Bash, YAML, D3.js, KaTeX

---

## Phase 1: 目录结构与脚本迁移

### Task 1: 创建 agent/ 和 algo/ 目录结构

**Files:**
- Create: `agent/_template/`
- Create: `algo/_template/`
- Create: `algo/foundations/`
- Create: `docs/evolution/`
- Create: `docs/proposals/`
- Create: `docs/candidates/`

**Step 1: 创建目录**

```bash
cd /Users/skytxy/code/ai/agent-learning/AI-Frontier-Lab
mkdir -p agent algo
mkdir -p algo/foundations docs/evolution docs/proposals docs/candidates
```

**Step 2: 验证目录创建**

Run: `ls -la | grep -E '(agent|algo|docs)'`
Expected:
```
drwxr-xr-x@ agent
drwxr-xr-x@ algo
```

**Step 3: 创建 agent 模板**

```bash
cp -r topics/_template agent/_template
```

**Step 4: 创建 algo 模板**

文件: `algo/_template/README.md`

```bash
cat > algo/_template/README.md << 'EOF'
---
title: "Topic Title"
tags: [tag1, tag2]
category: category-name
difficulty: beginner | intermediate | advanced
date: YYYY-MM-DD
status: draft
sort: YYYY.MM

# Algo 专用字段（可选）
paper_title: "Paper Title"
paper_arxiv: "arxiv-id"
paper_year: YYYY
type: "classic" | "survey" | "implementation" | "application"
prerequisites:
  - "algo/foundations/some-prerequisite"
papers:
  - id: "paper-id-1"
    role: "predecessor"
---

# Topic Title

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
从系统工程师的视角，如何组织代码？

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
EOF
```

**Step 5: 创建 proposal 模板**

文件: `docs/proposals/_template.md`

```bash
cat > docs/proposals/_template.md << 'EOF'
---
proposal_id: PROPO-YYYY-NNN
title: "简短标题"
type: "new_topic" | "major_update" | "cross_domain"
status: "open" | "under_review" | "accepted" | "rejected" | "withdrawn"
created: YYYY-MM-DD
author: "skytxy"

# 论文信息
paper:
  title: "Paper Title"
  arxiv: "arxiv-id"
  year: YYYY
  venue: "Conference/Journal"
  citations: 0+

# 目标目录
directory: "algo/domain/tech-name/"
sort: YYYY.MM

# 动机说明
motivation: |
  为什么这篇论文重要？它开创了什么范式？

# 关联主题
related_topics:
  - "algo/domain/related-topic"

# 计划实现的实验
experiments:
  - "实验 1"
  - "实验 2"

# 评审检查清单
review_questions:
  - [ ] 该论文是否开创了新范式？
  - [ ] 引用量是否足够高？
  - [ ] 是否有跨领域应用？
  - [ ] 是否建立了清晰的认知框架？
  - [ ] 是否有可复现的代码实现？

# 讨论记录
discussion: |
  ## YYYY-MM-DD: 创建提案
  - 初始创建
EOF
```

**Step 6: Commit**

```bash
git add agent/ algo/ docs/
git commit -m "feat: create agent/ and algo/ directory structure"
```

---

### Task 2: 迁移现有 topics 到 agent/

**Files:**
- Move: `topics/001-mcp-deep-dive/` -> `agent/agent-001-mcp-deep-dive/`
- Move: `topics/002-agent-workflows/` -> `agent/agent-002-agent-workflows/`
- Move: `topics/003-lsp-enhancement/` -> `agent/agent-003-lsp-enhancement/`
- Move: `topics/004-hooks/` -> `agent/agent-004-hooks/`

**Step 1: 迁移目录并重命名**

```bash
mv topics/001-mcp-deep-dive agent/agent-001-mcp-deep-dive
mv topics/002-agent-workflows agent/agent-002-agent-workflows
mv topics/003-lsp-enhancement agent/agent-003-lsp-enhancement
mv topics/004-hooks agent/agent-004-hooks
```

**Step 2: 验证迁移**

Run: `ls agent/`
Expected: `agent-001-mcp-deep-dive  agent-002-agent-workflows  agent-003-lsp-enhancement  agent-004-hooks  _template`

**Step 3: 验证 topics 目录为空（除 README.md）**

Run: `ls topics/`
Expected: `README.md` (或空目录)

**Step 4: Commit**

```bash
git add topics/ agent/
git commit -m "refactor: migrate existing topics to agent/ directory"
```

---

### Task 3: 更新 frontmatter 添加 sort 字段

**Files:**
- Modify: `agent/agent-001-mcp-deep-dive/README.md`
- Modify: `agent/agent-002-agent-workflows/README.md`
- Modify: `agent/agent-003-lsp-enhancement/README.md`
- Modify: `agent/agent-004-hooks/README.md`

**Step 1: 读取 agent-001 frontmatter**

Run: `head -10 agent/agent-001-mcp-deep-dive/README.md`

**Step 2: 添加 sort 字段到每个 README**

对每个文件，在 frontmatter 中添加 `sort: 2026.01`（根据 date 调整）

```bash
# agent-001
sed -i '' '/^status:/a\
sort: 2026.01
' agent/agent-001-mcp-deep-dive/README.md

# agent-002
sed -i '' '/^status:/a\
sort: 2026.02
' agent/agent-002-agent-workflows/README.md

# agent-003
sed -i '' '/^status:/a\
sort: 2026.03
' agent/agent-003-lsp-enhancement/README.md

# agent-004
sed -i '' '/^status:/a\
sort: 2026.04
' agent/agent-004-hooks/README.md
```

**Step 3: 验证修改**

Run: `grep -A1 "^status:" agent/agent-*/README.md | head -20`
Expected: 每个文件 status 后都有 sort 字段

**Step 4: Commit**

```bash
git add agent/
git commit -m "feat: add sort field to agent topic frontmatter"
```

---

### Task 4: 创建新的 topic 创建脚本

**Files:**
- Create: `shared/scripts/new-agent-topic.sh`
- Create: `shared/scripts/new-algo-topic.sh`
- Modify: `shared/scripts/new-topic.sh` (添加弃用提示)

**Step 1: 创建 new-agent-topic.sh**

文件: `shared/scripts/new-agent-topic.sh`

```bash
cat > shared/scripts/new-agent-topic.sh << 'EOF'
#!/usr/bin/env bash
# Usage: ./new-agent-topic.sh <number> "<topic-name>"
# Example: ./new-agent-topic.sh 005 "langchain-integration"

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE_DIR="$REPO_ROOT/agent/_template"

if [ $# -ne 2 ]; then
    echo "Usage: $0 <number> <topic-name>"
    echo "Example: $0 005 langchain-integration"
    exit 1
fi

NUMBER="$1"
NAME="$2"
PADDED=$(printf "%03d" "$NUMBER")
TOPIC_DIR="$REPO_ROOT/agent/agent-${PADDED}-${NAME}"

if [ -d "$TOPIC_DIR" ]; then
    echo "Error: $TOPIC_DIR already exists."
    exit 1
fi

# Copy template
cp -r "$TEMPLATE_DIR" "$TOPIC_DIR"

# Replace placeholders in README.md
TODAY=$(date +%Y-%m-%d)
sed -i '' "s/YYYY-MM-DD/$TODAY/g" "$TOPIC_DIR/README.md"
sed -i '' "s/Topic Title/${NAME}/g" "$TOPIC_DIR/README.md"

# Add sort field
sed -i '' "/^status:/a\\
sort: ${TODAY//-/.}
" "$TOPIC_DIR/README.md"

echo "Created new agent topic: $TOPIC_DIR"
echo "Next steps:"
echo "  1. Edit $TOPIC_DIR/README.md — update title, tags, category, difficulty"
echo "  2. Start exploring!"
EOF

chmod +x shared/scripts/new-agent-topic.sh
```

**Step 2: 创建 new-algo-topic.sh**

文件: `shared/scripts/new-algo-topic.sh`

```bash
cat > shared/scripts/new-algo-topic.sh << 'EOF'
#!/usr/bin/env bash
# Usage: ./new-algo-topic.sh <domain> "<tech-name>" ["paper-year"]
# Example: ./new-algo-topic.sh transformer "original" 2017
# Example: ./new-algo-topic.sh cnn resnet 2015

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE_DIR="$REPO_ROOT/algo/_template"

if [ $# -lt 2 ]; then
    echo "Usage: $0 <domain> <tech-name> [paper-year]"
    echo "Example: $0 transformer original 2017"
    echo "Example: $0 cnn resnet 2015"
    exit 1
fi

DOMAIN="$1"
NAME="$2"
YEAR="${3:-$(date +%Y)}"

# Validate domain exists
DOMAIN_DIR="$REPO_ROOT/algo/$DOMAIN"
if [ ! -d "$DOMAIN_DIR" ]; then
    echo "Creating domain directory: $DOMAIN_DIR"
    mkdir -p "$DOMAIN_DIR"
fi

TOPIC_DIR="$DOMAIN_DIR/$NAME"

if [ -d "$TOPIC_DIR" ]; then
    echo "Error: $TOPIC_DIR already exists."
    exit 1
fi

# Copy template
cp -r "$TEMPLATE_DIR" "$TOPIC_DIR"

# Replace placeholders in README.md
TODAY=$(date +%Y-%m-%d)
sed -i '' "s/YYYY-MM-DD/$TODAY/g" "$TOPIC_DIR/README.md"
sed -i '' "s/Topic Title/${NAME}/g" "$TOPIC_DIR/README.md"

# Update sort field
if [ -n "$YEAR" ]; then
    sed -i '' "s/sort: YYYY.MM/sort: ${YEAR}.01/" "$TOPIC_DIR/README.md"
    sed -i '' "s/paper_year: YYYY/paper_year: ${YEAR}/" "$TOPIC_DIR/README.md"
fi

echo "Created new algo topic: $TOPIC_DIR"
echo "Next steps:"
echo "  1. Edit $TOPIC_DIR/README.md — update title, tags, category, difficulty"
echo "  2. Add paper information if applicable"
echo "  3. Start exploring!"
EOF

chmod +x shared/scripts/new-algo-topic.sh
```

**Step 3: 更新 new-topic.sh 添加弃用提示**

文件: `shared/scripts/new-topic.sh`

```bash
cat > shared/scripts/new-topic.sh << 'EOF'
#!/usr/bin/env bash
# DEPRECATED: Use new-agent-topic.sh or new-algo-topic.sh instead

set -euo pipefail

echo "========================================"
echo "  WARNING: This script is deprecated"
echo "========================================"
echo ""
echo "Please use the new scripts instead:"
echo "  - For Agent topics: ./new-agent-topic.sh <number> <name>"
echo "  - For Algo topics:  ./new-algo-topic.sh <domain> <name> [year]"
echo ""
echo "Example:"
echo "  ./new-agent-topic.sh 005 langchain-integration"
echo "  ./new-algo-topic.sh transformer original 2017"
echo ""
exit 1
EOF
```

**Step 4: 验证脚本可执行**

Run: `ls -la shared/scripts/new-*.sh`
Expected: 所有文件有 -rwxr-xr-x 权限

**Step 5: Commit**

```bash
git add shared/scripts/
git commit -m "feat: add new-agent-topic.sh and new-algo-topic.sh, deprecate new-topic.sh"
```

---

### Task 5: 创建论文发现脚本骨架

**Files:**
- Create: `shared/scripts/papers/discover-papers.sh`
- Create: `shared/scripts/papers/promote-proposal.sh`

**Step 1: 创建 papers 目录**

```bash
mkdir -p shared/scripts/papers
```

**Step 2: 创建 discover-papers.sh 骨架**

文件: `shared/scripts/papers/discover-papers.sh`

```bash
cat > shared/scripts/papers/discover-papers.sh << 'EOF'
#!/usr/bin/env bash
# Paper discovery script - scans arXiv, HuggingFace, Paper Digest
# Usage: ./discover-papers.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CANDIDATES_DIR="$REPO_ROOT/docs/candidates"
TODAY=$(date +%Y-%m-%d)
OUTPUT_FILE="$CANDIDATES_DIR/$TODAY-candidates.md"

mkdir -p "$CANDIDATES_DIR"

echo "Starting paper discovery for $TODAY..."

# TODO: Implement actual discovery logic
# - Query arXiv API for cs.AI, cs.LG, cs.CL
# - Check HuggingFace trending models
# - Query Paper Digest API

# Create placeholder output
cat > "$OUTPUT_FILE" << OUTEOF
---
date: $TODAY
scanner: "auto-discover-v1"
---

# 候选论文推荐

## 📊 高置信度候选

_暂无候选 - 脚本待实现_

## 🤔 中等置信度候选
_待实现_

## 📋 低置信度候选
_待实现_
OUTEOF

echo "Discovery complete: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "  1. Review candidates"
echo "  2. Create proposal: cp docs/proposals/_template.md docs/proposals/PROPO-$(date +%Y)-001-title.md"
EOF

chmod +x shared/scripts/papers/discover-papers.sh
```

**Step 3: 创建 promote-proposal.sh 骨架**

文件: `shared/scripts/papers/promote-proposal.sh`

```bash
cat > shared/scripts/papers/promote-proposal.sh << 'EOF'
#!/usr/bin/env bash
# Promote an accepted proposal to a full topic
# Usage: ./promote-proposal.sh PROPO-YYYY-NNN

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PROPOSALS_DIR="$REPO_ROOT/docs/proposals"

if [ $# -ne 1 ]; then
    echo "Usage: $0 PROPO-YYYY-NNN"
    exit 1
fi

PROPOSAL_ID="$1"
PROPOSAL_FILE="$PROPOSALS_DIR/$PROPOSAL_ID.md"

if [ ! -f "$PROPOSAL_FILE" ]; then
    echo "Error: Proposal file not found: $PROPOSAL_FILE"
    exit 1
fi

# TODO: Implement promotion logic
# - Parse proposal YAML
# - Verify status is "accepted"
# - Create directory structure
# - Generate README from proposal
# - Create experiments structure
# - Update evolution YAML
# - Create git commit
# - Create PR

echo "Promoting proposal: $PROPOSAL_ID"
echo "TODO: Implementation pending"
EOF

chmod +x shared/scripts/papers/promote-proposal.sh
```

**Step 4: Commit**

```bash
git add shared/scripts/papers/
git commit -m "feat: add paper discovery and promotion script skeletons"
```

---

## Phase 2: 站点更新

### Task 6: 更新 Astro Content Collections 配置

**Files:**
- Modify: `site/src/content.config.ts`

**Step 1: 读取当前配置**

Run: `cat site/src/content.config.ts`

**Step 2: 替换为新的双集合配置**

文件: `site/src/content.config.ts`

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Agent Collection - for agent infrastructure topics
const agent = defineCollection({
  loader: glob({ pattern: 'agent-*/README.md', base: '../agent' }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    date: z.coerce.date(),
    status: z.enum(['draft', 'in-progress', 'published', 'completed']),
    sort: z.number().optional(),
  }),
});

// Algo Collection - for algorithm and model topics
const algo = defineCollection({
  loader: glob({ pattern: '**/README.md', base: '../algo' }),
  schema: z.object({
    // Common fields (same as agent)
    title: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    date: z.coerce.date(),
    status: z.enum(['draft', 'in-progress', 'published', 'completed']),
    sort: z.number().optional(),

    // Algo-specific fields (optional)
    paper_title: z.string().optional(),
    paper_arxiv: z.string().optional(),
    paper_year: z.number().optional(),
    type: z.enum(['classic', 'survey', 'implementation', 'application']).optional(),
    prerequisites: z.array(z.string()).optional(),
    papers: z.array(z.string()).optional(),
  }),
});

// Legacy experiments collection (still works with agent topics)
const experiments = defineCollection({
  loader: glob({ pattern: '**/experiments/*/README.md', base: '../agent' }),
  schema: z.object({
    title: z.string(),
    experiment: z.coerce.number(),
    parent: z.string(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    prerequisites: z.array(z.string()).optional(),
  }),
});

// Legacy concepts collection (still works with agent topics)
const concepts = defineCollection({
  loader: glob({ pattern: '**/concepts/*.md', base: '../agent' }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

export const collections = { agent, algo, experiments, concepts };
```

**Step 3: 验证 TypeScript 语法**

Run: `cd site && npx tsc --noEmit`
Expected: 无错误（或仅有无关警告）

**Step 4: Commit**

```bash
git add site/src/content.config.ts
git commit -m "refactor: update Astro collections for agent/ and algo/"
```

---

### Task 7: 创建新的首页（支持 Agent/Algo 切换）

**Files:**
- Modify: `site/src/pages/index.astro`

**Step 1: 备份现有首页**

```bash
cp site/src/pages/index.astro site/src/pages/index.astro.bak
```

**Step 2: 更新首页**

文件: `site/src/pages/index.astro`

```typescript
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const allAgentTopics = await getCollection('agent');
const allAlgoTopics = await getCollection('algo');

// Sort by sort field, then by date
const sortBySort = (items) =>
  items.sort((a, b) => {
    const aSort = a.data.sort || parseFloat(a.data.date.toISOString().slice(0, 4));
    const bSort = b.data.sort || parseFloat(b.data.date.toISOString().slice(0, 4));
    return aSort - bSort;
  });

const agentTopics = sortBySort(allAgentTopics);
const algoTopics = sortBySort(allAlgoTopics);

// View state (client-side)
---

<BaseLayout title="AI Frontier Lab - 探索AI前沿技术的实验室">
  <section class="hero">
    <div class="hero-content">
      <div class="hero-badge">🚀 探索 AI 前沿</div>
      <h1>AI Frontier Lab</h1>
      <p class="hero-description">
        一个持续演进的 AI 前沿技术探索实验室，涵盖 Agent 基础设施与核心算法研究
      </p>
      <p class="hero-subtitle">双向探索：Agent 工程与算法前沿</p>
      <div class="hero-stats">
        <div class="stat">
          <div class="stat-number">{agentTopics.length}</div>
          <div class="stat-label">Agent 主题</div>
        </div>
        <div class="stat">
          <div class="stat-number">{algoTopics.length}</div>
          <div class="stat-label">Algo 主题</div>
        </div>
        <div class="stat">
          <div class="stat-number">Expert</div>
          <div class="stat-label">难度等级</div>
        </div>
      </div>
    </div>
  </section>

  <!-- View Toggle -->
  <section class="view-toggle-section">
    <div class="view-toggle">
      <button id="view-all" class="view-btn active" data-view="all">全部</button>
      <button id="view-agent" class="view-btn" data-view="agent">Agent</button>
      <button id="view-algo" class="view-btn" data-view="algo">Algo</button>
    </div>
  </section>

  <!-- Agent Topics -->
  <section id="agent-section" class="topics-section">
    <div class="section-header">
      <h2>Agent 主题</h2>
      <p class="section-description">Agent 基础设施：MCP、Workflows、LSP、Hooks</p>
    </div>

    <div class="topics-grid" id="agent-grid">
      {agentTopics.map((topic) => (
        <a href={`/agent/${topic.id.replace(/\/readme$/, '')}/`} class="topic-card" data-type="agent">
          <div class="card-header">
            <span class="topic-id">{topic.id}</span>
            <span class="difficulty-badge" data-level={topic.data.difficulty}>
              {topic.data.difficulty === 'beginner' && '🟢 初级'}
              {topic.data.difficulty === 'intermediate' && '🟡 中级'}
              {topic.data.difficulty === 'advanced' && '🔴 高级'}
            </span>
          </div>

          <h3 class="topic-title">{topic.data.title}</h3>

          <div class="topic-meta">
            <span class="category-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 002.828 0l-7-7A1.994 1.994 0 0012.01 3H7a4 4 0 110-8h2a2 2 0 012 2v12a2 2 0 01-2 2H7a4 4 0 01-4-4V7a4 4 0 014-4z"/>
              </svg>
              {topic.data.category}
            </span>
            <span class="status-badge" data-status={topic.data.status}>
              {topic.data.status === 'completed' && '✓ 已完成'}
              {topic.data.status === 'in-progress' && '🔄 进行中'}
              {topic.data.status === 'published' && '📦 已发布'}
            </span>
          </div>

          <div class="topic-footer">
            <time datetime={topic.data.date.toISOString()}>
              {topic.data.date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </time>
          </div>

          <div class="topic-tags">
            {topic.data.tags.slice(0, 4).map((tag: string) => (
              <span class="tag">#{tag}</span>
            ))}
            {topic.data.tags.length > 4 && (
              <span class="tag-more">+{topic.data.tags.length - 4}</span>
            )}
          </div>
        </a>
      ))}
    </div>
  </section>

  <!-- Algo Topics -->
  <section id="algo-section" class="topics-section">
    <div class="section-header">
      <h2>Algo 主题</h2>
      <p class="section-description">核心算法：深度学习、Transformer、强化学习</p>
    </div>

    <div class="topics-grid" id="algo-grid">
      {algoTopics.length > 0 ? (
        algoTopics.map((topic) => (
          <a href={`/algo/${topic.id.replace(/\/readme$/, '')}/`} class="topic-card" data-type="algo">
            <div class="card-header">
              <span class="topic-id">{topic.id}</span>
              <span class="difficulty-badge" data-level={topic.data.difficulty}>
                {topic.data.difficulty === 'beginner' && '🟢 初级'}
                {topic.data.difficulty === 'intermediate' && '🟡 中级'}
                {topic.data.difficulty === 'advanced' && '🔴 高级'}
              </span>
            </div>

            <h3 class="topic-title">{topic.data.title}</h3>

            {topic.data.paper_title && (
              <div class="paper-info">
                <span class="paper-icon">📄</span>
                <span class="paper-title">{topic.data.paper_title}</span>
                {topic.data.paper_year && (
                  <span class="paper-year">({topic.data.paper_year})</span>
                )}
              </div>
            )}

            <div class="topic-meta">
              <span class="category-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 002.828 0l-7-7A1.994 1.994 0 0012.01 3H7a4 4 0 110-8h2a2 2 0 012 2v12a2 2 0 01-2 2H7a4 4 0 01-4-4V7a4 4 0 014-4z"/>
                </svg>
                {topic.data.category}
              </span>
              <span class="status-badge" data-status={topic.data.status}>
                {topic.data.status === 'completed' && '✓ 已完成'}
                {topic.data.status === 'in-progress' && '🔄 进行中'}
                {topic.data.status === 'published' && '📦 已发布'}
              </span>
            </div>

            <div class="topic-footer">
              <time datetime={topic.data.date.toISOString()}>
                {topic.data.date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </time>
            </div>

            <div class="topic-tags">
              {topic.data.tags.slice(0, 4).map((tag: string) => (
                <span class="tag">#{tag}</span>
              ))}
              {topic.data.tags.length > 4 && (
                <span class="tag-more">+{topic.data.tags.length - 4}</span>
              )}
            </div>
          </a>
        ))
      ) : (
        <div class="empty-state">
          <p>Algo 主题即将推出...</p>
          <p class="empty-hint">第一个 Algo 主题正在规划中</p>
        </div>
      )}
    </div>
  </section>

  <section class="features">
    <h2>为什么选择 AI Frontier Lab?</h2>
    <div class="features-grid">
      <div class="feature">
        <div class="feature-icon">🤖</div>
        <h3>Agent 基础设施</h3>
        <p>MCP 协议、Agent Workflows、LSP 增强、Hooks 系统</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🧮</div>
        <h3>核心算法研究</h3>
        <p>深度学习、Transformer、强化学习前沿论文与实现</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🔬</div>
        <h3>深度研究</h3>
        <p>不满足于表面，深入协议内部与算法原理</p>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <h3>实战导向</h3>
        <p>可运行的代码胜过千言万语，每个实验都是完整项目</p>
      </div>
    </div>
  </section>
</BaseLayout>

<style>
  /* View Toggle */
  .view-toggle-section {
    max-width: 1200px;
    margin: -2rem auto 2rem;
    padding: 0 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-primary);
  }

  .view-toggle {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--bg-secondary);
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .view-btn {
    padding: 0.5rem 1.5rem;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .view-btn:hover {
    background: var(--bg-tertiary);
  }

  .view-btn.active {
    background: var(--accent);
    color: white;
  }

  /* Paper Info */
  .paper-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .paper-icon {
    font-size: 1rem;
  }

  .paper-title {
    font-style: italic;
  }

  .paper-year {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  /* Empty State */
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 2rem;
    background: var(--bg-secondary);
    border-radius: 12px;
    border: 2px dashed var(--border);
  }

  .empty-state p {
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .empty-hint {
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  /* Hero Section */
  .hero {
    text-align: center;
    padding: 4rem 1rem 3rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    margin-bottom: 3rem;
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .hero-badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    backdrop-filter: blur(10px);
  }

  .hero h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 800;
    margin-bottom: 1rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  .hero-description {
    font-size: clamp(1rem, 2vw, 1.25rem);
    line-height: 1.6;
    margin-bottom: 1rem;
    opacity: 0.95;
  }

  .hero-subtitle {
    font-size: 1rem;
    font-weight: 500;
    opacity: 0.9;
    margin-bottom: 2rem;
  }

  .hero-stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-top: 2rem;
  }

  .stat {
    text-align: center;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  /* Topics Section */
  .topics-section {
    max-width: 1200px;
    margin: 0 auto 3rem;
    padding: 0 1rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .section-header h2 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .section-description {
    color: var(--text-secondary);
    font-size: 1rem;
  }

  .topics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .topic-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .topic-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  .topic-card:hover::before {
    transform: scaleX(1);
  }

  .topic-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px var(--shadow);
    border-color: var(--accent);
  }

  .topic-card[data-type="algo"]::before {
    background: linear-gradient(90deg, #f59e0b, #ef4444);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .topic-id {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .difficulty-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .difficulty-badge[data-level="beginner"] { background: #d4edda; color: #155724; }
  .difficulty-badge[data-level="intermediate"] { background: #fff3cd; color: #856404; }
  .difficulty-badge[data-level="advanced"] { background: #f8d7da; color: #721c24; }

  .topic-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .topic-meta {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .category-tag {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .category-tag svg {
    flex-shrink: 0;
  }

  .status-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }

  .status-badge[data-status="completed"] { background: #d4edda; color: #155724; }
  .status-badge[data-status="in-progress"] { background: #fff3cd; color: #856404; }
  .status-badge[data-status="published"] { background: #d1e7dd; color: #0c5460; }

  .topic-footer {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .topic-footer time {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .topic-tags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .tag {
    font-size: 0.75rem;
    color: #764ba2;
    background: #f0f0ff;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
  }

  :global([data-effective-theme="dark"]) .tag {
    background: #2a2a4a;
    color: #a090c0;
  }

  .tag-more {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
  }

  /* Features Section */
  .features {
    max-width: 1000px;
    margin: 0 auto;
    padding: 3rem 1rem;
    background: var(--bg-secondary);
    border-radius: 12px;
  }

  .features h2 {
    text-align: center;
    font-size: 1.75rem;
    margin-bottom: 2rem;
    color: var(--text-primary);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .feature {
    text-align: center;
    padding: 1.5rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    transition: transform 0.2s;
  }

  .feature:hover {
    transform: translateY(-2px);
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .feature h3 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .feature p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero-stats {
      flex-direction: column;
      gap: 1.5rem;
    }

    .topics-grid {
      grid-template-columns: 1fr;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<script>
  // View toggle functionality
  const viewBtns = document.querySelectorAll('.view-btn');
  const agentSection = document.getElementById('agent-section');
  const algoSection = document.getElementById('algo-section');

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;

      // Update active state
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle sections
      if (view === 'all') {
        agentSection.style.display = 'block';
        algoSection.style.display = 'block';
      } else if (view === 'agent') {
        agentSection.style.display = 'block';
        algoSection.style.display = 'none';
      } else if (view === 'algo') {
        agentSection.style.display = 'none';
        algoSection.style.display = 'block';
      }
    });
  });
</script>
```

**Step 3: 验证构建**

Run: `cd site && npm run build`
Expected: 构建成功，无错误

**Step 4: Commit**

```bash
git add site/src/pages/index.astro
git commit -m "feat: update homepage with Agent/Algo toggle"
```

---

### Task 8: 创建 Agent 和 Algo 路由页面

**Files:**
- Create: `site/src/pages/agent/[...slug].astro`
- Create: `site/src/pages/algo/[...slug].astro`

**Step 1: 创建 Agent 路由页面**

文件: `site/src/pages/agent/[...slug].astro`

```typescript
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import TopicLayout from '../../layouts/TopicLayout.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const agentTopics = await getCollection('agent');
  return agentTopics.map((topic) => ({
    params: { slug: topic.id.replace(/\/readme$/, '').split('/') },
    props: { topic },
  }));
}

const { topic } = Astro.props;
const { Content } = await topic.render();
---

<TopicLayout topic={topic}>
  <Content />
</TopicLayout>
```

**Step 2: 创建 Algo 路由页面**

文件: `site/src/pages/algo/[...slug].astro`

```typescript
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import TopicLayout from '../../layouts/TopicLayout.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const algoTopics = await getCollection('algo');
  return algoTopics.map((topic) => ({
    params: { slug: topic.id.replace(/\/readme$/, '').split('/') },
    props: { topic },
  }));
}

const { topic } = Astro.props;
const { Content } = await topic.render();

// Check if this is an algo topic for conditional loading
const isAlgo = true;
---

<TopicLayout topic={topic} isAlgo={isAlgo}>
  <Content />
</TopicLayout>
```

**Step 3: 更新 TopicLayout 支持条件加载**

文件: `site/src/layouts/TopicLayout.astro`

需要在头部添加 isAlgo prop 支持（如果尚未存在）

**Step 4: 验证构建**

Run: `cd site && npm run build`
Expected: 构建成功

**Step 5: Commit**

```bash
git add site/src/pages/agent/ site/src/pages/algo/
git commit -m "feat: add agent/ and algo/ route pages"
```

---

### Task 9: 创建 evolution 数据文件示例

**Files:**
- Create: `docs/evolution/attention.yaml`
- Create: `docs/evolution/cnn.yaml`

**Step 1: 创建 attention.yaml**

文件: `docs/evolution/attention.yaml`

```yaml
meta:
  title: "Attention Mechanism"
  description: "从 Seq2Seq 到 Self-Attention 的演进"
  color: "#e94560"

timeline:
  - year: 2014
    event: "Bahdanau Attention 提出"
  - year: 2015
    event: "Luong Attention"
  - year: 2017
    event: "Self-Attention (Transformer)"

# Topics will be added as they are created
topics: []

# Papers will be added as they are included
papers: []

# Relations will be added as topics are connected
relations: []
```

**Step 2: 创建 cnn.yaml**

文件: `docs/evolution/cnn.yaml`

```yaml
meta:
  title: "Convolutional Neural Networks"
  description: "从 LeNet 到 ResNet 的演进"
  color: "#3b82f6"

timeline:
  - year: 1998
    event: "LeNet"
  - year: 2012
    event: "AlexNet"
  - year: 2014
    event: "VGG"
  - year: 2015
    event: "ResNet"

topics: []
papers: []
relations: []
```

**Step 3: Commit**

```bash
git add docs/evolution/
git commit -m "feat: add evolution data structure examples"
```

---

### Task 10: 更新 README.md

**Files:**
- Modify: `README.md`

**Step 1: 读取当前 README**

Run: `cat README.md`

**Step 2: 更新 README 反映新结构**

文件: `README.md`

```markdown
# AI-Frontier-Lab

> 一个持续演进的 AI 前沿技术探索实验室，涵盖 Agent 基础设施与核心算法研究。

## 项目结构

```
AI-Frontier-Lab/
├── agent/              # Agent 方向：MCP、Workflows、LSP、Hooks
│   ├── agent-001-mcp-deep-dive/
│   ├── agent-002-agent-workflows/
│   ├── agent-003-lsp-enhancement/
│   └── agent-004-hooks/
│
├── algo/               # Algo 方向：深度学习、Transformer、RL
│   ├── foundations/    # 通用基础知识
│   ├── cnn/            # 卷积神经网络
│   ├── transformer/    # Transformer 架构
│   ├── rl/             # 强化学习
│   ├── attention/      # 注意力机制
│   └── diffusion/      # 扩散模型
│
├── site/               # 展示站点（Astro）
├── docs/               # 文档与设计
│   ├── plans/          # 设计文档
│   ├── evolution/      # 技术演进图谱数据
│   ├── proposals/      # 论文提案
│   └── candidates/     # 候选论文
│
└── shared/scripts/     # 共享脚本
    ├── new-agent-topic.sh   # 创建 Agent 主题
    └── new-algo-topic.sh    # 创建 Algo 主题
```

## 快速开始

### 查看网站

```bash
./start-web.sh
# 或
cd site && npm run dev
```

### 创建新主题

**Agent 主题：**
```bash
./shared/scripts/new-agent-topic.sh 005 "langchain-integration"
```

**Algo 主题：**
```bash
./shared/scripts/new-algo-topic.sh transformer original 2017
```

### 论文发现流程

```bash
# 1. 运行发现脚本
./shared/scripts/papers/discover-papers.sh

# 2. 审查候选并创建提案
cp docs/proposals/_template.md docs/proposals/PROPO-2026-001-title.md

# 3. 接受后执行提案
./shared/scripts/papers/promote-proposal.sh PROPO-2026-001
```

## 两个方向

### Agent 方向

专注于 AI Agent 基础设施技术：
- **MCP (Model Context Protocol)** - 深入协议原理
- **Agent Workflows** - 编排模式与实践
- **LSP Enhancement** - 语言服务器协议增强
- **Hooks** - 事件驱动架构

### Algo 方向

专注于核心算法与模型研究：
- **Foundations** - 梯度下降、反向传播、优化
- **CNN** - LeNet、AlexNet、VGG、ResNet
- **Transformer** - 架构原理、编码器/解码器
- **RL** - DQN、Policy Gradient、PPO
- **Attention** - 注意力机制演进
- **Diffusion** - 扩散模型

## 技术栈

- **站点**: Astro 5 + React
- **公式**: KaTeX
- **可视化**: D3.js
- **脚本**: Bash + Python

## 许可证

MIT License
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README for new structure"
```

---

### Task 11: 验证构建和测试

**Step 1: 验证站点构建**

Run: `cd site && npm run build`
Expected: 构建成功

**Step 2: 启动开发服务器验证**

Run: `cd site && npm run dev &`
Expected: 服务器启动在 http://localhost:4321

**Step 3: 测试脚本**

Run: `./shared/scripts/new-agent-topic.sh 999 "test-topic"`
Expected: 创建 `agent/agent-999-test-topic/`

Run: `./shared/scripts/new-algo-topic.sh test-domain test-tech 2025`
Expected: 创建 `algo/test-domain/test-tech/`

**Step 4: 清理测试数据**

```bash
rm -rf agent/agent-999-test-topic
rm -rf algo/test-domain/
```

**Step 5: 最终验证提交**

```bash
git add .
git commit -m "test: verify refactoring complete"
```

---

## Phase 3: 后续工作（非本次实施范围）

以下任务留待后续完成：

1. **关系图谱可视化** - 使用 D3.js 实现 `/graph` 页面
2. **KaTeX 集成** - 条件加载数学公式渲染
3. **论文发现脚本完善** - 实现实际的 arXiv/HuggingFace API 调用
4. **提案执行脚本实现** - 自动从提案生成 topic
5. **局部关系图谱** - 每个 topic 页面底部显示相关技术图谱
6. **Proposal 页面** - `/proposals` 路由展示提案状态

---

## 执行总结

完成上述任务后：
- 项目将拆分为 `agent/` 和 `algo/` 两个顶级目录
- 现有 topics 迁移到 `agent/`
- 站点支持 Agent/Algo 视图切换
- 创建了双集合的 topic 创建脚本
- 建立了论文发现和提案流程的基础结构
- 为关系图谱预留了数据结构

**总任务数**: 11
**预计 commit 数**: ~12
