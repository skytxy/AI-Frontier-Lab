#!/usr/bin/env python3
###############################################################################
# ASCII Art 对齐检查脚本
#
# 检测 markdown 文件中的纯 ASCII art block 是否包含会导致对齐问题的字符。
# 纯 ASCII art 是指用 +|-| 绘制的图表（非 markdown 表格）。
#
# 规则：
# 1. 纯 ASCII art block（包含 +-| 且顶部/底部有 +---+ 边界）不应包含 CJK 字符
# 2. Markdown 表格（|---| 分隔行）不受影响
#
# 使用方法：
#   python3 scripts/check-ascii-art.py path/to/file.md
#   或加入 pre-commit hooks
###############################################################################

import re
import sys
from pathlib import Path

def is_markdown_table_separator(line):
    """检测是否是 markdown 表格分隔行（|---|）"""
    stripped = line.strip()
    if not stripped.startswith('|') or not stripped.endswith('|'):
        return False
    content = stripped[1:-1]
    # 检查是否主要由 -、:、空格组成
    table_pattern = re.compile(r'^[\s\-:|]+$')
    return bool(table_pattern.match(content))

def is_ascii_art_border(line):
    """检测是否是 ASCII art 边界（+---+）"""
    return bool(re.match(r'^\s*\+[\-+\s]*\+\s*$', line))

def contains_cjk(text):
    """检测是否包含 CJK 字符"""
    return bool(re.search(r'[\u4e00-\u9fff\u3400-\u4dbf\u2000-\u206f\u3000-\u303f\uff00-\uffef]', text))

def check_file(filepath):
    """检查单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return [{'error': f'Failed to read file: {e}'}]

    issues = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i].rstrip()
        stripped = line.strip()

        # 检测 ASCII art block 的开始
        if is_ascii_art_border(stripped):
            block_start = i
            block_lines = [line]

            # 收集整个 block
            j = i + 1
            while j < n:
                next_line = lines[j].rstrip()
                next_stripped = next_line.strip()

                # block 结束条件：空行或新的边界
                if not next_stripped:
                    break
                if is_ascii_art_border(next_stripped) and not is_markdown_table_separator(next_line):
                    block_lines.append(next_line)
                    j += 1
                    break

                block_lines.append(next_line)
                j += 1

            # 检查 block 内是否有 CJK 字符（跳过 markdown 表格）
            is_markdown_table = any(
                is_markdown_table_separator(lines[block_start + k].rstrip())
                for k in range(len(block_lines))
                if block_start + k < n
            )

            if not is_markdown_table:
                for k, block_line in enumerate(block_lines):
                    if contains_cjk(block_line):
                        # 找到第一个 CJK 字符的位置
                        for match in re.finditer(r'[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]', block_line):
                            issues.append({
                                'line': block_start + k + 1,
                                'col': match.start() + 1,
                                'content': block_line[:80] + '...' if len(block_line) > 80 else block_line,
                                'char': match.group(),
                                'reason': 'CJK character in ASCII art block causes misalignment'
                            })
                        break  # 每行只报告一次

            i = j
        else:
            i += 1

    return issues

def main():
    if len(sys.argv) < 2:
        print("Usage: check-ascii-art.py <file.md> [file2.md ...]")
        sys.exit(1)

    total_issues = 0
    has_error = False

    for filepath in sys.argv[1:]:
        path = Path(filepath)

        if not path.exists():
            print(f"✗ File not found: {filepath}")
            has_error = True
            continue

        if not path.suffix in ['.md', '.markdown', '.mdown', '.mkd']:
            continue

        issues = check_file(filepath)

        if issues:
            total_issues += len(issues)
            print(f"✗ {filepath}:")
            for issue in issues:
                if 'error' in issue:
                    print(f"  {issue['error']}")
                else:
                    print(f"  Line {issue['line']}, Col {issue['col']}: {issue['reason']}")
                    print(f"    Character: '{issue['char']}'")
                    print(f"    {issue['content']}")
                    print()

    if total_issues > 0:
        print(f"\n✗ Found {total_issues} ASCII art alignment issue(s)")
        print("\n建议修复方法：")
        print("  1. 将 ASCII art 中的中文替换为英文")
        print("  2. 或使用 markdown 表格代替 ASCII art")
        print("  3. 或移除 CJK 字符，改用纯 ASCII 符号")
        sys.exit(1)

    if has_error:
        sys.exit(1)

    print("✓ No ASCII art alignment issues found")
    sys.exit(0)

if __name__ == '__main__':
    main()
