-- ============================================
-- MIGRATION: New Features (User Settings, Export History)
-- ============================================
-- Führen Sie dieses Skript im Supabase SQL Editor aus
-- Dashboard → SQL Editor → New Query → Paste & Run

-- ============================================
-- 1. USER SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    default_exchange_rate VARCHAR(10) DEFAULT '1.0',
    default_export_format VARCHAR(20) DEFAULT 'excel',
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- 2. EXPORT HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS export_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    invoice_count INTEGER NOT NULL DEFAULT 0,
    month VARCHAR(7),
    parameters TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON export_history(created_at);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- User Settings Policies
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
CREATE POLICY "Users can read own settings"
ON user_settings FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

-- Export History Policies
DROP POLICY IF EXISTS "Users can read own export history" ON export_history;
CREATE POLICY "Users can read own export history"
ON export_history FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own export history" ON export_history;
CREATE POLICY "Users can insert own export history"
ON export_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own export history" ON export_history;
CREATE POLICY "Users can delete own export history"
ON export_history FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- ============================================
-- 4. FUNKTION FÜR AUTOMATISCHES UPDATED_AT
-- ============================================
-- Falls die Funktion bereits existiert, wird sie überschrieben

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 5. TRIGGER FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FERTIG!
-- ============================================

