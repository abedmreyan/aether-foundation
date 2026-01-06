/**
 * MCP Integration Layer
 * 
 * Connects to the Dev MCP Server at '/Users/abedmreyan/Desktop/MCP Servers/Dev MCP '
 * 
 * This provides access to:
 * - Perplexity for research
 * - GitHub for repository operations
 * - Azure for cloud services
 * - Netlify for deployments
 * - Supabase for database operations
 * - Google services (Docs, Sheets, Tasks)
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPToolCall {
  tool: string;
  parameters: Record<string, any>;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * MCP Client for interacting with Dev MCP Server
 */
export class MCPClient extends EventEmitter {
  private serverPath: string;
  private serverProcess: ChildProcess | null = null;
  private connected: boolean = false;
  private requestId: number = 0;
  private pendingRequests: Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = new Map();

  constructor() {
    super();
    // Get from environment or use default
    this.serverPath = process.env.MCP_SERVER_PATH || '/Users/abedmreyan/Desktop/MCP Servers/Dev MCP ';
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      console.log(`[MCP] Connecting to Dev MCP Server at: ${this.serverPath}`);

      // Spawn the MCP server process
      this.serverProcess = spawn('node', ['index.js'], {
        cwd: this.serverPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Pass through API keys to MCP server
          PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
          DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
        },
      });

      // Handle server output
      this.serverProcess.stdout?.on('data', (data) => {
        try {
          const response = JSON.parse(data.toString());
          this.handleResponse(response);
        } catch (error) {
          console.log(`[MCP Server] ${data.toString()}`);
        }
      });

      this.serverProcess.stderr?.on('data', (data) => {
        console.error(`[MCP Server Error] ${data.toString()}`);
      });

      this.serverProcess.on('exit', (code) => {
        console.log(`[MCP] Server exited with code ${code}`);
        this.connected = false;
      });

      this.connected = true;
      console.log('[MCP] Connected successfully');
    } catch (error) {
      console.error('[MCP] Connection failed:', error);
      throw new Error(`Failed to connect to MCP server: ${error}`);
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    this.connected = false;
  }

  /**
   * Handle response from MCP server
   */
  private handleResponse(response: any): void {
    const { id, result, error } = response;

    const pending = this.pendingRequests.get(id);
    if (pending) {
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
      this.pendingRequests.delete(id);
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.connected) {
      await this.connect();
    }

    const requestId = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: toolCall.tool,
          arguments: toolCall.parameters,
        },
      };

      this.serverProcess?.stdin?.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('MCP tool call timeout'));
        }
      }, 30000);
    }).then(
      (data) => ({ success: true, data }),
      (error) => ({ success: false, error: error.message })
    );
  }

  /**
   * Research with Perplexity via MCP
   */
  async perplexityResearch(query: string): Promise<string> {
    const result = await this.callTool({
      tool: 'mcp_dev-mcp_perplexity_search',
      parameters: { query },
    });

    if (!result.success) {
      throw new Error(`Perplexity research failed: ${result.error}`);
    }

    return result.data?.answer || result.data?.content || '';
  }

  /**
   * Get GitHub repository
   */
  async getGitHubRepo(owner: string, repo: string): Promise<any> {
    const result = await this.callTool({
      tool: 'mcp_dev-mcp_github_get_repo',
      parameters: { owner, repo },
    });

    if (!result.success) {
      throw new Error(`GitHub get repo failed: ${result.error}`);
    }

    return result.data;
  }

  /**
   * Create GitHub issue
   */
  async createGitHubIssue(owner: string, repo: string, title: string, body: string): Promise<any> {
    const result = await this.callTool({
      tool: 'mcp_dev-mcp_github_create_issue',
      parameters: { owner, repo, title, body },
    });

    if (!result.success) {
      throw new Error(`GitHub create issue failed: ${result.error}`);
    }

    return result.data;
  }
}

/**
 * Singleton MCP client instance
 */
let mcpClientInstance: MCPClient | null = null;

/**
 * Get the MCP client instance
 */
export function getMCPClient(): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }
  return mcpClientInstance;
}
