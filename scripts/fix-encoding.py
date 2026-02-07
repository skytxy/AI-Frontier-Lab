#!/usr/bin/env python3
"""
乱码扫描和修复工具（字节级处理版本）

扫描所有 Markdown 文件，检测并修复常见的编码问题：
- Unicode 替换字符
- 其他字节级乱码

使用方法：
  python3 scripts/fix-encoding.py <file>
  python3 scripts/fix-encoding.py --all  # 修复所有文件
  python3 scripts/fix-encoding.py        # 检查所有文件
"""

import sys
import os
from pathlib import Path

# Unicode 替换字符的 UTF-8 字节序列
REPLACEMENT_BYTES = b'\xef\xbf\xbd'


def check_file(filepath):
    """检查单个文件的编码问题"""
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
    except Exception as e:
        return [f"读取错误: {e}"]

    issues = []
    count = content.count(REPLACEMENT_BYTES)
    if count > 0:
        issues.append(f"Unicode 替换字符: {count} 个")
    return issues


def fix_file(filepath):
    """修复单个文件的编码问题（字节级处理）"""
    print(f"修复文件: {filepath}")

    try:
        with open(filepath, 'rb') as f:
            content = f.read()
    except Exception as e:
        print(f"  ✗ 无法读取文件: {e}")
        return False

    original_content = content
    count = content.count(REPLACEMENT_BYTES)

    if count > 0:
        print(f"  - Unicode 替换字符: {count} 个 -> 修复")
        content = content.replace(REPLACEMENT_BYTES, b'')

    if content == original_content:
        print(f"  ✓ 无需修复")
        return True

    try:
        with open(filepath, 'wb') as f:
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

    for md_file in Path(directory).rglob('*.md'):
        if 'node_modules' in str(md_file) or '.git' in str(md_file):
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
        print("检查所有 Markdown 文件...\n")
        directories = ['.', 'topics', 'docs', '.claude', 'site']
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
            print("\n❌ 发现编码问题，运行: python3 scripts/fix-encoding.py --all")
            return 1

    elif sys.argv[1] == '--all':
        print("修复所有 Markdown 文件...\n")
        fixed = failed = 0
        for md_file in Path('.').rglob('*.md'):
            if 'node_modules' in str(md_file) or '.git' in str(md_file):
                continue
            if fix_file(md_file):
                fixed += 1
            else:
                failed += 1
        print(f"\n结果: {fixed} 个已修复, {failed} 个失败")
        return 0 if failed == 0 else 1
    else:
        filepath = sys.argv[1]
        if not os.path.exists(filepath):
            print(f"错误: 文件不存在: {filepath}")
            return 1
        return 0 if fix_file(Path(filepath)) else 1


if __name__ == '__main__':
    sys.exit(main())
