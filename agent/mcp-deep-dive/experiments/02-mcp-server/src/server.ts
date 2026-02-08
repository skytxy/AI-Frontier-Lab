#!/usr/bin/env node
/**
 * MCP Server Demo
 *
 * A complete MCP Server implementation demonstrating:
 * - Tools: file_search, code_stats
 * - Resources: project_files
 * - Prompts: code_review
 *
 * Supports both stdio and Streamable HTTP transports.
 *
 * Usage (stdio):
 *   npx tsx src/server.ts /path/to/project
 *
 * Usage (HTTP):
 *   npx tsx src/server.ts /path/to/project --transport http --port 3000
 *
 * #region Architecture
 *
 * This server uses the high-level McpServer API from @modelcontextprotocol/sdk:
 *
 * 1. Server starts with stdio or HTTP transport
 * 2. Client connects and sends `initialize` request
 * 3. Server responds with capabilities (tools, resources, prompts)
 * 4. Client sends `initialized` notification
 * 5. Server is now ready to handle tool calls, resource reads, and prompt requests
 *
 * #endregion
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import our tool/resource/prompt implementations
import { FileSearchTool, FileSearchInputSchema } from './tools/file-search.js';
import { CodeStatsTool, CodeStatsInputSchema } from './tools/code-stats.js';
import { ProjectFilesResource } from './resources/project-files.js';
import { CodeReviewPrompt, CodeReviewPromptSchema } from './prompts/code-review.js';

// #region Types

interface ServerOptions {
  rootPath: string;
  transport: 'stdio' | 'http';
  port?: number;
}

// #endregion

// #region Server Implementation

class MCPServer {
  private server: Server;
  private fileSearchTool: FileSearchTool;
  private codeStatsTool: CodeStatsTool;
  private projectFilesResource: ProjectFilesResource;
  private codeReviewPrompt: CodeReviewPrompt;

  constructor(private options: ServerOptions) {
    // Initialize MCP Server
    this.server = new Server(
      {
        name: 'mcp-server-demo',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize our implementations
    this.fileSearchTool = new FileSearchTool();
    this.codeStatsTool = new CodeStatsTool();
    this.projectFilesResource = new ProjectFilesResource(options.rootPath);
    this.codeReviewPrompt = new CodeReviewPrompt(options.rootPath);

    this.setupHandlers();
  }

  /**
   * Register all request handlers
   */
  private setupHandlers(): void {
    // #region Tools

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'file_search',
            description: 'Search for files matching a pattern (grep-style)',
            inputSchema: zodToJsonSchema(FileSearchInputSchema),
          },
          {
            name: 'code_stats',
            description: 'Analyze codebase statistics (LOC, language distribution)',
            inputSchema: zodToJsonSchema(CodeStatsInputSchema),
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'file_search': {
            const input = FileSearchInputSchema.parse(args);
            const results = await this.fileSearchTool.execute(input);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'code_stats': {
            const input = CodeStatsInputSchema.parse(args);
            const stats = await this.codeStatsTool.execute(input);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(stats, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: String(error) }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });

    // #endregion

    // #region Resources

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'file:///',
            name: 'Project Files',
            description: 'List and read files in the project directory',
            mimeType: 'text/plain',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        const result = await this.projectFilesResource.read({ uri });
        return {
          contents: [
            {
              uri,
              mimeType: result.mimeType || 'text/plain',
              text: result.content,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: JSON.stringify({ error: String(error) }, null, 2),
            },
          ],
        };
      }
    });

    // #endregion

    // #region Prompts

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'code_review',
            description: 'Generate a code review prompt for a file',
            arguments: [
              {
                name: 'filePath',
                description: 'Path to the file to review',
                required: true,
              },
              {
                name: 'focusAreas',
                description: 'Review focus areas (comma-separated)',
                required: false,
              },
              {
                name: 'severity',
                description: 'Minimum severity to report',
                required: false,
              },
            ],
          },
        ],
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name !== 'code_review') {
        throw new Error(`Unknown prompt: ${name}`);
      }

      try {
        const input = CodeReviewPromptSchema.parse({
          filePath: args?.filePath,
          focusAreas: args?.focusAreas?.split(',').map((s: string) => s.trim()) || ['correctness', 'maintainability'],
          severity: args?.severity || 'medium',
          includeFileContent: true,
        });

        const result = await this.codeReviewPrompt.getPrompt(input);
        return {
          messages: result.messages,
        };
      } catch (error) {
        throw new Error(`Failed to generate prompt: ${error}`);
      }
    });

    // #endregion
  }

  /**
   * Start the server with the configured transport
   */
  async start(): Promise<void> {
    if (this.options.transport === 'stdio') {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      // stderr for logging (doesn't interfere with stdio protocol)
      console.error(`MCP Server started on stdio`);
      console.error(`Root path: ${this.options.rootPath}`);
    } else {
      throw new Error('HTTP transport not yet implemented');
    }
  }
}

// #endregion

// #region Utilities

/**
 * Convert Zod schema to JSON Schema format for MCP tool definitions
 */
function zodToJsonSchema(schema: z.ZodType): any {
  const zodSchema = schema as z.ZodObject<any>;
  const shape = zodSchema.shape;

  const properties: any = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodField = value as z.ZodTypeAny;

    properties[key] = {
      type: getJsonType(zodField),
      description: (zodField as any).description || '',
    };

    // Check if field is optional
    const isOptional = !(zodField as any).isOptional();
    if (!isOptional) {
      required.push(key);
    }

    // Handle arrays
    if (zodField instanceof z.ZodArray) {
      properties[key] = {
        type: 'array',
        items: {
          type: getJsonType((zodField as any).element),
        },
        description: (zodField as any).description || '',
      };
    }

    // Handle defaults
    if ((zodField as any).defaultValue !== undefined) {
      properties[key].default = (zodField as any).defaultValue();
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function getJsonType(zodType: z.ZodTypeAny): string {
  if (zodType instanceof z.ZodString) return 'string';
  if (zodType instanceof z.ZodNumber) return 'number';
  if (zodType instanceof z.ZodBoolean) return 'boolean';
  if (zodType instanceof z.ZodArray) return 'array';
  if (zodType instanceof z.ZodObject) return 'object';
  return 'string';
}

// #endregion

// #region CLI

function parseArgs(): ServerOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: server.ts <root-path> [--transport stdio|http] [--port <number>]');
    process.exit(1);
  }

  return {
    rootPath: args[0],
    transport: (args.includes('--transport') ? args[args.indexOf('--transport') + 1] : 'stdio') as 'stdio' | 'http',
    port: args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1], 10) : undefined,
  };
}

async function main(): Promise<void> {
  const options = parseArgs();

  const server = new MCPServer(options);
  await server.start();

  // Keep process alive
  process.on('SIGINT', () => {
    console.error('\nShutting down MCP Server...');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(`Fatal error: ${err}`);
  process.exit(1);
});

// #endregion
