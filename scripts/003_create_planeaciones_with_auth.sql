-- Crear tabla planeaciones con relación correcta a auth.users
CREATE TABLE IF NOT EXISTS planeaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  grado TEXT NOT NULL,
  tema TEXT NOT NULL,
  duracion TEXT NOT NULL,
  sesiones INT4 NOT NULL,
  contenido JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para mejorar rendimiento en consultas por usuario
CREATE INDEX IF NOT EXISTS idx_planeaciones_user_id ON planeaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_created_at ON planeaciones(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE planeaciones ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propias planeaciones
CREATE POLICY "Users can view own planeaciones" ON planeaciones
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan insertar sus propias planeaciones
CREATE POLICY "Users can insert own planeaciones" ON planeaciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar sus propias planeaciones
CREATE POLICY "Users can update own planeaciones" ON planeaciones
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan eliminar sus propias planeaciones
CREATE POLICY "Users can delete own planeaciones" ON planeaciones
  FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_planeaciones_updated_at 
  BEFORE UPDATE ON planeaciones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
