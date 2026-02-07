# 能力建设框架（Capability Building Framework）

> **核心理念**: 问题不仅是需要修复的缺陷，更是建立预防机制的机会。

---

## 问题的本质

用户反馈：
> "我需要的是你以后不再出现这个问题，不是每次都修改。我希望你能把这个能力沉淀下来融入以后的开发流程。"

这是关于**从反应式修复到预防性能力建设**的转变。

---

## 三层防御模型

```
                  ┌─────────────────────────────────────┐
                  │           第三层：CI/CD              │
                  │     自动化检查 + 质量门禁            │
                  └─────────────────────────────────────┘
                                   ▲
                  ┌─────────────────────────────────────┐
                  │           第二层：Pre-commit         │
                  │    提交前本地检查（快速反馈）        │
                  └─────────────────────────────────────┘
                                   ▲
                  ┌─────────────────────────────────────┐
                  │           第一层：Editor             │
                  │  实时检查 + 格式化（IDE 集成）       │
                  └─────────────────────────────────────┘
```

---

## 问题解决流程（4D 模型）

当发现问题时，按以下顺序执行：

### 1. Detect（检测）- 识别问题类型

| 问题类型 | 检测方式 | 自动化工具 |
|---------|---------|-----------|
| 编码问题 | 构建后验证 | `scripts/check-utf8.py` |
| 格式问题 | Linter | ESLint, Prettier, Ruff |
| ASCII 对齐 | 视觉检查 | `scripts/check-ascii-art.py` |
| 链接失效 | 链接检查器 | `lychee`, `markdown-link-check` |
| 依赖漏洞 | 依赖审计 | `npm audit`, `cargo audit` |

### 2. Diagnose（诊断）- 找到根本原因

使用 5 Whys 分析法：
- **问题**: ASCII art 错位
- **为什么**: CJK 字符宽度不匹配
- **为什么**: 使用了不支持 CJK 的字体
- **为什么**: Shiki 覆盖了全局字体设置
- **为什么**: CSS 优先级不够
- **根本原因**: 缺少针对性的 CSS 规则 + 缺少预检查

### 3. Deploy（部署）- 实施预防机制

**原则**: 每次修复必须包含至少一项自动化检查

```yaml
# .pre-commit-config.yaml 模板
- repo: local
  hooks:
    - id: check-<problem-type>
      name: Check <Problem Description>
      entry: scripts/check-<problem>.py
      language: python
      types: [markdown]  # 或其他类型
      description: Prevent <problem> from recurring
```

### 4. Document（记录）- 沉淀知识

更新以下文档之一：
- `memory/MEMORY.md` - 项目级经验记录
- `docs/frameworks/` - 可复用框架文档
- `.claude/rules/` - Claude 规则约束
- 相关 README 的"踩坑记录"章节

---

## 现有能力清单

### 已实施的预防机制

| 问题类型 | 检测脚本 | Hook 状态 | 文档位置 |
|---------|---------|----------|---------|
| UTF-8 编码损坏 | `scripts/check-utf8.py` | ✅ 已集成 | `.claude/rules/utf8-quality-rule.md` |
| ASCII art 对齐 | `scripts/check-ascii-art.py` | ✅ 已集成 | `memory/MEMORY.md` |
| 构建质量验证 | `scripts/verify-build-quality.sh` | ⚠️ 手动运行 | `scripts/README.md` |

### 待实施的预防机制

| 问题类型 | 建议工具 | 优先级 |
|---------|---------|-------|
| Markdown 链接失效 | `lychee` | 高 |
| 代码重复 | `jscpd` 或 `cpd` | 中 |
| Markdown 格式统一 | `markdownlint` | 中 |
| 依赖过期 | `Renovate` 或 `Dependabot` | 低 |

---

## Claude 协作时的能力建设

### 当用户报告问题时

**错误响应** ❌
```
- 修复当前文件
- 等待下次问题出现
```

**正确响应** ✅
```
1. 修复当前实例
2. 分析问题模式
3. 创建/更新检测脚本
4. 集成到 pre-commit hooks
5. 更新 MEMORY.md 记录
6. 验证机制有效
```

### 检查清单

每次修复问题后，自问：
- [ ] 这个问题是否可能再次出现？
- [ ] 是否有现有工具可以预防？
- [ ] 我是否创建了检测脚本？
- [ ] 我是否更新了 pre-commit 配置？
- [ ] 我是否记录了这次经验？

---

## 外部参考资源

- [Pre-commit: The First Line of Defense in Shift-Left Development](https://www.scalefree.com/consulting/devops-solutions/pre-commit-the-first-line-of-defense-in-shift-left-development/)
- [DevSecOps Phase 2: Code & Commit Stage](https://infosecwriteups.com/devsecops-phase-2-code-commit-stage-harden-the-developer-workflow-31430e9d2ec1)
- [CLEVER: Combining Code Metrics with Clone Detection](https://staticctf.ubisoft.com/J3yJr34U2pZ1Ieem48Dwy9uqj5PNUQTn/3cY8GnnnACxpiSfoUgFW0W/9da8bd48a1010a2c822db1f683a71cba/clever-commit-msr18.pdf) - Ubisoft 的预防性质量保证研究

---

## 总结

**能力建设的自觉** = 修复问题 + 建立机制 + 记录经验

这不是额外的负担，而是**避免重复工作的高效策略**。

---

**版本**: 1.0.0
**创建日期**: 2026-02-08
**维护者**: AI Frontier Lab
