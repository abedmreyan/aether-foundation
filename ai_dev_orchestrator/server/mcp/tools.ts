import { getMCPClient } from "./client";

/**
 * MCP Tools - High-level tool definitions for agents
 */

export const MCPTools = {
  /**
   * Documentation tools
   */
  documentation: {
    createDoc: async (title: string, content: string) => {
      const client = getMCPClient();
      return client.createGoogleDoc(title, content);
    },
    
    updateDoc: async (docId: string, content: string) => {
      const client = getMCPClient();
      return client.updateGoogleDoc(docId, content);
    },
  },

  /**
   * Data management tools
   */
  data: {
    createSheet: async (title: string, data: any[][]) => {
      const client = getMCPClient();
      return client.createGoogleSheet(title, data);
    },
    
    updateSheet: async (sheetId: string, range: string, data: any[][]) => {
      const client = getMCPClient();
      return client.updateGoogleSheet(sheetId, range, data);
    },
  },

  /**
   * Task management tools
   */
  tasks: {
    createTask: async (title: string, notes?: string, dueDate?: string) => {
      const client = getMCPClient();
      return client.createGoogleTask(title, notes, dueDate);
    },
  },

  /**
   * Version control tools
   */
  versionControl: {
    createRepo: async (name: string, description: string, isPrivate: boolean = false) => {
      const client = getMCPClient();
      return client.createGitHubRepo(name, description, isPrivate);
    },
    
    createFile: async (repo: string, path: string, content: string, message: string) => {
      const client = getMCPClient();
      return client.createGitHubFile(repo, path, content, message);
    },
    
    createPR: async (repo: string, title: string, body: string, head: string, base: string) => {
      const client = getMCPClient();
      return client.createGitHubPR(repo, title, body, head, base);
    },
  },

  /**
   * Deployment tools
   */
  deployment: {
    deployAzure: async (appName: string, config: any) => {
      const client = getMCPClient();
      return client.deployToAzure(appName, config);
    },
    
    deployNetlify: async (siteName: string, buildDir: string) => {
      const client = getMCPClient();
      return client.deployToNetlify(siteName, buildDir);
    },
  },

  /**
   * Database tools
   */
  database: {
    createTable: async (tableName: string, schema: any) => {
      const client = getMCPClient();
      return client.createSupabaseTable(tableName, schema);
    },
    
    query: async (query: string) => {
      const client = getMCPClient();
      return client.querySupabase(query);
    },
  },

  /**
   * Research tools
   */
  research: {
    conduct: async (query: string, focus?: string) => {
      const client = getMCPClient();
      return client.conductResearch(query, focus);
    },
  },
};

/**
 * Get tools available for a specific agent role
 */
export function getToolsForRole(role: string): string[] {
  const toolsByRole: Record<string, string[]> = {
    project_manager: [
      "documentation.createDoc",
      "documentation.updateDoc",
      "tasks.createTask",
      "research.conduct",
    ],
    research: [
      "research.conduct",
      "documentation.createDoc",
      "data.createSheet",
    ],
    architecture: [
      "documentation.createDoc",
      "documentation.updateDoc",
      "database.createTable",
    ],
    ui_ux: [
      "documentation.createDoc",
      "documentation.updateDoc",
    ],
    frontend: [
      "versionControl.createRepo",
      "versionControl.createFile",
      "versionControl.createPR",
      "deployment.deployNetlify",
    ],
    backend: [
      "versionControl.createRepo",
      "versionControl.createFile",
      "versionControl.createPR",
      "database.createTable",
      "database.query",
      "deployment.deployAzure",
    ],
    devops: [
      "versionControl.createRepo",
      "deployment.deployAzure",
      "deployment.deployNetlify",
      "database.createTable",
    ],
    qa: [
      "versionControl.createFile",
      "versionControl.createPR",
      "documentation.createDoc",
    ],
  };

  return toolsByRole[role] || [];
}
