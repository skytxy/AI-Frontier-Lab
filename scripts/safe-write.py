#!/usr/bin/env python3
"""
安全文件写入工具 - 确保纯 UTF-8，杜绝乱码

这是 Claude Code 写入中文文件的标准方式。

使用方法：
  python3 scripts/safe-write.py <filepath> <content>

或作为模块导入：
  from scripts.safe_write import write_file, read_file
  write_file('file.md', '内容')
"""

import sys
import os
from pathlib import Path


def write_file(filepath: str, content: str) -> None:
    """
    安全写入文件，确保纯 UTF-8 编码

    Args:
        filepath: 文件路径
        content: 文件内容（字符串，可以是中文）
    """
    path = Path(filepath)

    # 确保目录存在
    path.parent.mkdir(parents=True, exist_ok=True)

    # 写入时显式指定 UTF-8
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

    # 验证写入的内容
    with open(path, 'r', encoding='utf-8') as f:
        verified = f.read()

    if verified != content:
        raise ValueError(f"Encoding verification failed for {filepath}")

    return True


def read_file(filepath: str) -> str:
    """
    安全读取文件，确保 UTF-8 编码

    Args:
        filepath: 文件路径

    Returns:
        文件内容（字符串）
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 safe-write.py <filepath> <content>")
        print("")
        print("Example:")
        print('  python3 safe-write.py file.md "# 标题\\n\\n内容"')
        sys.exit(1)

    filepath = sys.argv[1]
    content = sys.argv[2]

    # 支持从 stdin 读取内容
    if content == '-':
        content = sys.stdin.read()

    try:
        write_file(filepath, content)
        print(f"Successfully wrote {filepath}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
