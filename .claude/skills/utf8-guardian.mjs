/**
 * UTF-8 Guardian Skill
 *
 * 自动检测和修复 UTF-8 编码问题
 *
 * 功能：
 * - 检测文件编码
 * - 自动转换非 UTF-8 文件
 * - 验证 HTML charset
 * - Git 编码配置
 * - Pre-commit 检查
 *
 * 使用方法：
 *   /utf8-check          - 检查所有文件编码
 *   /utf8-fix            - 自动修复编码问题
 *   /utf8-report         - 生成详细报告
 *   /utf8-git            - 配置 Git UTF-8 支持
 *   /utf8-hook           - 安装 pre-commit hook
 */

import { Bash } from 'caller';

export default {
  id: 'utf8-guardian',
  name: 'UTF-8 编码卫士',
  description: '自动检测和修复 UTF-8 编码问题，防止中文乱码',
  version: '1.0.0',
  author: 'AI Frontier Lab',

  parameters: {
    action: {
      type: 'string',
      description: '操作类型：check, fix, report, git, hook',
      required: true,
    },
    path: {
      type: 'string',
      description: '要检查的路径（可选，默认当前目录）',
      required: false,
    },
  },

  async execute({ action, path = '.' }) {
    const bash = new Bash();

    switch (action) {
      case 'check':
        return await checkEncoding(bash, path);
      case 'fix':
        return await fixEncoding(bash, path);
      case 'report':
        return await generateReport(bash, path);
      case 'git':
        return await configureGit(bash);
      case 'hook':
        return await installHook(bash);
      default:
        return {
          success: false,
          message: `未知操作: ${action}`,
          hint: '可用操作: check, fix, report, git, hook',
        };
    }
  },
};

/**
 * 检查文件编码
 */
async function checkEncoding(bash, path) {
  const result = await bash.run(`
    find "${path}" -type f \\
      \( -name "*.astro" -o -name "*.ts" -o -name "*.tsx" \\
      -o -name "*.js" -o -name "*.jsx" -o -name "*.html" \\
      -o -name "*.md" -o -name "*.json" \) \\
      -exec file --mime-encoding {} \\; \\
      | grep -v "utf-8" | grep -v "us-ascii" || true
  `);

  if (result.stdout.trim() === '') {
    return {
      success: true,
      message: '✓ 所有文件都是 UTF-8 编码',
      files: 0,
    };
  }

  const problems = result.stdout.trim().split('\n').filter(Boolean);
  return {
    success: false,
    message: `⚠ 发现 ${problems.length} 个非 UTF-8 文件`,
    files: problems.length,
    problems,
  };
}

/**
 * 修复编码问题
 */
async function fixEncoding(bash, path) {
  const check = await checkEncoding(bash, path);

  if (check.success) {
    return {
      success: true,
      message: '无需修复，所有文件编码正常',
    };
  }

  const fixed = [];
  const failed = [];

  for (const problem of check.problems) {
    const [, file, encoding] = problem.match(/^(.+?):\s*(.+)$/);

    try {
      // 尝试转换编码
      await bash.run(`
        iconv -f ${encoding} -t UTF-8 "${file}" > "${file}.utf8.tmp" 2>/dev/null \\
        && mv "${file}.utf8.tmp" "${file}"
      `);
      fixed.push(file);
    } catch (error) {
      failed.push({ file, error: error.message });
    }
  }

  return {
    success: failed.length === 0,
    message: `✓ 修复了 ${fixed.length} 个文件`,
    fixed,
    failed,
  };
}

/**
 * 生成报告
 */
async function generateReport(bash, path) {
  const result = await bash.run(`
    total=$(find "${path}" -type f \\
      \( -name "*.astro" -o -name "*.ts" -o -name "*.tsx" \\
      -o -name "*.js" -o -name "*.jsx" -o -name "*.html" \\
      -o -name "*.md" -o -name "*.json" \) | wc -l | tr -d ' ')

    utf8=$(find "${path}" -type f \\
      \( -name "*.astro" -o -name "*.ts" -o -name "*.tsx" \\
      -o -name "*.js" -o -name "*.jsx" -o -name "*.html" \\
      -o -name "*.md" -o -name "*.json" \) \\
      -exec file --mime-encoding {} \\; | grep -c "utf-8")

    non_utf8=$((total - utf8))

    echo "总数: $total"
    echo "UTF-8: $utf8"
    echo "非 UTF-8: $non_utf8"
  `);

  const lines = result.stdout.trim().split('\n');
  const stats = {};
  for (const line of lines) {
    const [key, value] = line.split(': ');
    stats[key] = parseInt(value, 10);
  }

  return {
    success: stats['非 UTF-8'] === 0,
    message: stats['非 UTF-8'] === 0
      ? '✓ 所有文件编码正常'
      : `⚠ 发现 ${stats['非 UTF-8']} 个非 UTF-8 文件`,
    stats,
  };
}

/**
 * 配置 Git
 */
async function configureGit(bash) {
  await bash.run(`
    git config --global core.quotepath false
    git config --global i18n.commitencoding utf-8
    git config --global i18n.logoutputencoding utf-8
    git config --global gui.encoding utf-8
  `);

  return {
    success: true,
    message: '✓ Git UTF-8 配置完成',
    config: {
      'core.quotepath': 'false',
      'i18n.commitencoding': 'utf-8',
      'i18n.logoutputencoding': 'utf-8',
      'gui.encoding': 'utf-8',
    },
  };
}

/**
 * 安装 pre-commit hook
 */
async function installHook(bash) {
  await bash.run(`
    mkdir -p .git/hooks
    cp .githooks/pre-commit-encoding.sh .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
  `);

  return {
    success: true,
    message: '✓ Pre-commit hook 已安装',
    path: '.git/hooks/pre-commit',
  };
}
