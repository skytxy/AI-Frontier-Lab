#!/usr/bin/env tsx
/**
 * Link Validator - Checks for broken internal links in the built site
 *
 * This script scans the built HTML files and verifies that all internal links
 * point to pages that actually exist.
 */

import fs from 'fs/promises';
import path from 'path';

interface LinkIssue {
  from: string;
  href: string;
  reason: string;
  type: 'internal' | 'external';
}

// Get all built HTML files recursively
async function getHtmlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Normalize a path to match our internal representation
function normalizePath(filePath: string, distDir: string): string {
  const relative = path.relative(distDir, filePath);
  const withoutExt = relative.replace(/\.html$/, '');
  // Handle both "index" and "/index" and "foo/index" cases
  const withoutIndex = withoutExt.replace(/(\/)?index$/, '');
  // If empty or just "index", return root
  if (!withoutIndex || withoutIndex === 'index') {
    return '/';
  }
  // Ensure leading slash for consistency
  return withoutIndex.startsWith('/') ? withoutIndex : '/' + withoutIndex;
}

// Check if a URL is accessible
async function checkUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    // Consider 2xx and 3xx as success, 404 as failure, 429/5xx as warnings
    if (response.status >= 200 && response.status < 400) {
      return true;
    }
    if (response.status === 404) {
      return false;
    }
    // For other status codes, warn but don't fail
    console.warn(`  [Warning] ${url} returned status ${response.status}`);
    return true;
  } catch (err) {
    // Network errors, timeouts, etc. - warn but don't fail
    if ((err as Error).name === 'AbortError') {
      console.warn(`  [Warning] ${url} timed out`);
    } else {
      console.warn(`  [Warning] ${url} failed: ${(err as Error).message}`);
    }
    return true; // Don't fail the build for network issues
  }
}

async function main() {
  const scriptDir = new URL('.', import.meta.url).pathname;
  const distDir = path.join(scriptDir, '../dist');
  const htmlFiles = await getHtmlFiles(distDir);

  // Extract all valid paths from built files
  const validPaths = new Set<string>();
  for (const file of htmlFiles) {
    const normalized = normalizePath(file, distDir);
    validPaths.add(normalized);
    // Also add with trailing slash variants
    if (normalized !== '/') {
      validPaths.add(normalized + '/');
    }
    // Also add .md variants for content links
    if (normalized !== '/') {
      validPaths.add(normalized + '.md');
    }
  }

  console.log(`[Link Validator] Found ${validPaths.size} valid internal paths`);

  // Check each HTML file for broken links
  const issues: LinkIssue[] = [];
  let totalLinks = 0;
  let internalLinks = 0;
  let externalLinks = 0;

  for (const file of htmlFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const sourcePath = normalizePath(file, distDir);

    // Find all href attributes in <a> tags
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      totalLinks++;
      const href = match[1];

      // Handle external links
      if (href.startsWith('http://') || href.startsWith('https://')) {
        externalLinks++;

        // Check GitHub links for 404
        if (href.includes('github.com')) {
          const isAccessible = await checkUrl(href);
          if (!isAccessible) {
            issues.push({
              from: sourcePath,
              href,
              reason: 'external link returned 404',
              type: 'external',
            });
          }
        }
        continue;
      }

      // Skip anchors
      if (href.startsWith('#')) {
        continue;
      }

      // Skip mailto, tel, etc.
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      internalLinks++;

      // Normalize the path
      let targetPath = href.split('#')[0]; // Remove anchor
      if (targetPath.endsWith('/')) {
        targetPath = targetPath.slice(0, -1);
      }
      if (targetPath === '') {
        targetPath = '/';
      }

      // Handle relative paths like "experiments/xxx" or "../sibling"
      if (targetPath.startsWith('./') || targetPath.startsWith('../') || !targetPath.startsWith('/')) {
        // Resolve relative to source directory
        const sourceDir = path.dirname(sourcePath === '/' ? '' : sourcePath);
        const resolved = path.normalize(path.join('/', sourceDir, targetPath));
        targetPath = resolved.startsWith('/') ? resolved : '/' + resolved;
      }

      // Check for .md links that should map to HTML
      if (targetPath.endsWith('.md')) {
        const htmlPath = targetPath.replace(/\.md$/, '');
        if (!validPaths.has(targetPath) && !validPaths.has(htmlPath)) {
          issues.push({
            from: sourcePath,
            href,
            reason: `neither ${targetPath} nor ${htmlPath} exists`,
            type: 'internal',
          });
        }
        continue;
      }

      // Check if the path exists
      if (!validPaths.has(targetPath)) {
        issues.push({
          from: sourcePath,
          href,
          reason: `path ${targetPath} not found`,
          type: 'internal',
        });
      }
    }
  }

  console.log(`[Link Validator] Checked ${totalLinks} links (${internalLinks} internal, ${externalLinks} external)`);

  // Report results
  if (issues.length > 0) {
    console.error(`\n[Link Validator] Found ${issues.length} broken links:\n`);

    // Group by type and source file
    const byType = new Map<string, LinkIssue[]>();
    for (const issue of issues) {
      const key = issue.type;
      if (!byType.has(key)) {
        byType.set(key, []);
      }
      byType.get(key)!.push(issue);
    }

    for (const [type, typeIssues] of byType) {
      console.error(`\n  ${type.toUpperCase()} Links:\n`);

      const bySource = new Map<string, LinkIssue[]>();
      for (const issue of typeIssues) {
        if (!bySource.has(issue.from)) {
          bySource.set(issue.from, []);
        }
        bySource.get(issue.from)!.push(issue);
      }

      for (const [source, sourceIssues] of bySource) {
        console.error(`    ${source}:`);
        for (const issue of sourceIssues) {
          console.error(`      -> ${issue.href} (${issue.reason})`);
        }
      }
    }

    console.error(`\n[Link Validator] ❌ FAILED: ${issues.length} broken links found`);
    process.exit(1);
  } else {
    console.log('[Link Validator] ✅ All links are valid');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[Link Validator] Error:', err);
  process.exit(1);
});
