/**
 * JSON-RPC 2.0 Codec
 *
 * Implements JSON-RPC 2.0 specification:
 * - Request: { jsonrpc: "2.0", method: string, params?: any, id?: string|number }
 * - Response: { jsonrpc: "2.0", result?: any, error?: ErrorObject, id: string|number }
 * - Notification: { jsonrpc: "2.0", method: string, params?: any }
 *
 * #region Design
 *
 * This module provides pure functions for encoding and decoding JSON-RPC messages.
 * It does NOT handle transport or framing - that's the responsibility of the transport layer.
 *
 * #endregion
 */

// #region Types

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

export type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export type JsonRpcMessageOrNotification = JsonRpcMessage | JsonRpcNotification;

// #endregion

// #region Encoding

export function encodeRequest(id: string | number, method: string, params?: unknown): string {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };
  return JSON.stringify(request);
}

export function encodeNotification(method: string, params?: unknown): string {
  const notification: JsonRpcNotification = {
    jsonrpc: '2.0',
    method,
    params,
  };
  return JSON.stringify(notification);
}

// #endregion

// #region Decoding

export function decodeMessage(line: string): JsonRpcMessageOrNotification | null {
  try {
    const msg = JSON.parse(line) as JsonRpcMessageOrNotification;
    
    // Validate jsonrpc version
    if (msg.jsonrpc !== '2.0') {
      return null;
    }

    return msg;
  } catch {
    return null;
  }
}

export function isRequest(msg: JsonRpcMessageOrNotification): msg is JsonRpcRequest {
  return 'id' in msg && 'method' in msg;
}

export function isResponse(msg: JsonRpcMessageOrNotification): msg is JsonRpcResponse {
  return 'id' in msg && ('result' in msg || 'error' in msg);
}

export function isNotification(msg: JsonRpcMessageOrNotification): msg is JsonRpcNotification {
  return !('id' in msg) && 'method' in msg;
}

// #endregion

// #region Error Utilities

export function createError(code: number, message: string, data?: unknown): JsonRpcError {
  return { code, message, data };
}

export function isErrorResponse(msg: JsonRpcMessageOrNotification): msg is JsonRpcResponse & { error: JsonRpcError } {
  return isResponse(msg) && msg.error !== undefined;
}

// Standard JSON-RPC error codes
export const ErrorCodes = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const;

// #endregion
