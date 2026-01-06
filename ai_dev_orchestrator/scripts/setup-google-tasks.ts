/**
 * Google Tasks Setup Script
 * 
 * This script helps you configure Google Tasks integration by:
 * 1. Connecting to the Dev MCP Server
 * 2. Listing available Google Tasks lists
 * 3. Allowing selection of a task list to use
 * 4. Saving the configuration
 */

import { getMCPClient } from '../server/mcp/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Google Tasks Setup for Aether Foundation Orchestrator\n');

  try {
    // Connect to MCP server
    console.log('📡 Connecting to Dev MCP Server...');
    const mcp = getMCPClient();
    await mcp.connect();
    console.log('✅ Connected to MCP Server\n');

    // List available task lists
    console.log('📋 Fetching your Google Tasks lists...');
    const result = await mcp.callTool({
      tool: 'mcp_dev-mcp_google_tasks_list_tasklists',
      parameters: {},
    });

    if (!result.success) {
      console.error('❌ Failed to fetch task lists:', result.error);
      console.log('\n⚠️  Make sure:');
      console.log('   - Dev MCP Server is running');
      console.log('   - Google account is connected to MCP');
      console.log('   - Google Tasks API is enabled\n');
      process.exit(1);
    }

    const lists = result.data?.items || [];

    if (lists.length === 0) {
      console.log('❌ No Google Tasks lists found.');
      console.log('\n💡 Create a task list in Google Tasks first:');
      console.log('   1. Go to https://tasks.google.com');
      console.log('   2. Create a new list (e.g., "Aether Orchestrator")');
      console.log('   3. Run this script again\n');
      await mcp.disconnect();
      process.exit(1);
    }

    // Display available lists
    console.log('\n📝 Available Google Tasks Lists:\n');
    lists.forEach((list: any, index: number) => {
      console.log(`   ${index + 1}. ${list.title}`);
      console.log(`      ID: ${list.id}`);
      if (list.updated) {
        console.log(`      Updated: ${new Date(list.updated).toLocaleDateString()}`);
      }
      console.log('');
    });

    // Get user selection
    const answer = await question(
      `Select a list (1-${lists.length}) or press Enter to use "${lists[0].title}": `
    );

    let selectedIndex = 0;
    if (answer.trim()) {
      selectedIndex = parseInt(answer) - 1;
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= lists.length) {
        console.log('❌ Invalid selection. Using first list.');
        selectedIndex = 0;
      }
    }

    const selectedList = lists[selectedIndex];
    console.log(`\n✅ Selected: "${selectedList.title}" (${selectedList.id})\n`);

    // Save to .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';

    // Read existing .env if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update or add Google Tasks configuration
    const googleTasksConfig = `
# Google Tasks Integration (configured by setup script)
GOOGLE_TASKS_LIST_ID=${selectedList.id}
GOOGLE_TASKS_SYNC_INTERVAL=15
GOOGLE_TASKS_AUTO_SYNC=true
`;

    // Remove existing Google Tasks config if present
    envContent = envContent.replace(
      /# Google Tasks Integration[\s\S]*?(?=\n#|\n\n|$)/,
      ''
    );

    // Append new config
    envContent = envContent.trim() + '\n' + googleTasksConfig;

    fs.writeFileSync(envPath, envContent);

    console.log('💾 Configuration saved to .env\n');
    console.log('✨ Google Tasks integration is ready!\n');
    console.log('📝 Next steps:');
    console.log('   1. Restart the orchestrator: npm run dev');
    console.log('   2. Tasks will automatically sync every 15 minutes');
    console.log('   3. Test the integration: npm run test:google-tasks\n');

    await mcp.disconnect();
    rl.close();
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Verify MCP_SERVER_PATH in .env');
    console.log('   - Check that Dev MCP Server is running');
    console.log('   - Ensure Google account is authenticated\n');
    process.exit(1);
  }
}

main();

