#!/usr/bin/env bash
###############################################################################
# 构建质量验证脚本
#
# 在每次构建后自动运行，确保：
# 1. 无乱码字符（Unicode 替换字符）
# 2. 所有 HTML 都有 charset 声明
# 3. 中文文本正确显示
# 4. 无损坏的特殊字符
#
# 使用方法：
#   npm run build && bash scripts/verify-build-quality.sh
#
# 或集成到 package.json：
#   "build": "astro build && bash ../scripts/verify-build-quality.sh"
###############################################################################

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  构建质量验证 v1.1${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/site/dist"

if [[ ! -d "$DIST_DIR" ]]; then
    echo -e "${RED}✗ 错误：找不到构建输出目录 $DIST_DIR${NC}"
    echo -e "${YELLOW}请先运行: cd site && npm run build${NC}"
    exit 1
fi

# 统计数据
TOTAL_HTML=0
HAS_CHARSET=0
NO_CHARSET=0
HAS_GARBAGE=0
HAS_DOUBLEBYTE=0
TOTAL_ISSUES=0

# 临时文件存储问题
ISSUES_FILE=$(mktemp)
trap "rm -f $ISSUES_FILE" EXIT

echo -e "${BLUE}正在检查 HTML 文件...${NC}"
echo ""

# 查找所有 HTML 文件
while IFS= read -r -d '' html_file; do
    ((TOTAL_HTML++))
    filename=$(basename "$html_file")
    rel_path=${html_file#$DIST_DIR/}

    # 检查 1: charset 声明
    if grep -q 'charset="UTF-8"' "$html_file" || grep -q 'charset=utf-8' "$html_file"; then
        ((HAS_CHARSET++))
        echo -e "${GREEN}✓${NC} $rel_path - charset OK"
    else
        ((NO_CHARSET++))
        echo -e "${RED}✗${NC} $rel_path - ${RED}缺少 charset 声明${NC}"
        echo "$rel_path: 缺少 charset" >> "$ISSUES_FILE"
        ((TOTAL_ISSUES++))
    fi

    # 检查 2 & 3: 使用 Python 进行可靠的编码检查
    check_result=$(python3 -c "
import sys
filepath = sys.argv[1]

# Read as bytes for accurate detection
with open(filepath, 'rb') as f:
    content_bytes = f.read()

issues = []

# Check for Unicode replacement character U+FFFD (0xEF 0xBF 0xBD)
replacement_bytes = b'\xef\xbf\xbd'
count = content_bytes.count(replacement_bytes)
if count > 0:
    issues.append(f'Unicode_replacement_char:{count}')

# Check for common double-byte encoding corruption patterns
# These appear when UTF-8 is decoded as Latin-1
corruption_patterns = [
    b'\xc3\x82',  # Â
    b'\xc3\x83',  # Ã
    b'\xc2\xae',  # ®
    b'\xc2\xac',  # ¬
    b'\xc2\xa6',  # ¦
    b'\xe2\x80\xcb',  # ‹
]
for pattern in corruption_patterns:
    if pattern in content_bytes:
        issues.append(f'double_byte_corruption')
        break

if issues:
    print(','.join(issues))
    sys.exit(1)
else:
    print('OK')
    sys.exit(0)
" "$html_file" 2>/dev/null || echo "ERROR")

    if [[ "$check_result" == *"Unicode_replacement_char"* ]]; then
        ((HAS_GARBAGE++))
        echo -e "${RED}✗${NC} $rel_path - ${RED}发现乱码字符 ${NC}"
        echo "$rel_path: 包含 Unicode 替换字符" >> "$ISSUES_FILE"
        ((TOTAL_ISSUES++))
    fi

    if [[ "$check_result" == *"double_byte_corruption"* ]]; then
        ((HAS_DOUBLEBYTE++))
        echo -e "${RED}✗${NC} $rel_path - ${RED}发现双字节乱码${NC}"
        echo "$rel_path: 包含双字节乱码字符" >> "$ISSUES_FILE"
        ((TOTAL_ISSUES++))
    fi

    # 检查 4: 学习路线等关键文本
    if [[ "$filename" == "001-mcp-deep-dive" ]]; then
        if ! grep -q "学习路线.*协议拦截.*Server 实现.*Client 手写.*安全攻防" "$html_file"; then
            echo -e "${YELLOW}⚠${NC} $rel_path - ${YELLOW}学习路线文本可能有问题${NC}"
            echo "$rel_path: 学习路线文本异常" >> "$ISSUES_FILE"
        fi
    fi

done < <(find "$DIST_DIR" -type f -name "*.html" -print0)

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  检查统计${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "总 HTML 文件:     ${TOTAL_HTML}"
echo -e "${GREEN}有 charset:      ${HAS_CHARSET}${NC}"
echo -e "${RED}无 charset:      ${NO_CHARSET}${NC}"
echo -e "${RED}包含乱码:        ${HAS_GARBAGE}${NC}"
echo -e "${RED}双字节乱码:      ${HAS_DOUBLEBYTE}${NC}"
echo -e "${RED}总问题数:        ${TOTAL_ISSUES}${NC}"
echo ""

# 如果有问题，显示详情并退出
if [[ $TOTAL_ISSUES -gt 0 ]]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  问题详情${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    while IFS= read -r issue; do
        echo -e "  ${RED}✗${NC} $issue"
    done < "$ISSUES_FILE"

    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ❌ 构建质量检查失败！${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}建议操作：${NC}"
    echo "  1. 检查源文件编码: file --mime-encoding topics/**/*.md"
    echo "  2. 运行编码修复: pre-commit run --all-files"
    echo "  3. 重新构建: cd site && npm run build"
    echo ""

    exit 1
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ 构建质量检查通过！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit 0
