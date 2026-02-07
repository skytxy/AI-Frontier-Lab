/**
 * stdio Transport Implementation
 *
 * Handles stdio-based communication with an MCP server:
 * - Spawns the server process
 * - Handles message framing (newline-delimited JSON)
 * - Manages request-response correlation
 *
 * #region Message Framing
 *
 * MCP uses newline-delimited JSON-RPC messages. Each message is a complete
 * JSON object on its own line. We must handle:
 * - Sticky packets: One read() contains multiple messages
 * - Partial packets: One message spans multiple read() calls
 *
 * Solution: Buffer-based line-by-line parsing
 *
 * #endregion
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { decodeMessage, JsonRpcMessageOrNotification, encodeRequest, encodeNotification } from '../protocol/jsonrpc.js';

// #region Types

export interface StdioTransportOptions {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export type MessageHandler = (message: JsonRpcMessageOrNotification) => void;
export type ErrorHandler = (error: Error) => void;

// #endregion

// #region Implementation

export class StdioTransport extends EventEmitter {
  private process: ChildProcess;
  private buffer = '';
  private pendingRequests = new Map<string | number, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private requestId = 0;

  constructor(private options: StdioTransportOptions) {
    super();

    // Spawn server process
    this.process = spawn(options.command, options.args, {
      stdio: ['pipe', 'pipe', 'inherit'], // inherit stderr for debugging
      env: { ...process.env, ...options.env },
    });

    this.setupProcessHandlers();
  }

  /**
   * Start the transport and begin listening for messages
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Transport start timeout'));
      }, 5000);

      this.process.on('spawn', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.process.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Send a request and wait for response
   */
  async request(method: string, params?: unknown, timeout = 30000): Promise<unknown> {
    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method} (id=${id})`));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timeout: timeoutHandle });

      // Send request
      const message = encodeRequest(id, method, params);
      this.writeLine(message);
    });
  }

  /**
   * Send a notification (no response expected)
   */
  notify(method: string, params?: unknown): void {
    const message = encodeNotification(method, params);
    this.writeLine(message);
  }

  /**
   * Stop the transport and cleanup
   */
  async stop(): Promise<void> {
    // Clear all pending requests
    for (const [id, { reject, timeout }] of this.pendingRequests) {
      clearTimeout(timeout);
      reject(new Error('Transport stopped'));
    }
    this.pendingRequests.clear();

    // Kill server process
    if (this.process.pid) {
      this.process.kill('SIGTERM');
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.process.pid) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    }
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(): void {
    // Handle stdout from server
    if (this.process.stdout) {
      this.process.stdout.on('data', (data) => {
        this.handleData(data);
      });
    }

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      this.emit('exit', { code, signal });
    });

    // Handle process errors
    this.process.on('error', (err) => {
      this.emit('error', err);
    });
  }

  /**
   * Handle incoming data from server
   */
  private handleData(data: Buffer): void {
    // Add to buffer
    this.buffer += data.toString();

    // Process complete lines
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete last line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      const message = decodeMessage(line);
      if (message) {
        this.handleMessage(message);
      } else {
        this.emit('error', new Error(`Failed to decode message: ${line}`));
      }
    }
  }

  /**
   * Handle decoded JSON-RPC message
   */
  private handleMessage(message: JsonRpcMessageOrNotification): void {
    this.emit('message', message);

    // Check if this is a response to a pending request
    if ('id' in message) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if ('error' in message) {
          pending.reject(new Error(`JSON-RPC Error ${message.error.code}: ${message.error.message}`));
        } else if ('result' in message) {
          pending.resolve(message.result);
        }
      }
    }
  }

  /**
   * Write a line to server stdin
   */
  private writeLine(line: string): void {
    if (!this.process.stdin) {
      throw new Error('Server stdin is not available');
    }

    this.process.stdin.write(line + '\n');
  }
}

// #endregion
