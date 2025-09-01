-- Remove user_id column and RLS policies to make the app completely open
-- This allows anyone to access all planeaciones without authentication

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can insert own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can update own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can delete own planeaciones" ON planeaciones;

-- Disable RLS on the table
ALTER TABLE planeaciones DISABLE ROW LEVEL SECURITY;

-- Remove the user_id column since we no longer need user association
ALTER TABLE planeaciones DROP COLUMN IF EXISTS user_id;

-- Create a simple policy to allow all operations for everyone
ALTER TABLE planeaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for everyone" ON planeaciones FOR ALL USING (true) WITH CHECK (true);
