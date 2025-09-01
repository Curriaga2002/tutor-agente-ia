-- Crear usuarios de prueba para el sistema de planeación didáctica
-- Nota: En producción, los usuarios se crearían a través del registro normal de Supabase

-- Insertar usuarios de prueba en auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'profesor1@colegio.edu.co',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Profesor Juan", "apellido": "García"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
),
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'profesora2@colegio.edu.co',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Profesora María", "apellido": "López"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

-- Insertar identidades correspondientes en auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub": "11111111-1111-1111-1111-111111111111", "email": "profesor1@colegio.edu.co"}',
  'email',
  NOW(),
  NOW(),
  NOW()
),
(
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '{"sub": "22222222-2222-2222-2222-222222222222", "email": "profesora2@colegio.edu.co"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Verificar las políticas RLS en la tabla planeaciones
-- Asegurar que las políticas permitan a los usuarios acceder solo a sus propias planeaciones

-- Habilitar RLS si no está habilitado
ALTER TABLE planeaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can insert own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can update own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can delete own planeaciones" ON planeaciones;

-- Crear políticas RLS para la tabla planeaciones
CREATE POLICY "Users can view own planeaciones" ON planeaciones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planeaciones" ON planeaciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planeaciones" ON planeaciones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own planeaciones" ON planeaciones
  FOR DELETE USING (auth.uid() = user_id);

-- Crear índice para mejorar el rendimiento de las consultas por user_id
CREATE INDEX IF NOT EXISTS idx_planeaciones_user_id ON planeaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_created_at ON planeaciones(created_at DESC);
