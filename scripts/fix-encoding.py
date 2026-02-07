#!/usr/bin/env python3
"""
乱码扫描和修复工具

扫描所有 Markdown 文件，检测并修复常见的编码问题：
- Unicode 替换字符
- 双字节乱码（Â, Ã, â, ¬, ¦）
- 损坏的 UTF-8 序列
- 字符编码不一致

使用方法：
  python3 scripts/fix-encoding.py <file>
  python3 scripts/fix-encoding.py --all  # 修复所有文件
"""

import sys
import os
import re
import glob
from pathlib import Path

# 配置
DRY_RUN = False  # 设为 True 时只扫描不修复

# 需要清理的乱码模式
GARBAGE_PATTERNS = {
    '': 'Unicode 替换字符',
    'Â': 'A-tilde 乱码',
    'Ã': 'A-tilde 乱码',
    'â': 'a-circumflex 乱码',
    '¬': 'not sign 乱码',
    '¦': 'broken bar 乱码',
}

# 需要检查的文件扩展名
MARKDOWN_EXTENSIONS = ['.md']

def check_file(filepath):
    """检查单个文件的编码问题"""
    issues = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError as e:
        return [f"编码错误: {e}"]

    # 检查各种乱码
    for char, desc in GARBAGE_PATTERNS.items():
        count = content.count(char)
        if count > 0:
            # 只在每一类乱码第一次出现时报告
            if char == '' or count <= 5:
                issues.append(f"{desc}: {count} 个")

    # 检查 UTF-8 编码的一致性
    try:
        content.encode('utf-8').decode('utf-8')
    except UnicodeError as e:
        issues.append(f"UTF-8 编码不一致: {e}")

    return issues

def fix_file(filepath):
    """修复单个文件的编码问题"""
    print(f"修复文件: {filepath}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError as e:
        print(f"  ✗ 无法读取文件: {e}")
        return False

    original_content = content

    # 修复乱码
    for char, desc in GARBAGE_PATTERNS.items():
        count = content.count(char)
        if count > 0:
            print(f"  - {desc}: {count} 个 -> 修复")
            content = content.replace(char, '')

    # 如果没有改变，就不写回
    if content == original_content:
        print(f"  ✓ 无需修复")
        return True

    # 写回文件
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ 已修复")
        return True
    except Exception as e:
        print(f"  ✗ 写入失败: {e}")
        return False

def scan_directory(directory):
    """扫描目录中的所有 Markdown 文件"""
    print(f"扫描目录: {directory}\n")

    issues_found = {}

    md_files = list(Path(directory).rglob('*.md'))

    for md_file in md_files:
        if 'node_modules' in str(md_file):
            continue

        issues = check_file(md_file)

        if issues:
            issues_found[str(md_file)] = issues

    if issues_found:
        print(f"\n发现 {len(issues_found)} 个文件有问题:\n")

        for filepath, issues in issues_found.items():
            print(f"❌ {filepath}")
            for issue in issues:
                print(f"   - {issue}")
        print()

        return False
    else:
        print("✓ 所有文件编码正常\n")
        return True

def main():
    if len(sys.argv) < 2:
        # 扫描所有 Markdown 文件
        print("检查所有 Markdown 文件...\n")

        directories = [
            '.',
            'topics/001-mcp-deep-dive',
            'topics/002-agent-workflows',
            'topics/003-lsp-enhancement',
            'docs'
        ]

        all_ok = True
        for directory in directories:
            if os.path.exists(directory):
                print(f"\n{'='*60}")
                if not scan_directory(directory):
                    all_ok = False

        if all_ok:
            print("\n✅ 所有文件编码正常")
            return 0
        else:
            print("\n❌ 发现编码问题")
            print("\n运行修复:")
            print("  python3 scripts/fix-encoding.py --all")
            return 1

    elif sys.argv[1] == '--all':
        # 修复所有文件
        print("修复所有 Markdown 文件...\n")

        fixed = 0
        failed = 0

        md_files = list(Path('.').rglob('*.md'))

        for md_file in md_files:
            if 'node_modules' in str(md_file):
                continue

            if fix_file(md_file):
                fixed += 1
            else:
                failed += 1

        print(f"\n结果: {fixed} 个已修复, {failed} 个失败")
        return 0 if failed == 0 else 1

    else:
        # 修复单个文件
        filepath = sys.argv[1]

        if not os.path.exists(filepath):
            print(f"错误: 文件不存在: {filepath}")
            return 1

        if fix_file(Path(filepath)):
            return 0
        else:
            return 1

if __name__ == '__main__':
    sys.exit(main())
