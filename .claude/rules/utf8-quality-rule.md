# UTF-8 编码质量保证规则

**重要**: 此规则确保所有生成的代码和文档都使用正确的 UTF-8 编码，杜绝中文乱码。

## 规则

### 1. 文件编码规范

**所有文本文件必须使用 UTF-8 编码（无 BOM）**

```bash
# ✅ 正确
file.txt: UTF-8 Unicode text

# ❌ 错误
file.txt: ISO-8859 text
file.txt: UTF-8 Unicode text, with BOM
```

### 2. HTML 文件必须包含 charset

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">  <!-- 必须在 <title> 之前 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面标题</title>
</head>
```

**检查点**:
- `<meta charset="UTF-8">` 必须是 `<head>` 的第一个子元素
- 字符集必须是大写 `UTF-8` 或小写 `utf-8`

### 3. Markdown 文件编码

创建 Markdown 文件时，必须：

```bash
# 方法1: 使用 heredoc (推荐)
cat > file.md << 'EOF'
# 中文标题

内容...
EOF

# 方法2: 直接使用 UTF-8 编码
echo "# 中文标题" > file.md

# ❌ 禁止: 使用 printf 或 echo -e 可能导致编码问题
```

### 4. 特殊字符处理

**中文标点符号使用规范**:

| 符号类型 | 推荐使用 | 避免使用 |
|---------|---------|---------|
| 冒号 | `:` 或 `：` | 混用 |
| 引号 | `"` 和 `'` | `"` 和 `'` (全角) |
| 括号 | `()` | `（）` (全角) |
| 逗号 | `,` 或 `，` | 混用 |

**一致性**: 在同一文档中保持标点符号风格一致

### 5. Astro 组件编码

```astro
---
// 组件头部必须添加 UTF-8 声明
---

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
```

### 6. 环境变量和配置

在 `package.json` 中添加:

```json
{
  "scripts": {
    "check-encoding": "bash scripts/check-encoding.sh",
    "fix-encoding": "bash scripts/check-encoding.sh fix"
  }
}
```

### 7. Git 配置

**全局配置** (必须):

```bash
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
```

### 8. Pre-commit 检查

每次提交前自动运行编码检查:

```bash
# .git/hooks/pre-commit
#!/bin/bash
bash scripts/check-encoding.sh
```

## 常见乱码及修复

### 问题1: Unicode 替换字符 ``

**原因**: 文件包含无法解码的字节

**修复**:
```bash
# 找到问题文件
grep -r '' dist/

# 转换源文件为 UTF-8
iconv -f GBK -t UTF-8 input.txt > output.txt
```

### 问题2: 中文显示为问号 `?`

**原因**: 编码声明缺失或错误

**修复**:
```html
<!-- HTML -->
<head>
    <meta charset="UTF-8">
</head>

<!-- CSS -->
@charset "UTF-8";
```

### 问题3: 全角/半角混用

**检查**:
```bash
# 检查全角冒号
grep -r '：' file.html

# 转换为半角
sed 's/：/:/g' file.html
```

## 质量检查清单

创建文件前:
- [ ] 确认编辑器默认编码为 UTF-8
- [ ] 禁止 UTF-8 BOM
- [ ] 设置正确的 line ending (LF for Unix/macOS)

创建文件时:
- [ ] HTML 包含 `<meta charset="UTF-8">`
- [ ] 使用 UTF-8 编码保存
- [ ] 检查特殊字符显示正常

提交前:
- [ ] 运行 `npm run check-encoding`
- [ ] 检查 Git 配置正确
- [ ] 验证构建输出无乱码

## 自动化工具

### 1. 编码检查脚本

```bash
# 检查所有文件
npm run check-encoding

# 自动修复
npm run fix-encoding
```

### 2. Pre-commit Hook

自动在提交前检查编码（已配置）

### 3. CI/CD 集成

```yaml
# .github/workflows/encoding-check.yml
name: Encoding Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check UTF-8 encoding
        run: bash scripts/check-encoding.sh
```

## 紧急修复

如果发现乱码：

```bash
# 1. 停止构建
npm run build -- --mode=development

# 2. 检查源文件编码
file --mime-encoding src/**/*.astro

# 3. 修复编码
iconv -f $(file --mime-encoding file.txt | awk '{print $2}') -t UTF-8 file.txt > file.utf8
mv file.utf8 file.txt

# 4. 重新构建
npm run build

# 5. 验证
python3 -c "with open('dist/index.html') as f: content = f.read(); print('✓' if '' not in content else '✗')"
```

## 监控和维护

### 每周检查

```bash
# 生成编码报告
bash scripts/check-encoding.sh report
```

### 每月审查

- 检查新增文件的编码
- 更新编码检查规则
- 优化自动化工具

---

**版本**: 1.0.0
**最后更新**: 2026-02-07
**维护者**: AI Frontier Lab
