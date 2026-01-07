/*
  # Aether CRM Platform Database Schema

  ## Summary
  Creates the complete database schema for the Aether CRM platform, including multi-tenant company management, user authentication, pipeline configurations, and CRM entities.

  ## New Tables

  ### Platform Tables
  1. **companies** - Multi-tenant company records
    - `id` (uuid, primary key)
    - `name` (text) - Company name
    - `slug` (text, unique) - URL-friendly identifier
    - `plan` (text) - Subscription plan (free, starter, pro, enterprise)
    - `settings` (jsonb) - Company settings (branding, features, defaults)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. **users** - User accounts with authentication
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key → companies)
    - `email` (text, unique) - User email for login
    - `name` (text) - Full name
    - `role` (text) - User role (admin, dev, management, sales, support, team)
    - `role_id` (uuid, nullable) - Custom role reference
    - `avatar` (text, nullable) - Avatar initials or URL
    - `password_hash` (text) - Hashed password
    - `last_login` (timestamptz, nullable)
    - `created_at` (timestamptz)

  3. **db_connections** - Customer database connection configs
  4. **pipeline_configs** - Pipeline definitions
  5. **role_definitions** - Custom role definitions
  6. **students** - Student records
  7. **tutors** - Tutor records
  8. **packages** - Package records

  ## Security
  - RLS enabled on all tables
  - Users can only access data from their own company
  - Role-based access control for pipeline data
  - Authenticated-only access to all tables

  ## Important Notes
  1. All timestamps use timestamptz for proper timezone handling
  2. JSONB fields allow flexible schema evolution
  3. company_id used for multi-tenant data isolation
  4. Foreign keys ensure referential integrity
  5. Indexes added for common query patterns
*/

-- =====================================================
-- CREATE ALL TABLES FIRST
-- =====================================================

-- COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  role_id uuid,
  avatar text,
  password_hash text NOT NULL,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- DB_CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS db_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  api_url text,
  api_key text,
  host text,
  port integer,
  database text,
  username text,
  password text,
  is_active boolean DEFAULT false,
  test_status text DEFAULT 'pending',
  last_tested_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_db_connections_company_id ON db_connections(company_id);

-- PIPELINE_CONFIGS TABLE
CREATE TABLE IF NOT EXISTS pipeline_configs (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  entity_type text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_roles text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_configs_company_id ON pipeline_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_configs_entity_type ON pipeline_configs(entity_type);

-- ROLE_DEFINITIONS TABLE
CREATE TABLE IF NOT EXISTS role_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  role_type text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_definitions_company_id ON role_definitions(company_id);

-- STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'new',
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  notes text,
  metadata jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_company_id ON students(company_id);
CREATE INDEX IF NOT EXISTS idx_students_stage ON students(stage);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- TUTORS TABLE
CREATE TABLE IF NOT EXISTS tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'applied',
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  tier text,
  specializations text[],
  notes text,
  metadata jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tutors_company_id ON tutors(company_id);
CREATE INDEX IF NOT EXISTS idx_tutors_stage ON tutors(stage);
CREATE INDEX IF NOT EXISTS idx_tutors_email ON tutors(email);

-- PACKAGES TABLE
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'new',
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id uuid REFERENCES tutors(id) ON DELETE SET NULL,
  subject text,
  total_lessons integer,
  completed_lessons integer DEFAULT 0,
  price decimal(10, 2),
  paid_amount decimal(10, 2) DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  notes text,
  metadata jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_packages_company_id ON packages(company_id);
CREATE INDEX IF NOT EXISTS idx_packages_stage ON packages(stage);
CREATE INDEX IF NOT EXISTS idx_packages_student_id ON packages(student_id);
CREATE INDEX IF NOT EXISTS idx_packages_tutor_id ON packages(tutor_id);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE db_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- COMPANIES POLICIES
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- USERS POLICIES
CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage users in their company"
  ON users FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- DB_CONNECTIONS POLICIES
CREATE POLICY "Users can view connections in their company"
  ON db_connections FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage connections in their company"
  ON db_connections FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- PIPELINE_CONFIGS POLICIES
CREATE POLICY "Users can view pipelines in their company"
  ON pipeline_configs FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage pipelines in their company"
  ON pipeline_configs FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev', 'management')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev', 'management')
    )
  );

-- ROLE_DEFINITIONS POLICIES
CREATE POLICY "Users can view roles in their company"
  ON role_definitions FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage roles in their company"
  ON role_definitions FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- STUDENTS POLICIES
CREATE POLICY "Users can view students in their company"
  ON students FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create students in their company"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update students in their company"
  ON students FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete students in their company"
  ON students FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- TUTORS POLICIES
CREATE POLICY "Users can view tutors in their company based on role"
  ON tutors FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dev', 'management')
    )
  );

CREATE POLICY "Authorized users can create tutors"
  ON tutors FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dev', 'management')
    )
  );

CREATE POLICY "Authorized users can update tutors"
  ON tutors FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dev', 'management')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dev', 'management')
    )
  );

CREATE POLICY "Admins can delete tutors"
  ON tutors FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- PACKAGES POLICIES
CREATE POLICY "Users can view packages in their company based on role"
  ON packages FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dev', 'management', 'sales')
    )
  );

CREATE POLICY "Authorized users can create packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dev', 'management', 'sales')
    )
  );

CREATE POLICY "Authorized users can update packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dev', 'management', 'sales')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dev', 'management', 'sales')
    )
  );

CREATE POLICY "Admins can delete packages"
  ON packages FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );
