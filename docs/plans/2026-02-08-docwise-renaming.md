# Docwise Skill 重构记录

**Date**: 2026-02-08
**Status**: 设计完成，待实施

## 重构目标

统一命名，解决 `chapter-validator` 与实际功能（文档工作流自动化）的偏差。

## 新命名结构

| 项 | 旧名称 | 新名称 |
|---|--------|--------|
| Skill | `chapter-content-validator` | `docwise` |
| 配置目录 | `.chapter-validation/` → `.chapter-validator/` | `.docwise/` |
| 配置文件 | `.chapter-validator/config.yaml` | `.docwise/config.yaml` |
| 方法论文档 | `chapter-validator-paradigm.md` | `docwise-workflow.md` |
| 设计文档 | `chapter-validator-design.md` | (保持，或更新引用) |

## 命令设计

```
/docwise:new [description]       -- 新建内容（场景生成+确认）
/docwise:improve [description]   -- 优化现有内容
/docwise:check [focus]           -- 检查（links/logic/content/all）
/docwise:record [lesson]         -- 记录经验到范式
```

## 场景复杂度级别

| 级别 | 描述 | 典型范围 |
|------|------|----------|
| simple | 单一功能，边界清晰 | 单个工具 |
| medium | 多个相关功能 | 2-3个工具，基础错误处理 |
| complex | 多组件有依赖 | Tools + Resources + Prompts |
| advanced | 复杂交互、安全、性能 | 全栈、安全考虑、优化 |

## 核心特性

1. **场景驱动**：用户描述需求 → AI 生成场景 → 用户确认 → 执行
2. **动态 Agent 协作**：根据场景自动选择协作模式（single/dual/triple/parallel）
3. **经验驱动进化**：执行后学习，下次更智能
4. **完整工作流**：生成 → 维护 → 检查 → 优化

## 文件变更清单

### 需要重命名
- [ ] `.claude/skills/chapter-validator/` → `.claude/skills/docwise/`
- [ ] `.chapter-validator/` → `.docwise/`
- [ ] `docs/frameworks/docwise-paradigm.md` → `docs/frameworks/docwise-workflow.md`

### 需要更新引用
- [ ] Skill 内所有文件（`.ts`, `.md`, `.yaml`）
- [ ] `docs/frameworks/` 下所有引用
- [ ] `docs/plans/` 下相关设计文档
- [ ] `MEMORY.md` 中的相关记录

### 需要重写内容
- [ ] `skill.md` - 更新为英文，添加 `:new/:improve/:check/:record` 命令
- [ ] 范式文档 - 保持中文，更新引用和新增部分（场景生成、复杂度推断）

## 实施步骤

```bash
# 1. 重命名目录
mv .claude/skills/chapter-validator .claude/skills/docwise
mv .chapter-validator .docwise

# 2. 重命名范式文档
mv docs/frameworks/docwise-paradigm.md docs/frameworks/docwise-workflow.md

# 3. 批量替换引用
find .claude/skills/docwise -type f -exec sed -i '' 's/chapter-validator/docwise/g' {} +
find docs -name "*.md" -exec sed -i '' 's/chapter-validator/docwise/g' {} +

# 4. 更新 skill.md 标题和描述
# 5. 更新范式文档内容（场景生成、复杂度规则等）
# 6. 更新 MEMORY.md
# 7. 验证：grep 确认没有残留的旧引用
```

## 快捷触发词

| 用户输入 | 识别为 |
|----------|--------|
| "实现xxx" / "implement xxx" | `:new` |
| "检查xxx" / "check xxx" | `:check` |
| "优化xxx" / "improve xxx" | `:improve` |
| "记下来" / "record this" | `:record` |
| "内化这个" / "internalize" | `:record` |
| "更新范式" / "update paradigm" | `:record` |

## Design Philosophy

**Docwise** = Doc (文档) + Wise (智能)

- **智能**：经验驱动，每次执行后学习
- **自动化**：从场景描述到内容生成的完整流程
- **协作**：动态选择最佳 Agent 协作模式
- **闭环**：生成 → 维护 → 检查 → 优化 → 记录经验 → 更好的生成

---

**Version**: 1.0.0
**Created**: 2026-02-08
