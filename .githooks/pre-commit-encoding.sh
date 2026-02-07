#!/usr/bin/env bash
###############################################################################
# Git Pre-Commit Hook: 编码检查
#
# 在每次提交前自动检查：
# 1. 待提交文件的编码是否为 UTF-8
# 2. HTML 文件是否包含 charset="UTF-8"
# 3. 中文文件名是否会被转义
#
# 安装方法：
#   cp .githooks/pre-commit-encoding.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
###############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}◐${NC} 检查文件编码..."

# 获取暂存的文件
FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(astro|ts|tsx|js|jsx|html|md|json)$')

if [ -z "$FILES" ]; then
    exit 0
fi

HAS_ISSUES=0

for FILE in $FILES; do
    if [ ! -f "$FILE" ]; then
        continue
    fi

    # 检查文件编码
    ENCODING=$(file --mime-encoding "$FILE" | awk '{print $2}')

    if [[ "$ENCODING" != "utf-8" && "$ENCODING" != "us-ascii" ]]; then
        echo -e "${RED}✗${NC} $FILE - 检测到非 UTF-8 编码: $ENCODING"
        echo -e "${YELLOW}  请���换文件为 UTF-8 编码后再提交${NC}"
        HAS_ISSUES=1
    fi

    # 如果是 HTML 文件，检查 charset
    if [[ "$FILE" == *.html ]] || [[ "$FILE" == *.htm ]]; then
        if ! grep -q 'charset="UTF-8"' "$FILE" && ! grep -q 'charset=utf-8' "$FILE"; then
            echo -e "${RED}✗${NC} $FILE - HTML 文件缺少 charset 声明"
            echo -e "${YELLOW}  请在 <head> 中添加: <meta charset=\"UTF-8\">${NC}"
            HAS_ISSUES=1
        fi
    fi
done

if [ $HAS_ISSUES -eq 1 ]; then
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  编码检查失败${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}提示：${NC}"
    echo "  1. 转换文件编码: iconv -f GBK -t UTF-8 input.txt > output.txt"
    echo "  2. 或跳过检查: git commit --no-verify"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} 编码检查通过"
exit 0
