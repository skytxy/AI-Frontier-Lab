# 中文编码配置指南

## 问题症状

- Git log 显示中文为乱码：`\344\270\255\346\226\207`
- 文件名显示为转义字符
- 终端输出乱码

## ✅ 解决方案

### 1. Git 配置（已完成）

```bash
# 禁用路径转义，显示中文文件名
git config --global core.quotepath false

# 提交使用 UTF-8
git config --global i18n.commitencoding utf-8

# 日志输出使用 UTF-8
git config --global i18n.logoutputencoding utf-8
```

### 2. 终端/Shell 配置

**macOS (zsh)** - 编辑 `~/.zshrc`:

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

**macOS (bash)** - 编辑 `~/.bash_profile`:

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

**Linux** - 编辑 `~/.bashrc`:

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

**Windows (PowerShell)** - 编辑 `$PROFILE`:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:LANG = "en_US.UTF-8"
```

### 3. 编辑器配置

**VS Code** - 设置 `settings.json`:

```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false
}
```

**Vim/Neovim** - 编辑 `~/.vimrc` 或 `~/.config/nvim/init.vim`:

```vim
set encoding=utf-8
set fileencoding=utf-8
set termencoding=utf-8
```

### 4. 验证配置

```bash
# 检查 locale
locale

# 应该看到：
# LANG=en_US.UTF-8
# LC_ALL=en_US.UTF-8

# 检查 Git 配置
git config --global --list | grep -E "(quotepath|i18n)"

# 应该看到：
# core.quotepath=false
# i18n.commitencoding=utf-8
# i18n.logoutputencoding=utf-8
```

## 🔧 常见问题

### Q1: Git log 仍然显示乱码？

**A**: 可能是历史提交的编码问题。强制使用 UTF-8 显示：

```bash
git --no-pager --utf-8 log
```

或设置别名：

```bash
git config --global alias.lg "log --utf-8 --decorate --date=short --graph"
```

### Q2: 某些文件名仍然乱码？

**A**: 可能是文件系统编码问题（Windows 常见）：

```bash
# macOS/Linux (检查)
ls -la | grep 中文

# Windows PowerShell (检查)
dir | where { $_.Name -match "[\u4e00-\u9fa5]" }
```

### Q3: Terminal.app 不支持中文？

**A**: 更换终端或调整设置：

```bash
# 安装 iTerm2 (推荐)
brew install --cask iterm2

# 或使用 Warp
brew install --cask warp
```

## 📝 推荐工作流

1. **所有新文件使用 UTF-8 编码**
   ```bash
   # 创建文件时指定 UTF-8
   echo "中文内容" > 文件.md

   # 验证编码
   file --mime-encoding 文件.md
   ```

2. **转换现有文件为 UTF-8**
   ```bash
   # 检查当前编码
   file --mime-encoding 文件.md

   # 转换为 UTF-8 (macOS/Linux)
   iconv -f GBK -t UTF-8 文件.md > 文件_utf8.md

   # 或使用 dos2unix
   brew install dos2unix
   dos2unix 文件.md
   ```

3. **Git 提交时使用 UTF-8**
   ```bash
   # 正确的中文提交信息
   git commit -m "添加中文文档"

   # 避免使用（虽然也能工作）
   git commit -m "Add Chinese docs"
   ```

## 🎯 最佳实践

✅ **DO**:
- 所有文本文件保存为 UTF-8
- Git 配置 `core.quotepath=false`
- 编辑器默认 UTF-8 编码
- Terminal 使用 UTF-8 locale

❌ **DON'T**:
- 混合使用多种编码
- 依赖系统默认编码
- 在文件名中使用特殊字符（中文、emoji）
- 忽略 locale 设置

## 🚀 自动化脚本

创建 `~/.utf8-setup.sh`:

```bash
#!/bin/bash

echo "🔧 配置 UTF-8 环境..."

# Git 配置
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8

# Shell 配置
if [[ "$SHELL" == *"zsh"* ]]; then
  echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
  echo 'export LC_ALL=en_US.UTF-8' >> ~/.zshrc
  echo "✅ zsh 配置已添加"
elif [[ "$SHELL" == *"bash"* ]]; then
  echo 'export LANG=en_US.UTF-8' >> ~/.bash_profile
  echo 'export LC_ALL=en_US.UTF-8' >> ~/.bash_profile
  echo "✅ bash 配置已添加"
fi

echo "✅ UTF-8 配置完成！请重启终端。"
```

运行：

```bash
chmod +x ~/.utf8-setup.sh
~/.utf8-setup.sh
```

## 📚 参考资料

- [Git 中文乱码解决方案](https://zhuanlan.zhihu.com/p/380598986)
- [UTF-8 编码详解](https://www.fileformat.info/info/unicode/utf8.htm)
- [Locale 设置指南](https://www.linux.org/docs/man5/locale.5.html)

---

**最后更新**: 2026-02-07

**适用**: macOS, Linux, Windows (WSL/Git Bash)
