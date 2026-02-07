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

必要的前置知识 -> 链接到 `algo/foundations/` 或其他 Algo Topic

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
