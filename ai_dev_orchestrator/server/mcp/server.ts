#!/usr/bin/env node

/**
 * MCP Server Entry Point for AI Dev Orchestrator
 * 
 * Add this to your dev-mcp server configuration:
 * 
 * In your MCP config file (usually ~/.config/mcp/config.json or similar):
 * 
 * {
 *   "mcpServers": {
 *     "ai-orchestrator": {
 *       "command": "node",
 *       "args": ["/Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator/server/mcp/server.js"]
 *     }
 *   }
 * }
 * 
 * Or if running from source:
 * {
 *   "mcpServers": {
 *     "ai-orchestrator": {
 *       "command": "tsx",
 *       "args": ["/Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator/server/mcp/server.ts"]
 *     }
 *   }
 * }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { mcpServerConfig } from "./mcpServer.js";

const server = new Server(
    {
        name: mcpServerConfig.name,
        version: mcpServerConfig.version,
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: mcpServerConfig.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        })),
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = mcpServerConfig.tools.find((t) => t.name === request.params.name);

    if (!tool) {
        throw new Error(`Unknown tool: ${request.params.name}`);
    }

    try {
        const result = await tool.execute(request.params.arguments || {});
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : String(error),
                    }),
                },
            ],
            isError: true,
        };
    }
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("AI Dev Orchestrator MCP Server running");
