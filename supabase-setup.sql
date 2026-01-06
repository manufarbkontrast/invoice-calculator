-- ============================================
-- SUPABASE DATABASE SETUP SCRIPT
-- ============================================
-- Führen Sie dieses Skript im Supabase SQL Editor aus
-- Dashboard → SQL Editor → New Query → Paste & Run

-- ============================================
-- 1. ENUMS ERSTELLEN
-- ============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. TABELLEN ERSTELLEN
-- ============================================

-- Users Tabelle
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Supabase Auth UUID
    email VARCHAR(320) NOT NULL UNIQUE,
    name TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Teams Tabelle
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Team Members Tabelle
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role team_role DEFAULT 'member' NOT NULL,
    invited_by TEXT REFERENCES users(id),
    invited_at TIMESTAMP DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Team Invitations Tabelle
CREATE TABLE IF NOT EXISTS team_invitations (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email VARCHAR(320) NOT NULL,
    role team_role DEFAULT 'member' NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    invited_by TEXT NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Projects Tabelle
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#000000',
    budget INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Invoices Tabelle
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    tool_name VARCHAR(255),
    company_name VARCHAR(255),
    amount INTEGER NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    invoice_date TIMESTAMP,
    period VARCHAR(255),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    month VARCHAR(7) NOT NULL,
    payment_status payment_status DEFAULT 'pending' NOT NULL,
    paid_at TIMESTAMP,
    due_date TIMESTAMP,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_group_id VARCHAR(255),
    content_hash VARCHAR(64),
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    notes TEXT,
    status invoice_status DEFAULT 'processing' NOT NULL,
    extraction_error TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 3. INDIZES FÜR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(month);
CREATE INDEX IF NOT EXISTS idx_invoices_content_hash ON invoices(content_hash);
CREATE INDEX IF NOT EXISTS idx_invoices_recurring_group ON invoices(recurring_group_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) AKTIVIEREN
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Users Policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Projects Policies
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
CREATE POLICY "Users can read own projects"
ON projects FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text OR 
    team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- Invoices Policies
DROP POLICY IF EXISTS "Users can read own invoices" ON invoices;
CREATE POLICY "Users can read own invoices"
ON invoices FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text OR 
    team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "Users can create own invoices" ON invoices;
CREATE POLICY "Users can create own invoices"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
CREATE POLICY "Users can update own invoices"
ON invoices FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;
CREATE POLICY "Users can delete own invoices"
ON invoices FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- Teams Policies
DROP POLICY IF EXISTS "Users can read teams they belong to" ON teams;
CREATE POLICY "Users can read teams they belong to"
ON teams FOR SELECT
TO authenticated
USING (
    owner_id = auth.uid()::text OR
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can create teams" ON teams;
CREATE POLICY "Users can create teams"
ON teams FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own teams" ON teams;
CREATE POLICY "Users can update own teams"
ON teams FOR UPDATE
TO authenticated
USING (owner_id = auth.uid()::text);

-- Team Members Policies
DROP POLICY IF EXISTS "Users can read team members of their teams" ON team_members;
CREATE POLICY "Users can read team members of their teams"
ON team_members FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()::text
    ) OR
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()::text)
);

-- Team Invitations Policies
DROP POLICY IF EXISTS "Users can read team invitations of their teams" ON team_invitations;
CREATE POLICY "Users can read team invitations of their teams"
ON team_invitations FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()::text
    ) OR
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()::text)
);

-- ============================================
-- 6. FUNKTION FÜR AUTOMATISCHES UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FERTIG!
-- ============================================



