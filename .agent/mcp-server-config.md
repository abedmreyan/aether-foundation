# Dev MCP Server Configuration

## Overview

Your custom Dev MCP Server provides integrations for:
- GitHub (repos, issues, PRs)
- Netlify (deployments, sites)
- Supabase (database queries, storage)
- Azure (VMs, databases, containers, storage)
- Google Tasks & Sheets (project management)
- Perplexity AI (research)
- Gemini AI (code generation)

## Making the Server Persistent

Your Dev MCP server should **always** be active when working on Aether Foundation.

### Configuration Steps

1. **Open Cursor Settings**
   - Press `Cmd + ,` (Mac) or `Ctrl + ,` (Windows/Linux)
   - OR: `Cmd + Shift + P` → Search for "Preferences: Open User Settings (JSON)"

2. **Add MCP Server Configuration**

Add this configuration to your Cursor settings JSON:

```json
{
  "mcp": {
    "servers": {
      "dev-mcp": {
        "command": "node",
        "args": [
          "./dist/index.js"
        ],
        "cwd": "/Users/abedmreyan/Desktop/MCP Servers/Dev MCP",
        "env": {
          "GITHUB_TOKEN": "${GITHUB_TOKEN}",
          "NETLIFY_TOKEN": "${NETLIFY_TOKEN}",
          "SUPABASE_URL": "${SUPABASE_URL}",
          "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}",
          "DATABASE_URL": "${DATABASE_URL}",
          "AZURE_TENANT_ID": "${AZURE_TENANT_ID}",
          "AZURE_SUBSCRIPTION_ID": "${AZURE_SUBSCRIPTION_ID}",
          "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
          "GOOGLE_GENAI_API_KEY": "${GOOGLE_GENAI_API_KEY}"
        }
      }
    }
  }
}
```

**Important Notes:**
- The `cwd` (current working directory) must point to your MCP server folder
- Note the space in the folder name: `"Dev MCP"` (not `"Dev MCP "`)
- Environment variables use `${VAR_NAME}` syntax to reference system env vars

3. **Set Environment Variables**

Your system needs these environment variables configured. Add them to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
# Dev MCP Server - API Keys
export GITHUB_TOKEN="your_github_token"
export NETLIFY_TOKEN="your_netlify_token"
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_KEY="your_supabase_key"
export DATABASE_URL="your_database_url"
export AZURE_TENANT_ID="your_azure_tenant"
export AZURE_SUBSCRIPTION_ID="your_azure_subscription"
export PERPLEXITY_API_KEY="your_perplexity_key"
export GOOGLE_GENAI_API_KEY="your_gemini_key"
```

After adding these, run:
```bash
source ~/.zshrc  # or ~/.bash_profile
```

4. **Restart MCP Servers**
   - Press `Cmd + Shift + P`
   - Type "MCP: Restart Servers"
   - OR restart Cursor entirely

## Verification

After configuration, check your MCP server status:

1. Open Command Palette: `Cmd + Shift + P`
2. Type "MCP: List Servers"
3. You should see "dev-mcp" listed as active

## Available Tools

Once configured, you'll have access to 50+ tools:

### GitHub (8 tools)
- `github_list_repos`, `github_create_repo`, `github_get_repo`
- `github_list_issues`, `github_create_issue`
- `github_list_pull_requests`, `github_create_pull_request`

### Netlify (5 tools)
- `netlify_list_sites`, `netlify_create_site`, `netlify_get_site`
- `netlify_list_deployments`, `netlify_deploy`

### Supabase (5 tools)
- `supabase_query`, `supabase_list_tables`, `supabase_create_table`
- `supabase_list_storage_buckets`, `supabase_upload_file`

### Azure (20+ tools)
- Resource management, Web Apps, VMs
- PostgreSQL, MySQL, SQL Server, Cosmos DB
- Container Instances, AKS
- Blob Storage

### Google (12 tools)
- Tasks: Create, update, delete tasks and task lists
- Sheets: Read, write, append, update spreadsheets

### AI Tools (8 tools)
- Perplexity: Search, research with citations
- Gemini: Generate code, review code, explain code

## Troubleshooting

### Server Not Appearing
1. Check Cursor settings JSON is valid (no syntax errors)
2. Verify the `cwd` path exists and is correct
3. Restart Cursor completely (not just reload window)

### Server Disconnects
1. Check environment variables are exported in your shell
2. Verify the compiled server exists: `/Users/abedmreyan/Desktop/MCP Servers/Dev MCP/dist/index.js`
3. Check MCP server logs in Cursor's output panel

### Environment Variable Issues
1. Ensure variables are exported (use `echo $GITHUB_TOKEN` to test)
2. Restart terminal/Cursor after adding variables
3. Don't use quotes around variable values in the MCP config

### Build Issues
If the server code changes, rebuild it:
```bash
cd "/Users/abedmreyan/Desktop/MCP Servers/Dev MCP"
npm run build
```

## Integration with Aether Foundation

Your Dev MCP server is perfect for:

- **GitHub**: Managing the Aether Foundation repo, creating issues
- **Netlify**: Deploying production builds of the CRM
- **Supabase**: Direct database queries for data analysis
- **Azure**: If you migrate to Azure hosting
- **Google Sheets**: Export CRM data for analysis
- **Perplexity**: Research competitor CRM features
- **Gemini**: Generate boilerplate components

## Quick Test

After configuration, ask me:
"List my GitHub repositories using the Dev MCP server"

This will verify the server is working correctly.

---

**Last Updated**: December 15, 2025
**Server Location**: `/Users/abedmreyan/Desktop/MCP Servers/Dev MCP`
**Server Version**: 1.0.0





