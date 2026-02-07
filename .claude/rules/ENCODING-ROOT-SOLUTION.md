# UTF-8 编码问题根治方案

**问题根源**: Claude Code 的 Write 工具在处理中文时可能破坏 UTF-8 编码。

## 根治方案

### 1. 创建文件（含中文）使用 Bash heredoc

```bash
cat > file.md << 'EOF'
# 中文标题

中文内容...
EOF
```

### 2. 读取文件使用 Read 工具

Read 工具是安全的。

### 3. 修改文件（含中文）使用 Edit 工具

Edit 工具基于 Read，也是安全的。

### 4. 验证编码

```bash
python3 scripts/fix-encoding.py
```

## 工具说明

- `scripts/fix-encoding.py`: 扫描和修复编码问题
- 字节级处理，可靠

## 当前状态

- 所有 .md 文件已清理
- 无 Unicode 替换字符
- 根治方案已建立

---

**版本**: 1.0.0
**日期**: 2026-02-08
