/**
 * Minimal MCP Client
 *
 * A high-level client API that wraps the low-level transport and protocol logic.
 * Provides convenient methods for interacting with MCP servers.
 *
 * #region Architecture
 *
 * This client is intentionally minimal to demonstrate the core concepts:
 * - No retry logic
 * - No connection pooling
 * - No advanced error handling
 * - Direct 1:1 mapping to MCP protocol methods
 *
 * Production clients would add more robustness (e.g., official MCP SDK).
 *
 * #endregion
 */

import { StdioTransport } from './transport/stdio.js';
import { McpLifecycle } from './protocol/lifecycle.js';

// #region Types

export interface McpClientOptions {
  serverCommand: string;
  serverArgs: string[];
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema: any;
}

export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface Prompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// #endregion

// #region Implementation

export class McpClient {
  private transport: StdioTransport;
  private lifecycle: McpLifecycle;
  private initialized = false;

  constructor(private options: McpClientOptions) {
    this.transport = new StdioTransport({
      command: options.serverCommand,
      args: options.serverArgs,
    });

    this.lifecycle = new McpLifecycle(this.transport);
  }

  /**
   * Connect to server and perform initialization handshake
   */
  async connect(): Promise<void> {
    await this.transport.start();

    const serverInfo = await this.lifecycle.initialize(this.options.clientInfo);

    console.error(`Connected to MCP server: ${serverInfo.serverInfo.name} v${serverInfo.serverInfo.version}`);
    console.error(`Server capabilities:`, JSON.stringify(serverInfo.capabilities, null, 2));

    this.initialized = true;
  }

  /**
   * List available tools
   */
  async listTools(): Promise<Tool[]> {
    this.ensureInitialized();

    const result = await this.transport.request('tools/list') as { tools: Tool[] };
    return result.tools;
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<any> {
    this.ensureInitialized();

    const result = await this.transport.request('tools/call', {
      name,
      arguments: args,
    });

    return result;
  }

  /**
   * List available resources
   */
  async listResources(): Promise<Resource[]> {
    this.ensureInitialized();

    const result = await this.transport.request('resources/list') as { resources: Resource[] };
    return result.resources;
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<any> {
    this.ensureInitialized();

    const result = await this.transport.request('resources/read', { uri });
    return result;
  }

  /**
   * List available prompts
   */
  async listPrompts(): Promise<Prompt[]> {
    this.ensureInitialized();

    const result = await this.transport.request('prompts/list') as { prompts: Prompt[] };
    return result.prompts;
  }

  /**
   * Get a prompt
   */
  async getPrompt(name: string, args?: Record<string, unknown>): Promise<any> {
    this.ensureInitialized();

    const result = await this.transport.request('prompts/get', {
      name,
      arguments: args,
    });

    return result;
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    await this.transport.stop();
    this.initialized = false;
    console.error('Disconnected from MCP server');
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Client not initialized. Call connect() first.');
    }
  }
}

// #endregion
