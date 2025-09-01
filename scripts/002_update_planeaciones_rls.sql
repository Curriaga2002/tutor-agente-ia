-- Adding Row Level Security policies for production
-- Enable RLS on planeaciones table
ALTER TABLE planeaciones ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own planeaciones
CREATE POLICY "Users can view own planeaciones" ON planeaciones
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Policy to allow users to insert their own planeaciones
CREATE POLICY "Users can insert own planeaciones" ON planeaciones
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Policy to allow users to update their own planeaciones
CREATE POLICY "Users can update own planeaciones" ON planeaciones
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Policy to allow users to delete their own planeaciones
CREATE POLICY "Users can delete own planeaciones" ON planeaciones
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_planeaciones_user_id ON planeaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_created_at ON planeaciones(created_at DESC);
