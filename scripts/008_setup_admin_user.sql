-- Script para configurar el usuario administrador
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear usuario administrador
-- Nota: Este comando debe ejecutarse desde el dashboard de Supabase
-- Authentication > Users > Invite User
-- Email: admin@admin.com
-- Password: admin123

-- 2. Verificar que el usuario existe
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'admin@admin.com';

-- 3. Configurar políticas RLS para planeaciones
-- Permitir que todos los usuarios autenticados vean las planeaciones
CREATE POLICY "Users can view all planeaciones" ON planeaciones
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir que todos los usuarios autenticados creen planeaciones
CREATE POLICY "Users can create planeaciones" ON planeaciones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Solo permitir que el usuario admin elimine planeaciones
CREATE POLICY "Only admin can delete planeaciones" ON planeaciones
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  );

-- Permitir que los usuarios actualicen sus propias planeaciones
CREATE POLICY "Users can update their own planeaciones" ON planeaciones
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'planeaciones';

-- 5. Crear función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@admin.com'
  );
$$;

-- 6. Crear función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'admin@admin.com'
      ) THEN 'admin'
      ELSE 'user'
    END;
$$;

-- 7. Verificar funciones creadas
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('is_admin', 'get_user_role');
