/**
 * Verify Azure SQL Schema Deployment
 * 
 * Checks if the schema has been deployed to Azure SQL
 */

import * as db from '../server/db';

async function main() {
  console.log('🔍 Verifying Azure SQL Schema Deployment\n');
  console.log('=' .repeat(60));

  try {
    const database = await db.getDb();
    
    if (!database) {
      console.log('\n❌ Database connection failed');
      console.log('   Check DATABASE_URL in .env\n');
      process.exit(1);
    }

    console.log('✅ Database connection successful\n');

    // Check agents
    console.log('📊 Checking Agents...');
    const agents = await db.getAllAgents();
    console.log(`   Found ${agents.length} agents`);
    
    if (agents.length === 0) {
      console.log('\n⚠️  No agents found - Schema needs to be deployed!');
      console.log('\n📋 To deploy schema:');
      console.log('   1. Go to https://portal.azure.com');
      console.log('   2. Navigate to SQL Database → orchestrator-db');
      console.log('   3. Click "Query editor"');
      console.log('   4. Login with: orchestrator_admin / AetherOrch#2025!Secure$Pass');
      console.log('   5. Copy/paste contents of schema-azure.sql');
      console.log('   6. Click "Run"\n');
      process.exit(1);
    }

    console.log('\n✅ Agents:');
    agents.forEach((agent, i) => {
      console.log(`   ${i + 1}. ${agent.name} (${agent.role}) - ${agent.status}`);
    });

    // Check projects
    console.log('\n📊 Checking Projects...');
    const projects = await database
      .select()
      .from(require('../drizzle/schema').projects);
    
    console.log(`   Found ${projects.length} project(s)`);
    
    if (projects.length > 0) {
      projects.forEach((project: any) => {
        console.log(`   - ${project.name} (${project.status})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Azure SQL Schema is deployed and ready!');
    console.log('\n📝 Summary:');
    console.log(`   - Agents: ${agents.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Database: orchestrator-db`);
    console.log(`   - Server: aether-orch-897256.database.windows.net\n`);

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Verify DATABASE_URL in .env');
    console.log('   - Check Azure SQL firewall rules');
    console.log('   - Ensure schema has been deployed\n');
    process.exit(1);
  }
}

main();

