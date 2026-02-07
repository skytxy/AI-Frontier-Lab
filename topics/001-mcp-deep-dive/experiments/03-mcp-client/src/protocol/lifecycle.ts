/**
 * MCP Lifecycle Management
 *
 * Handles the MCP initialization handshake:
 * 1. Client → Server: initialize (protocol version, capabilities, client info)
 * 2. Server → Client: Server capabilities
 * 3. Client → Server: initialized notification
 *
 * #region Capability Negotiation
 *
 * The client and server exchange information about their capabilities during
 * initialization. This allows both sides to know what features are supported:
 * - tools: Server can provide callable tools
 * - resources: Server can expose data resources
 * - prompts: Server can provide prompt templates
 * - logging: Server supports logging levels
 *
 * #endregion
 */

import { StdioTransport } from '../transport/stdio.js';

// #region Types

export interface ClientCapabilities {
  roots?: {
    listChanged: boolean;
  };
  sampling?: {};
}

export interface ClientInfo {
  name: string;
  version: string;
}

export interface ServerCapabilities {
  tools?: {};
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {};
  logging?: {};
}

export interface ServerInfo {
  name: string;
  version: string;
}

export interface InitializeParams {
  protocolVersion: string;
  capabilities: ClientCapabilities;
  clientInfo: ClientInfo;
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: ServerInfo;
}

// #endregion

// #region Implementation

export class McpLifecycle {
  constructor(private transport: StdioTransport) {}

  /**
   * Perform initialization handshake with server
   */
  async initialize(clientInfo: ClientInfo): Promise<InitializeResult> {
    // Send initialize request
    const params: InitializeParams = {
      protocolVersion: '2024-11-05',
      capabilities: {
        // Declare client capabilities here
        roots: { listChanged: true },
      },
      clientInfo,
    };

    const result = await this.transport.request('initialize', params) as InitializeResult;

    // Send initialized notification
    this.transport.notify('notifications/initialized');

    return result;
  }
}

// #endregion
