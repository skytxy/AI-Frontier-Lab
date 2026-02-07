# 禁止乱码字符规则 (No Garbled Characters)

## 核心规则

1. **所有文件必须使用 UTF-8 编码（无 BOM）**
2. **使用 ASCII 箭头**：`->` `<-` `==>` 而非 `→` `←`
3. **使用 Bash heredoc 或 Python 创建含中文的文件**

## 创建文件的安全方式

```bash
# 推荐：使用 heredoc
cat > file.md << ''EOF''
# 中文标题
内容...
EOF

# 推荐：使用 Python
python3
with open(''file.md'', ''w'', encoding=''utf-8'') as f:
    f.write("中文内容")
```

## 验证

```bash
# 运行 pre-commit 检查
pre-commit run --all-files

# 只检查编码
pre-commit run check-utf8-encoding --all-files
```

## 紧急修复

```bash
python3 scripts/fix-encoding.py --all
```
