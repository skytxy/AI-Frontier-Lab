#!/usr/bin/env node
/**
 * MCP Client Demo
 *
 * Demonstrates a complete workflow:
 * 1. Connect to server
 * 2. Discover capabilities (tools, resources, prompts)
 * 3. Call a tool
 * 4. Read a resource
 * 5. Get a prompt
 * 6. Disconnect
 *
 * Usage:
 *   npx tsx src/demo.ts
 */

import { McpClient } from './client.js';
import { resolve } from 'path';

async function main(): Promise<void> {
  // Get project root from command line or default to current directory
  const projectRoot = process.argv[2] || process.cwd();

  console.error('🚀 MCP Client Demo');
  console.error(`Connecting to server with project root: ${projectRoot}`);
  console.error('');

  // Create client (connects to Exp-02 server)
  const client = new McpClient({
    serverCommand: 'node',
    serverArgs: [resolve('../02-mcp-server/dist/server.js'), projectRoot],
    clientInfo: {
      name: 'mcp-client-demo',
      version: '1.0.0',
    },
  });

  try {
    // 1. Connect and initialize
    console.error('Step 1: Connecting to server...');
    await client.connect();
    console.error('✓ Connected\n');

    // 2. List tools
    console.error('Step 2: Discovering tools...');
    const tools = await client.listTools();
    console.error(`✓ Found ${tools.length} tools:`);
    for (const tool of tools) {
      console.error(`  - ${tool.name}: ${tool.description || 'No description'}`);
    }
    console.error('');

    // 3. Call a tool (code_stats)
    console.error('Step 3: Calling code_stats tool...');
    const statsResult = await client.callTool('code_stats', {
      path: projectRoot,
      includeComments: false,
    });

    if (statsResult.content && statsResult.content[0]) {
      const stats = JSON.parse(statsResult.content[0].text);
      console.error('✓ Code statistics:');
      console.error(`  Total files: ${stats.summary.totalFiles}`);
      console.error(`  Total lines: ${stats.summary.totalLines}`);
      console.error(`  Code lines: ${stats.summary.codeLines}`);
      console.error(`  Languages:`);
      for (const [lang, data] of Object.entries(stats.byLanguage)) {
        const langData = data as { files: number; lines: number };
        console.error(`    - ${lang}: ${langData.files} files, ${langData.lines} lines`);
      }
    }
    console.error('');

    // 4. List resources
    console.error('Step 4: Discovering resources...');
    const resources = await client.listResources();
    console.error(`✓ Found ${resources.length} resources:`);
    for (const resource of resources) {
      console.error(`  - ${resource.name}: ${resource.description || 'No description'}`);
    }
    console.error('');

    // 5. List prompts
    console.error('Step 5: Discovering prompts...');
    const prompts = await client.listPrompts();
    console.error(`✓ Found ${prompts.length} prompts:`);
    for (const prompt of prompts) {
      console.error(`  - ${prompt.name}: ${prompt.description || 'No description'}`);
    }
    console.error('');

    // 6. Get a prompt
    console.error('Step 6: Getting code_review prompt...');
    const promptResult = await client.getPrompt('code_review', {
      filePath: resolve('../02-mcp-server/src/server.ts'),
      focusAreas: 'correctness,maintainability',
      severity: 'medium',
    });

    if (promptResult.messages && promptResult.messages[0]) {
      console.error('✓ Generated prompt (first 500 chars):');
      console.error(promptResult.messages[0].content.text.slice(0, 500) + '...');
    }
    console.error('');

    // 7. Disconnect
    console.error('Step 7: Disconnecting...');
    await client.disconnect();
    console.error('✓ Disconnected');

    console.error('\n✅ Demo completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run demo
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
