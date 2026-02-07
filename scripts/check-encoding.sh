#!/usr/bin/env bash
###############################################################################
# 编码检测和修复脚本
#
# 功能：
# 1. 检测所有源文件是否为 UTF-8 编码
# 2. 检测 HTML 文件是否包含 charset="UTF-8"
# 3. 自动修复非 UTF-8 文件
# 4. 生成编码问题报告
#
# 使用方法：
#   ./scripts/check-encoding.sh           # 检查所有文件
#   ./scripts/check-encoding.sh fix       # 自动修复问题
#   ./scripts/check-encoding.sh report    # 生成详细报告
###############################################################################

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
TOTAL_FILES=0
UTF8_FILES=0
NON_UTF8_FILES=0
HTML_FILES=0
HTML_NO_CHARSET=0

# 问题文件列表
declare -a PROBLEM_FILES

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  编码检测工具 v1.0${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 参数处理
MODE=${1:-check}
AUTO_FIX=${2:-false}

if [[ "$MODE" == "fix" ]]; then
    AUTO_FIX=true
fi

# 检查函数
check_file() {
    local file=$1
    local encoding=$(file --mime-encoding "$file" 2>/dev/null | awk '{print $2}')

    ((TOTAL_FILES++))

    # 检查是否为 UTF-8
    if [[ "$encoding" == "utf-8" ]]; then
        ((UTF8_FILES++))
        echo -e "${GREEN}✓${NC} $file"
    else
        ((NON_UTF8_FILES++))
        PROBLEM_FILES+=("$file ($encoding)")

        if [[ "$AUTO_FIX" == "true" ]]; then
            echo -e "${YELLOW}⚠${NC} $file - ${RED}检测到非 UTF-8 编码: $encoding${NC}"
            echo -e "${BLUE}  → 修复中...${NC}"

            # 尝试转换编码
            if iconv -f "$encoding" -t UTF-8 "$file" > "$file.utf8.tmp" 2>/dev/null; then
                mv "$file.utf8.tmp" "$file"
                echo -e "${GREEN}  ✓ 已修复${NC}"
            else
                echo -e "${RED}  ✗ 修复失败，跳过${NC}"
                rm -f "$file.utf8.tmp"
            fi
        else
            echo -e "${RED}✗${NC} $file - ${RED}非 UTF-8 编码: $encoding${NC}"
        fi
    fi

    # 如果是 HTML 文件，检查 charset
    if [[ "$file" == *.html ]] || [[ "$file" == *.htm ]]; then
        ((HTML_FILES++))

        if ! grep -q 'charset="UTF-8"' "$file" && ! grep -q 'charset=utf-8' "$file"; then
            ((HTML_NO_CHARSET++))
            echo -e "${YELLOW}⚠${NC} $file - ${YELLOW}缺少 charset 声明${NC}"

            if [[ "$AUTO_FIX" == "true" ]]; then
                # 自动添加 charset（在 <head> 后添加）
                sed -i.tmp 's|<head>|<head><meta charset="UTF-8">|' "$file"
                rm -f "$file.tmp"
                echo -e "${GREEN}  ✓ 已添加 charset${NC}"
            fi
        fi
    fi
}

# 遍历文件
echo -e "${BLUE}正在检查文件...${NC}"
echo ""

# 检查源文件
if [[ -d "src" ]]; then
    while IFS= read -r -d '' file; do
        check_file "$file"
    done < <(find src -type f \( -name "*.astro" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -print0)
fi

# 检查构建输出
if [[ -d "dist" ]]; then
    while IFS= read -r -d '' file; do
        check_file "$file"
    done < <(find dist -type f \( -name "*.html" -o -name "*.js" \) -print0)
fi

# 检查内容文件（topics 目录）
if [[ -d "../topics" ]]; then
    while IFS= read -r -d '' file; do
        check_file "$file"
    done < <(find ../topics -type f \( -name "*.md" -o -name "*.json" \) -print0)
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  检测统计${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "总文件数:     ${TOTAL_FILES}"
echo -e "${GREEN}UTF-8 文件:   ${UTF8_FILES}${NC}"
echo -e "${RED}非 UTF-8 文件: ${NON_UTF8_FILES}${NC}"
echo ""
echo -e "HTML 文件:    ${HTML_FILES}"
echo -e "${YELLOW}缺少 charset: ${HTML_NO_CHARSET}${NC}"
echo ""

# 显示问题文件
if [[ ${#PROBLEM_FILES[@]} -gt 0 ]]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  问题文件列表${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    for file in "${PROBLEM_FILES[@]}"; do
        echo -e "  ${RED}✗${NC} $file"
    done

    echo ""
    echo -e "${YELLOW}建议运行: $0 fix${NC}"
    echo ""
fi

# 生成报告
if [[ "$MODE" == "report" ]]; then
    REPORT_FILE="encoding-report-$(date +%Y%m%d-%H%M%S).txt"

    echo "编码检测报告" > "$REPORT_FILE"
    echo "生成时间: $(date)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "总文件数: $TOTAL_FILES" >> "$REPORT_FILE"
    echo "UTF-8 文件: $UTF8_FILES" >> "$REPORT_FILE"
    echo "非 UTF-8 文件: $NON_UTF8_FILES" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    if [[ ${#PROBLEM_FILES[@]} -gt 0 ]]; then
        echo "问题文件:" >> "$REPORT_FILE"
        for file in "${PROBLEM_FILES[@]}"; do
            echo "  - $file" >> "$REPORT_FILE"
        done
    fi

    echo ""
    echo -e "${GREEN}✓ 报告已生成: $REPORT_FILE${NC}"
fi

# 返回码
if [[ $NON_UTF8_FILES -gt 0 ]] || [[ $HTML_NO_CHARSET -gt 0 ]]; then
    exit 1
else
    echo -e "${GREEN}✓ 所有文件编码正常！${NC}"
    echo ""
    exit 0
fi
