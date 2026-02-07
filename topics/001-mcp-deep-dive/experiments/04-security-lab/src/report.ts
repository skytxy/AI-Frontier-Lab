#!/usr/bin/env node
/**
 * Automated Security Report Generator
 *
 * Tests all malicious servers and generates a comprehensive security report.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  description: string;
  evidence?: string;
}

interface SecurityReport {
  timestamp: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

async function runTest(name: string, command: string, args: string[]): Promise<TestResult> {
  console.error(`Running test: ${name}...`);

  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: 'pipe' });
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('exit', (code) => {
      resolve({
        name,
        status: code === 0 ? 'pass' : 'fail',
        description: name,
        evidence: output.slice(0, 500),
      });
    });

    setTimeout(() => {
      proc.kill();
      resolve({
        name,
        status: 'fail',
        description: `${name} (timeout)`,
      });
    }, 5000);
  });
}

async function generateReport(): Promise<void> {
  console.error('🔍 MCP Security Lab - Automated Testing\n');
  console.error('='.repeat(80));

  const results: TestResult[] = [];

  // Test 1: Malicious Server (Annotation Spoofing)
  console.error('\n[Test 1] Annotation Spoofing Detection');
  console.error('-'.repeat(80));
  const test1 = await runTest(
    'Malicious Server Detection',
    'npx',
    ['tsx', 'src/defense-proxy.ts', '--', 'npx', 'tsx', 'src/malicious-server.ts']
  );
  results.push(test1);
  console.error(`Status: ${test1.status.toUpperCase()}`);

  // Test 2: Injection Server Detection
  console.error('\n[Test 2] Prompt Injection Detection');
  console.error('-'.repeat(80));
  const test2 = await runTest(
    'Injection Server Detection',
    'npx',
    ['tsx', 'src/defense-proxy.ts', '--', 'npx', 'tsx', 'src/injection-server.ts']
  );
  results.push(test2);
  console.error(`Status: ${test2.status.toUpperCase()}`);

  // Generate summary
  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
  };

  const report: SecurityReport = {
    timestamp: new Date().toISOString(),
    results,
    summary,
  };

  // Save report
  const reportPath = join(__dirname, '../output/security-report.json');
  await fs.mkdir(join(__dirname, '../output'), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.error('\n' + '='.repeat(80));
  console.error('📊 FINAL REPORT');
  console.error('='.repeat(80));
  console.error(`Total Tests: ${summary.total}`);
  console.error(`Passed: ${summary.passed}`);
  console.error(`Failed: ${summary.failed}`);
  console.error(`\nReport saved to: ${reportPath}`);

  // Print detailed results
  console.error('\n' + '='.repeat(80));
  console.error('DETAILED RESULTS');
  console.error('='.repeat(80));

  for (const result of results) {
    console.error(`\n${result.name}`);
    console.error(`  Status: ${result.status.toUpperCase()}`);
    if (result.evidence) {
      console.error(`  Evidence: ${result.evidence}...`);
    }
  }

  console.error('\n' + '='.repeat(80));
}

generateReport().catch(console.error);
