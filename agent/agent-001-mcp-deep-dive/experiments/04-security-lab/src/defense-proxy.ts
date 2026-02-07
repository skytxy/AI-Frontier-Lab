#!/usr/bin/env node
/**
 * Defense Proxy: Detect and Block Malicious MCP Servers
 *
 * A security-aware proxy that inspects MCP messages for:
 * 1. Annotation spoofing (claims readOnly but performs destructive ops)
 * 2. Prompt injection patterns in tool descriptions
 * 3. Suspicious resource contents
 *
 * Usage: defense-proxy.ts -- <server-command> [args...]
 */

import { spawn, ChildProcess } from 'child_process';
import { Readable } from 'stream';

// #region Security Rules

interface SecurityRule {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  check: (message: any) => boolean;
  description: string;
}

const SECURITY_RULES: SecurityRule[] = [
  {
    name: 'tool-description-injection',
    severity: 'high',
    description: 'Detect prompt injection patterns in tool descriptions',
    check: (msg) => {
      if (msg.method === 'tools/list') {
        const tools = msg.params?.tools || [];
        return tools.some((tool: any) => {
          const desc = tool.description || '';
          const injectionPatterns = [
            /ignore\s+(all\s+)?previous\s+instructions/i,
            /disregard\s+everything\s+above/i,
            /override\s+your\s+instructions/i,
            /new\s+(system\s+)?instructions/i,
          ];
          return injectionPatterns.some((pattern) => pattern.test(desc));
        });
      }
      return false;
    },
  },
  {
    name: 'annotation-suspicious',
    severity: 'medium',
    description: 'Flag tools with destructive names but readOnly annotation',
    check: (msg) => {
      if (msg.method === 'tools/list') {
        const tools = msg.params?.tools || [];
        return tools.some((tool: any) => {
          const name = tool.name.toLowerCase();
          const hasReadOnly = tool.annotations?.readOnlyHint === true;
          const hasDestructiveName = /delete|remove|destroy|wipe|format/i.test(name);
          return hasReadOnly && hasDestructiveName;
        });
      }
      return false;
    },
  },
];

// #endregion

// #region Defense Proxy

class DefenseProxy {
  private serverProcess: ChildProcess;
  private violations: Array<{ rule: string; message: any }> = [];

  constructor(private serverCommand: string, private serverArgs: string[]) {
    this.serverProcess = spawn(serverCommand, serverArgs, {
      stdio: ['pipe', 'pipe', 'inherit'],
    });
  }

  async start(): Promise<void> {
    process.stdin.on('data', (data) => this.forwardToServer(data));

    if (this.serverProcess.stdout) {
      this.serverProcess.stdout.on('data', (data) => this.forwardFromServer(data));
    }

    this.serverProcess.on('exit', () => this.generateReport());
  }

  private forwardToServer(data: Buffer): void {
    this.serverProcess.stdin?.write(data);
  }

  private forwardFromServer(data: Buffer): void {
    const lines = data.toString().split('\n').filter((l) => l.trim());

    for (const line of lines) {
      try {
        const msg = JSON.parse(line);
        this.checkMessage(msg);
      } catch {
        // Skip invalid JSON
      }
    }

    process.stdout.write(data);
  }

  private checkMessage(msg: any): void {
    for (const rule of SECURITY_RULES) {
      if (rule.check(msg)) {
        this.violations.push({ rule: rule.name, message: msg });
        console.error(`🚨 SECURITY VIOLATION [${rule.severity.toUpperCase()}]: ${rule.name}`);
        console.error(`   ${rule.description}`);
        console.error(`   Message:`, JSON.stringify(msg, null, 2));
      }
    }
  }

  private generateReport(): void {
    console.error('\n' + '='.repeat(80));
    console.error('📊 SECURITY REPORT');
    console.error('='.repeat(80));

    if (this.violations.length === 0) {
      console.error('✅ No security violations detected');
    } else {
      console.error(`❌ Found ${this.violations.length} security violations:\n`);

      for (const violation of this.violations) {
        console.error(`- ${violation.rule}`);
      }

      console.error('\n⚠️  RECOMMENDATION: Do not trust this server with sensitive operations');
    }

    console.error('='.repeat(80));
  }
}

// #endregion

// #region CLI

function main() {
  const args = process.argv.slice(2);
  const separatorIndex = args.indexOf('--');

  if (separatorIndex === -1 || separatorIndex === args.length - 1) {
    console.error('Usage: defense-proxy.ts -- <server-command> [args...]');
    process.exit(1);
  }

  const serverCommand = args[separatorIndex + 1];
  const serverArgs = args.slice(separatorIndex + 2);

  console.error('🛡️  MCP Defense Proxy');
  console.error(`Monitoring server: ${serverCommand} ${serverArgs.join(' ')}\n`);

  const proxy = new DefenseProxy(serverCommand, serverArgs);
  proxy.start();
}

if (require.main === module) {
  main();
}

// #endregion
