/**
 * Google Tasks Integration Test Script
 * 
 * Tests the complete Google Tasks synchronization workflow:
 * 1. MCP connection
 * 2. Task list access
 * 3. Task creation and sync
 * 4. Task updates and re-sync
 * 5. Agent-task mapping in notes
 */

import { getMCPClient } from '../server/mcp/client';
import * as db from '../server/db';
import { GoogleTasksSync } from '../server/services/googleTasksSync';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  error?: any;
}

const results: TestResult[] = [];

function logTest(test: string, passed: boolean, message: string, error?: any) {
  results.push({ test, passed, message, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
}

async function test1_MCPConnection(): Promise<boolean> {
  console.log('\n🧪 Test 1: MCP Server Connection');
  try {
    const mcp = getMCPClient();
    await mcp.connect();
    await mcp.disconnect();
    logTest('MCP Connection', true, 'Successfully connected to MCP server');
    return true;
  } catch (error) {
    logTest('MCP Connection', false, 'Failed to connect to MCP server', error);
    return false;
  }
}

async function test2_ListTaskLists(): Promise<string | null> {
  console.log('\n🧪 Test 2: List Google Tasks Lists');
  try {
    const mcp = getMCPClient();
    await mcp.connect();

    const result = await mcp.callTool({
      tool: 'mcp_dev-mcp_google_tasks_list_tasklists',
      parameters: {},
    });

    await mcp.disconnect();

    if (!result.success) {
      throw new Error(result.error || 'Failed to list task lists');
    }

    const lists = result.data?.items || [];
    
    if (lists.length === 0) {
      logTest('List Task Lists', false, 'No task lists found');
      return null;
    }

    logTest('List Task Lists', true, `Found ${lists.length} task list(s)`);
    console.log(`   Using: "${lists[0].title}" (${lists[0].id})`);
    return lists[0].id;
  } catch (error) {
    logTest('List Task Lists', false, 'Failed to fetch task lists', error);
    return null;
  }
}

async function test3_DatabaseConnection(): Promise<boolean> {
  console.log('\n🧪 Test 3: Database Connection');
  try {
    const database = await db.getDb();
    
    if (!database) {
      throw new Error('Database connection is null');
    }

    // Try to fetch agents
    const agents = await db.getAllAgents();
    
    logTest('Database Connection', true, `Connected (${agents.length} agents found)`);
    return true;
  } catch (error) {
    logTest('Database Connection', false, 'Failed to connect to database', error);
    return false;
  }
}

async function test4_CreateTestTask(): Promise<number | null> {
  console.log('\n🧪 Test 4: Create Test Task in Database');
  try {
    // Get or create a test module
    const database = await db.getDb();
    const agents = await db.getAllAgents();
    
    if (agents.length === 0) {
      throw new Error('No agents found in database');
    }

    // Create a test task
    const taskId = await db.createTask({
      moduleId: 1, // Assuming module 1 exists
      title: 'Test Task - Google Sync',
      description: 'This is a test task created by the Google Tasks test script',
      requirements: 'Test requirements for sync verification',
      assignedAgentId: agents[0].id,
      status: 'pending',
      progressPercentage: 0,
    });

    logTest('Create Test Task', true, `Created task #${taskId} assigned to ${agents[0].name}`);
    return taskId;
  } catch (error) {
    logTest('Create Test Task', false, 'Failed to create test task', error);
    return null;
  }
}

async function test5_SyncToGoogleTasks(taskListId: string, taskId: number): Promise<boolean> {
  console.log('\n🧪 Test 5: Sync Task to Google Tasks');
  try {
    const syncService = new GoogleTasksSync({
      taskListId,
      autoSync: false,
    });

    // Get the task
    const database = await db.getDb();
    const tasks = await database
      .select()
      .from(require('../drizzle/schema').tasks)
      .where((task: any) => task.id === taskId);

    if (tasks.length === 0) {
      throw new Error('Test task not found');
    }

    const task = tasks[0];

    // Sync the task
    await syncService.syncTask(task);

    logTest('Sync to Google Tasks', true, 'Task synced successfully');
    return true;
  } catch (error) {
    logTest('Sync to Google Tasks', false, 'Failed to sync task', error);
    return false;
  }
}

async function test6_VerifyTaskInGoogle(taskListId: string): Promise<boolean> {
  console.log('\n🧪 Test 6: Verify Task in Google Tasks');
  try {
    const mcp = getMCPClient();
    await mcp.connect();

    const result = await mcp.callTool({
      tool: 'mcp_dev-mcp_google_tasks_list_tasks',
      parameters: {
        taskListId,
      },
    });

    await mcp.disconnect();

    if (!result.success) {
      throw new Error(result.error || 'Failed to list tasks');
    }

    const tasks = result.data?.items || [];
    const testTask = tasks.find((t: any) => t.title && t.title.includes('Test Task - Google Sync'));

    if (!testTask) {
      throw new Error('Test task not found in Google Tasks');
    }

    logTest('Verify in Google Tasks', true, `Task found: "${testTask.title}"`);
    console.log('   Task notes include agent information:');
    if (testTask.notes) {
      const noteLines = testTask.notes.split('\n').slice(0, 5);
      noteLines.forEach((line: string) => console.log(`   ${line}`));
    }
    return true;
  } catch (error) {
    logTest('Verify in Google Tasks', false, 'Task not found in Google Tasks', error);
    return false;
  }
}

async function test7_UpdateTaskAndResync(taskId: number, taskListId: string): Promise<boolean> {
  console.log('\n🧪 Test 7: Update Task and Re-sync');
  try {
    // Update task status and progress
    await db.updateTaskStatus(taskId, 'in_progress', 50);

    // Re-sync
    const syncService = new GoogleTasksSync({
      taskListId,
      autoSync: false,
    });

    const database = await db.getDb();
    const tasks = await database
      .select()
      .from(require('../drizzle/schema').tasks)
      .where((task: any) => task.id === taskId);

    if (tasks.length === 0) {
      throw new Error('Test task not found');
    }

    await syncService.syncTask(tasks[0]);

    logTest('Update and Re-sync', true, 'Task updated and re-synced successfully');
    return true;
  } catch (error) {
    logTest('Update and Re-sync', false, 'Failed to update and re-sync', error);
    return false;
  }
}

async function test8_CleanupTestTask(taskId: number): Promise<void> {
  console.log('\n🧹 Cleanup: Removing test task');
  try {
    const database = await db.getDb();
    await database
      .delete(require('../drizzle/schema').tasks)
      .where((task: any) => task.id === taskId);
    console.log('✅ Test task removed from database');
  } catch (error) {
    console.log('⚠️  Failed to cleanup test task:', error);
  }
}

async function main() {
  console.log('🚀 Google Tasks Integration Test Suite\n');
  console.log('=' .repeat(60));

  // Check environment configuration
  const taskListId = process.env.GOOGLE_TASKS_LIST_ID;
  if (!taskListId) {
    console.log('\n❌ GOOGLE_TASKS_LIST_ID not configured');
    console.log('   Run setup script first: npx tsx scripts/setup-google-tasks.ts\n');
    process.exit(1);
  }

  console.log(`📋 Using Task List ID: ${taskListId}\n`);

  let testTaskId: number | null = null;

  try {
    // Run tests sequentially
    const mcpOk = await test1_MCPConnection();
    if (!mcpOk) {
      console.log('\n⛔ Cannot proceed without MCP connection');
      printSummary();
      process.exit(1);
    }

    const discoveredTaskListId = await test2_ListTaskLists();
    const dbOk = await test3_DatabaseConnection();
    
    if (!dbOk) {
      console.log('\n⛔ Cannot proceed without database connection');
      printSummary();
      process.exit(1);
    }

    testTaskId = await test4_CreateTestTask();
    
    if (testTaskId) {
      await test5_SyncToGoogleTasks(taskListId, testTaskId);
      await test6_VerifyTaskInGoogle(taskListId);
      await test7_UpdateTaskAndResync(testTaskId, taskListId);
    }

    // Cleanup
    if (testTaskId) {
      await test8_CleanupTestTask(testTaskId);
    }

    console.log('\n' + '='.repeat(60));
    printSummary();

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    
    if (testTaskId) {
      await test8_CleanupTestTask(testTaskId);
    }
    
    printSummary();
    process.exit(1);
  }
}

function printSummary() {
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
    });
    console.log('');
  }

  if (passed === total) {
    console.log('🎉 All tests passed! Google Tasks integration is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

main();

