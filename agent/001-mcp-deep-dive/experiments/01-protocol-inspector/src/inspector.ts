#!/usr/bin/env node
/**
 * MCP Protocol Inspector
 *
 * A transparent stdio proxy that intercepts and logs all JSON-RPC messages
 * between an MCP Host (e.g., Claude Desktop) and an MCP Server.
 *
 * #region Architecture
 *
 * ┌─────────┐     stdio      ┌──────────┐     stdio      ┌─────────┐
 *  │  Host   │ ─────────────► │ Inspector │ ─────────────► │ Server  │
 *  │         │ ◄───────────── │           │ ◄───────────── │         │
 *  └─────────┘                └───────────┘                └─────────┘
 *
 * The Inspector spawns the Server as a child process and forwards all
 * stdin/stdout traffic bidirectionally while logging each message.
 *
 * #endregion
 *
 * Usage:
 *   npx tsx src/inspector.ts -- <server-command> [args...]
 *
 * Example:
 *   npx tsx src/inspector.ts -- npx @modelcontextprotocol/server-filesystem /tmp
 */

import { spawn, ChildProcess } from 'child_process';
import { Readable } from 'stream';

// #region Types

interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: string | number | null;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface InspectorOptions {
  serverCommand: string;
  serverArgs: string[];
  colorize?: boolean;
  showTimestamps?: boolean;
}

// #endregion

// #region Utilities

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().split('T')[1].slice(0, -1);
}

/**
 * Safely parse JSON-RPC message
 */
function parseJsonRpc(line: string): JsonRpcMessage | null {
  try {
    const msg = JSON.parse(line) as JsonRpcMessage;
    if (msg.jsonrpc === '2.0') {
      return msg;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Format JSON-RPC message for human-readable output
 */
function formatMessage(msg: JsonRpcMessage, direction: '→' | '←'): string {
  const parts: string[] = [];

  // Direction
  const dirColor = direction === '→' ? 'green' : 'blue';
  parts.push(colorize(direction.padEnd(2), dirColor));

  // Timestamp
  parts.push(colorize(formatTimestamp(), 'dim'));

  // Message type
  if (msg.method) {
    parts.push(colorize('NOTIFICATION'.padEnd(13), 'cyan'));
    parts.push(colorize(msg.method, 'cyan'));
  } else if (msg.id !== undefined) {
    if (msg.error) {
      parts.push(colorize('ERROR_RESPONSE'.padEnd(13), 'red'));
      parts.push(colorize(`id=${msg.id}`, 'red'));
      parts.push(colorize(`[${msg.error.code}] ${msg.error.message}`, 'red'));
    } else if (msg.result !== undefined) {
      parts.push(colorize('RESULT_RESPONSE'.padEnd(13), 'blue'));
      parts.push(colorize(`id=${msg.id}`, 'blue'));
    } else {
      parts.push(colorize('REQUEST'.padEnd(13), 'yellow'));
      parts.push(colorize(`id=${msg.id}`, 'yellow'));
      parts.push(colorize(msg.method || '', 'yellow'));
    }
  } else {
    parts.push(colorize('UNKNOWN'.padEnd(13), 'magenta'));
  }

  return parts.join(' ');
}

/**
 * Truncate large payloads for display
 */
function truncatePayload(data: unknown, maxLength = 200): string {
  if (data === null || data === undefined) {
    return String(data);
  }

  const str = JSON.stringify(data, null, 2);
  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength) + '\n... (truncated)';
}

// #endregion

// #region Inspector Class

class ProtocolInspector {
  private serverProcess: ChildProcess;
  private buffer = '';
  private messageCount = { sent: 0, received: 0 };

  constructor(private options: InspectorOptions) {
    // Spawn the MCP server as a child process
    this.serverProcess = spawn(options.serverCommand, options.serverArgs, {
      stdio: ['pipe', 'pipe', 'inherit'], // inherit stderr for direct error output
    });

    // Handle server process exit
    this.serverProcess.on('exit', (code, signal) => {
      console.error(colorize(`\n📊 Statistics:`, 'yellow'));
      console.error(`  Messages sent: ${this.messageCount.sent}`);
      console.error(`  Messages received: ${this.messageCount.received}`);
      console.error(`Server exited: code=${code}, signal=${signal}`);
      process.exit(code ?? 1);
    });

    // Handle server process errors
    this.serverProcess.on('error', (err) => {
      console.error(colorize(`❌ Failed to spawn server: ${err.message}`, 'red'));
      process.exit(1);
    });
  }

  /**
   * Start forwarding messages between stdin/stdout and the server process
   */
  async start(): Promise<void> {
    // Forward stdin → server stdin
    process.stdin.on('data', (data) => {
      this.forwardToServer(data);
    });

    // Forward server stdout → stdout
    if (this.serverProcess.stdout) {
      this.serverProcess.stdout.on('data', (data) => {
        this.forwardFromServer(data);
      });
    }

    // Handle process termination
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Forward message from Host to Server
   */
  private forwardToServer(data: Buffer): void {
    if (!this.serverProcess.stdin) {
      console.error(colorize('❌ Server stdin is not available', 'red'));
      return;
    }

    const lines = data.toString().split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const msg = parseJsonRpc(line);
      if (msg) {
        this.messageCount.sent++;
        console.log(formatMessage(msg, '→'));

        // Show payload for requests (not notifications)
        if (msg.params && msg.id !== undefined) {
          const payload = truncatePayload(msg.params);
          console.log(colorize(`  params: ${payload}`, 'dim'));
        }
      }
    }

    // Forward to server (transparent)
    this.serverProcess.stdin.write(data);
  }

  /**
   * Forward message from Server to Host
   */
  private forwardFromServer(data: Buffer): void {
    const lines = data.toString().split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const msg = parseJsonRpc(line);
      if (msg) {
        this.messageCount.received++;
        console.log(formatMessage(msg, '←'));

        // Show payload for results
        if (msg.result && msg.id !== undefined) {
          const payload = truncatePayload(msg.result);
          console.log(colorize(`  result: ${payload}`, 'dim'));
        }
      }
    }

    // Forward to stdout (transparent)
    process.stdout.write(data);
  }

  /**
   * Gracefully shutdown
   */
  private shutdown(): void {
    console.error(colorize('\n🛑 Shutting down inspector...', 'yellow'));
    this.serverProcess.kill('SIGTERM');
    setTimeout(() => {
      this.serverProcess.kill('SIGKILL');
      process.exit(0);
    }, 5000);
  }
}

// #endregion

// #region CLI

function parseArgs(): InspectorOptions {
  const args = process.argv.slice(2);

  const separatorIndex = args.indexOf('--');
  if (separatorIndex === -1 || separatorIndex === args.length - 1) {
    console.error('Usage: inspector.ts -- <server-command> [args...]');
    console.error('Example: inspector.ts -- npx @modelcontextprotocol/server-filesystem /tmp');
    process.exit(1);
  }

  const serverCommand = args[separatorIndex + 1];
  const serverArgs = args.slice(separatorIndex + 2);

  return {
    serverCommand,
    serverArgs,
    colorize: process.stdout.isTTY,
    showTimestamps: true,
  };
}

function main(): void {
  const options = parseArgs();

  console.error(colorize('🔍 MCP Protocol Inspector', 'cyan'));
  console.error(colorize(`Spawning server: ${options.serverCommand} ${options.serverArgs.join(' ')}`, 'dim'));
  console.error(colorize('─'.repeat(80), 'dim'));

  const inspector = new ProtocolInspector(options);
  inspector.start().catch((err) => {
    console.error(colorize(`❌ Fatal error: ${err}`, 'red'));
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

// #endregion
