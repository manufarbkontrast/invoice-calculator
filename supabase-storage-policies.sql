-- ============================================
-- SUPABASE STORAGE POLICIES
-- ============================================
-- Führen Sie dieses Skript im Supabase SQL Editor aus
-- NACH dem Erstellen der Storage Buckets (siehe SUPABASE-SETUP.md)

-- ============================================
-- INVOICES BUCKET POLICIES
-- ============================================

-- Users can upload invoices to their own folder
DROP POLICY IF EXISTS "Users can upload invoices" ON storage.objects;
CREATE POLICY "Users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own invoices
DROP POLICY IF EXISTS "Users can read own invoices" ON storage.objects;
CREATE POLICY "Users can read own invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own invoices
DROP POLICY IF EXISTS "Users can delete own invoices" ON storage.objects;
CREATE POLICY "Users can delete own invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- EXPORTS BUCKET POLICIES
-- ============================================

-- Users can upload exports to their own folder
DROP POLICY IF EXISTS "Users can upload exports" ON storage.objects;
CREATE POLICY "Users can upload exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own exports
DROP POLICY IF EXISTS "Users can read own exports" ON storage.objects;
CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own exports
DROP POLICY IF EXISTS "Users can delete own exports" ON storage.objects;
CREATE POLICY "Users can delete own exports"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- FERTIG!
-- ============================================





