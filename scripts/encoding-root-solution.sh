#!/bin/bash
#
# 根治方案：确保所有文件操作使用 UTF-8
#
# 使用方法：
#   source scripts/encoding-root-solution.sh
#

# 1. 设置 locale
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 2. Git 配置（全局，一次设置）
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
git config --global gui.encoding utf-8

# 3. Python UTF-8 模式
export PYTHONIOENCODING=utf-8

# 4. Node.js UTF-8 模式
export NODE_OPTIONS=--max-old-space-size=4096

echo "Encoding root solution loaded."
echo "Locale: $LANG"
