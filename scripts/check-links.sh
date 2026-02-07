#!/usr/bin/env bash
###############################################################################
# 链接检查脚本
#
# 检查 Markdown 文件中的所有链接：
# 1. 内部链接（指向本仓库）
# 2. 外部链接（指向 GitHub 等）
#
# 使用方法：
#   bash scripts/check-links.sh
###############################################################################

set -euo pipefail

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  链接质量检查 v1.0${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 统计
TOTAL_LINKS=0
INTERNAL_LINKS=0
EXTERNAL_LINKS=0
BROKEN_INTERNAL=0
BROKEN_EXTERNAL=0
CHECKED_EXTERNAL=0

# 临时文件
BROKEN_LINKS=$(mktemp)
trap "rm -f $BROKEN_LINKS" EXIT

# 检查内部链接是否存在
check_internal_link() {
    local link=$1
    local source_file=$2

    # 移除可能的锚点
    local path="${link%%#*}"

    # 尝试不同的路径
    local possible_paths=(
        "$path"                                    # 相对于当前文件
        "$(dirname "$source_file")/$path"          # 相对于源文件目录
        "topics/$path"                              # 相对于 topics/
        "site/$path"                                # 相对于 site/
        "$path"                                     # 绝对路径
    )

    for possible_path in "${possible_paths[@]}"; do
        if [[ -f "$possible_path" ]] || [[ -d "$possible_path" ]]; then
            return 0
        fi
    done

    return 1
}

# 检查外部链接
check_external_link() {
    local url=$1

    # 跳过某些不需要检查的
    case "$url" in
        *localhost*|*127.0.0.1*|*0.0.0.0*)
            return 0  # 本地链接跳过
            ;;
        *anthropic.com*)
            return 0  # Anthropic 链接跳过（可能有反爬）
            ;;
    esac

    # 使用 curl 检查（仅检查 HTTP 状态）
    if curl -s -L -I -m 5 --connect-timeout 3 "$url" 2>/dev/null | grep -q "HTTP.*2[0-9][0-9]"; then
        return 0
    fi

    return 1
}

# 查找并检查所有 Markdown 文件
echo -e "${BLUE}正在扫描 Markdown 文件...${NC}"
echo ""

while IFS= read -r -d '' mdfile; do
    filename=$(basename "$mdfile")
    rel_path=${mdfile#./}

    echo -e "${BLUE}检查: $rel_path${NC}"

    # 提取所有链接
    # 匹配: [text](url) 或 [text](url "title")
    grep -oP '\[[^\]]*\]\([^\)]+\)' "$mdfile" 2>/dev/null | while read -r match; do
        # 提取 URL 部分
        url=$(echo "$match" | sed -n 's/.*\[\([^]]*\)\].*/\1/p')

        # 移除标题部分
        url=${url%% *}

        ((TOTAL_LINKS++))

        if [[ "$url =~ ^https?:// ]] || [[ "$url" =~ ^// ]]; then
            # 外部链接
            ((EXTERNAL_LINKS++))

            # 快速检查常见的外部链接
            if [[ "$url" =~ github\.com ]] && [[ ! "$url" =~ skytxy/AI-Frontier-Lab ]]; then
                echo -e "  ${YELLOW}⚠${NC} 外部链接: $url"
                echo "$rel_path:$url" >> "$BROKEN_LINKS"
            fi
        else
            # 内部链接
            ((INTERNAL_LINKS++))

            if ! check_internal_link "$url" "$mdfile"; then
                ((BROKEN_INTERNAL++))
                echo -e "  ${RED}✗${NC} 内部链接404: $url"
                echo "$rel_path:$url" >> "$BROKEN_LINKS"
            fi
        fi
    done

    echo ""
done < <(find . -name "*.md" -print0)

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  检查统计${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "总链接数:       $TOTAL_LINKS"
echo -e "${GREEN}内部链接:       ${INTERNAL_LINKS}${NC}"
echo -e "${RED}内部404:       ${BROKEN_INTERNAL}${NC}"
echo -e "外部链接:       ${EXTERNAL_LINKS}"
echo ""

# 显示问题详情
if [[ -s "$BROKEN_LINKS" ]]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  问题链接列表${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    while IFS=: read -r issue; do
        echo -e "  ${RED}✗${NC} $issue"
    done < "$BROKEN_LINKS"

    echo ""
    echo -e "${YELLOW}建议：${NC}"
    echo "  1. 检查文件路径是否正确"
    echo "  2. 确认外部链接是否有效"
    echo "  3. 修复后重新运行检查"
    echo ""

    exit 1
else
    echo -e "${GREEN}✓ 所有链接检查通过！${NC}"
    echo ""
    exit 0
fi
