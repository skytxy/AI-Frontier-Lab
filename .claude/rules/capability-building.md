# 能力建设强制规则（Capability Building Mandate）

**重要**: 当修复任何问题时，必须遵循此规则以确保问题的预防性机制被建立。

## 核心原则

> **"永远不要两次修复同一个问题"** - Every problem should be fixed exactly once.

## 适用场景

此规则适用于以下问题类型：
- 编码/乱码问题
- 格式化问题
- 链接失效
- 渲染/显示问题
- 构建失败
- 测试失败

## 三步强制流程

### Step 1: 修复当前实例 ✅

修复用户报告的具体问题。

### Step 2: 建立预防机制 ⚠️ （必须）

选择以下至少一种方式：

**A. 创建检测脚本** (`scripts/check-*.py`)
```bash
# 示例
scripts/check-ascii-art.py
scripts/check-utf8.py
scripts/check-dead-links.py
```

**B. 集成到 pre-commit hooks**
```yaml
# .pre-commit-config.yaml
- repo: local
  hooks:
    - id: check-problem-name
      name: Check Problem Description
      entry: scripts/check-problem.py
      language: python
      types: [text/markdown/etc]
```

**C. 添加到 CI/CD**
```yaml
# .github/workflows/quality.yml
- name: Run quality checks
  run: |
    npm run check-quality
    bash scripts/verify-build-quality.sh
```

### Step 3: 记录经验 📝

更新以下至少一个文档：
- `memory/MEMORY.md` - 项目级经验
- `docs/frameworks/` - 框架文档
- 相关文件的"踩坑记录"章节

## 快速决策树

```
发现问题
    │
    ├─ 是否已有检测脚本？
    │   ├─ 是 -> 运行验证，确保能捕获问题
    │   └─ 否 -> 创建检测脚本
    │
    ├─ 是否已集成到 pre-commit？
    │   ├─ 是 -> 验证配置正确
    │   └─ 否 -> 添加到 .pre-commit-config.yaml
    │
    └─ 是否已记录经验？
        ├─ 是 -> 更新记录
        └─ 否 -> 创建记录
```

## 禁止行为

❌ **禁止**: 只修复当前文件，不考虑预防
❌ **禁止**: 修复后不验证是否可复现
❌ **禁止**: 发现可自动化的问题仍手动检查

## 鼓励行为

✅ **鼓励**: 优先搜索现有工具（如 linters）而非重复造轮
✅ **鼓励**: 将检测脚本写成通用工具，便于复用
✅ **鼓励**: 在修复时考虑同类问题的预防

## 检查清单

完成修复前确认：
- [ ] 当前问题已修复
- [ ] 检测脚本已创建（或现有工具已配置）
- [ ] Pre-commit hook 已更新
- [ ] 经验已记录到 MEMORY.md
- [ ] 机制已验证有效

## 违反后果

违反此规则将导致：
- 问题在未来重复出现
- 浪费时间重复修复
- 用户体验受损

---

**版本**: 1.0.0
**生效日期**: 2026-02-08
**执行**: 强制执行
