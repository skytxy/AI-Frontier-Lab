#!/usr/bin/env python3
"""
UTF-8 Encoding Validation Hook for Pre-commit

检查文件是否包含:
1. UTF-8 BOM (字节顺序标记)
2. Unicode 替换字符 (U+FFFD)
3. 无效的 UTF-8 序列

退出码:
  0 - 所有文件有效
  1 - 发现编码问题
"""
import sys
import os
from pathlib import Path

# UTF-8 BOM 字节序列
UTF8_BOM = b'\xef\xbb\xbf'
# Unicode 替换字符的 UTF-8 字节序列
REPLACEMENT_CHAR = b'\xef\xbf\xbd'

# 排除的目录
EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.astro',
    '__pycache__', '.venv', 'venv', '.env'
}

def should_skip(filepath):
    """检查文件是否应该跳过"""
    path_str = str(filepath)
    for exclude in EXCLUDE_DIRS:
        if exclude in path_str:
            return True
    return False

def check_file(filepath):
    """检查单个文件的编码问题"""
    if should_skip(filepath):
        return None  # 跳过

    try:
        with open(filepath, 'rb') as f:
            content = f.read()
    except Exception as e:
        return False, f"无法读取: {e}"

    issues = []

    # 检查 BOM
    if content.startswith(UTF8_BOM):
        issues.append("包含 UTF-8 BOM")

    # 检查 Unicode 替换字符
    count = content.count(REPLACEMENT_CHAR)
    if count > 0:
        issues.append(f"包含 {count} 个 Unicode 替换字符")

    # 尝试解码验证 UTF-8 有效性
    try:
        content.decode('utf-8')
    except UnicodeDecodeError as e:
        issues.append(f"无效的 UTF-8 序列: {e}")

    return len(issues) == 0, "; ".join(issues) if issues else "OK"

def main():
    # Pre-commit 传入文件列表作为参数
    files = sys.argv[1:] if len(sys.argv) > 1 else []

    if not files:
        # 无参数时检查所有 .md 文件
        files = [str(f) for f in Path('.').rglob('*.md')]

    checked = 0
    failed = []
    for filepath in files:
        filepath = Path(filepath)
        if not filepath.is_file():
            continue

        result = check_file(filepath)
        if result is None:  # 跳过
            continue

        checked += 1
        ok, msg = result
        if not ok:
            print(f"❌ {filepath}: {msg}")
            failed.append(str(filepath))

    if failed:
        print(f"\n编码检查失败: {len(failed)} 个文件有问题")
        return 1

    print(f"编码检查通过: {checked} 个文件")
    return 0

if __name__ == '__main__':
    sys.exit(main())
