-- Aether Foundation AI Dev Orchestrator
-- Azure SQL Server (T-SQL) Schema
-- Database: orchestrator-db on aether-orch-897256.database.windows.net

-- 1. Projects Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[projects] (
  [id] INT IDENTITY(1,1) PRIMARY KEY,
  [name] NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(MAX),
  [status] NVARCHAR(50) DEFAULT 'draft',
  [vision] NVARCHAR(MAX),
  [strategy] NVARCHAR(MAX),
  [created_at] DATETIME2 DEFAULT GETUTCDATE(),
  [updated_at] DATETIME2 DEFAULT GETUTCDATE()
);
END
GO

-- 2. Modules Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[modules]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[modules] (
  [id] INT IDENTITY(1,1) PRIMARY KEY,
  [project_id] INT NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(MAX),
  [status] NVARCHAR(50) DEFAULT 'pending',
  [priority] NVARCHAR(20) DEFAULT 'medium',
  [created_at] DATETIME2 DEFAULT GETUTCDATE(),
  [updated_at] DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE
);
END
GO

-- 3. Tasks Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[tasks] (
  [id] INT IDENTITY(1,1) PRIMARY KEY,
  [module_id] INT NOT NULL,
  [title] NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(MAX),
  [requirements] NVARCHAR(MAX),
  [status] NVARCHAR(50) DEFAULT 'pending',
  [assigned_agent_id] INT,
  [progress_percentage] INT DEFAULT 0,
  [created_at] DATETIME2 DEFAULT GETUTCDATE(),
  [updated_at] DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY ([module_id]) REFERENCES [dbo].[modules]([id]) ON DELETE CASCADE
);
END
GO

-- 4. Agents Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[agents]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[agents] (
  [id] INT IDENTITY(1,1) PRIMARY KEY,
  [name] NVARCHAR(255) NOT NULL,
  [role] NVARCHAR(100) NOT NULL,
  [specialization] NVARCHAR(MAX),
  [status] NVARCHAR(50) DEFAULT 'idle',
  [current_task_id] INT,
  [created_at] DATETIME2 DEFAULT GETUTCDATE(),
  [updated_at] DATETIME2 DEFAULT GETUTCDATE()
);
END
GO

-- 5. Agent Activity Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[agent_activity]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[agent_activity] (
  [id] INT IDENTITY(1,1) PRIMARY KEY,
  [agent_id] INT NOT NULL,
  [task_id] INT,
  [action] NVARCHAR(255) NOT NULL,
  [details] NVARCHAR(MAX),
  [mcp_tool_called] NVARCHAR(255),
  [created_at] DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY ([agent_id]) REFERENCES [dbo].[agents]([id]) ON DELETE CASCADE,
  FOREIGN KEY ([task_id]) REFERENCES [dbo].[tasks]([id])
);
END
GO

-- 6. Users Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[users] (
  [id] INT IDENTITY(1,1) PRIMARY KEY,
  [name] NVARCHAR(255) NOT NULL,
  [email] NVARCHAR(255) NOT NULL UNIQUE,
  [role] NVARCHAR(50) DEFAULT 'user',
  [created_at] DATETIME2 DEFAULT GETUTCDATE(),
  [updated_at] DATETIME2 DEFAULT GETUTCDATE()
);
END
GO

-- Indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_modules_project_id')
    CREATE INDEX idx_modules_project_id ON [dbo].[modules]([project_id]);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tasks_module_id')
    CREATE INDEX idx_tasks_module_id ON [dbo].[tasks]([module_id]);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tasks_assigned_agent')
    CREATE INDEX idx_tasks_assigned_agent ON [dbo].[tasks]([assigned_agent_id]);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_agent_activity_agent_id')
    CREATE INDEX idx_agent_activity_agent_id ON [dbo].[agent_activity]([agent_id]);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_agent_activity_task_id')
    CREATE INDEX idx_agent_activity_task_id ON [dbo].[agent_activity]([task_id]);
GO

-- Insert Aether Foundation specialized agents (including Orchestrator)
IF NOT EXISTS (SELECT * FROM [dbo].[agents] WHERE [role] = 'orchestrator')
BEGIN
  INSERT INTO [dbo].[agents] ([name], [role], [specialization], [status]) VALUES
    ('Aether Orchestrator', 'orchestrator', 'Overall system coordination, task delegation, workflow management, agent coordination', 'idle'),
    ('Aether Project Manager', 'project_manager', 'Aether CRM planning, multi-tenant architecture, customer pipeline management', 'idle'),
    ('Aether Research Agent', 'research', 'CRM market analysis, Supabase/Azure best practices, multi-tenant SaaS research', 'idle'),
    ('Aether Architecture Agent', 'architecture', 'Multi-tenant DB design, RBAC systems, Supabase schema, Azure integration', 'idle'),
    ('Aether Frontend Agent', 'frontend', 'React+TypeScript+Wouter, shadcn/ui, CRM dashboards, Kanban/Table views', 'idle'),
    ('Aether Backend Agent', 'backend', 'tRPC APIs, Supabase integration, multi-tenant isolation, permissions middleware', 'idle'),
    ('Aether DevOps Agent', 'devops', 'Netlify deployment, Supabase/Azure setup, environment configuration', 'idle'),
    ('Aether QA Agent', 'qa', 'CRM workflow testing, permissions testing, multi-tenant data isolation verification', 'idle');
END
GO

-- Insert a demo user
IF NOT EXISTS (SELECT * FROM [dbo].[users] WHERE [email] = 'admin@aether.dev')
BEGIN
  INSERT INTO [dbo].[users] ([name], [email], [role]) VALUES
    ('Admin User', 'admin@aether.dev', 'admin');
END
GO

-- Insert Aether CRM demo project
IF NOT EXISTS (SELECT * FROM [dbo].[projects] WHERE [name] = 'Aether CRM')
BEGIN
  INSERT INTO [dbo].[projects] ([name], [description], [status], [vision]) VALUES
    ('Aether CRM', 'Multi-tenant CRM platform with customer pipeline management, RBAC, and Supabase integration', 'active', 'Build a world-class multi-tenant CRM for Aether Foundation with AI-powered orchestration');
END
GO

-- Verification queries
SELECT 'Tables Created' AS Status;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME;

SELECT 'Agents Created' AS Status;
SELECT [id], [name], [role], [status] FROM [dbo].[agents] ORDER BY [id];

SELECT 'Projects Created' AS Status;
SELECT [id], [name], [status] FROM [dbo].[projects];

SELECT 'Users Created' AS Status;
SELECT [id], [name], [email], [role] FROM [dbo].[users];
