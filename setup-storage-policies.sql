-- =====================================================
-- CONFIGURACIÓN DE POLÍTICAS RLS PARA STORAGE
-- Bucket: educacion
-- =====================================================

-- 1. Habilitar RLS en el bucket (si no está habilitado)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Política para permitir LECTURA PÚBLICA de todos los archivos
CREATE POLICY "Permitir lectura pública de documentos educativos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'educacion' 
  AND (storage.foldername(name))[1] = 'educacion'
);

-- 3. Política para permitir INSERCIÓN de archivos en el bucket educacion
CREATE POLICY "Permitir inserción de documentos educativos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'educacion' 
  AND (storage.foldername(name))[1] = 'educacion'
);

-- 4. Política para permitir ACTUALIZACIÓN de archivos existentes
CREATE POLICY "Permitir actualización de documentos educativos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'educacion' 
  AND (storage.foldername(name))[1] = 'educacion'
);

-- 5. Política para permitir ELIMINACIÓN de archivos (opcional)
CREATE POLICY "Permitir eliminación de documentos educativos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'educacion' 
  AND (storage.foldername(name))[1] = 'educacion'
);

-- 6. Política alternativa más permisiva (si las anteriores fallan)
-- Esta política permite acceso completo al bucket educacion
CREATE POLICY "Acceso completo al bucket educacion" ON storage.objects
FOR ALL USING (
  bucket_id = 'educacion'
);

-- 7. Verificar que el bucket existe y tiene las configuraciones correctas
-- SELECT * FROM storage.buckets WHERE id = 'educacion';

-- 8. Verificar las políticas existentes
-- SELECT * FROM pg_policies WHERE tablename = 'objects';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Ejecuta este script en el SQL Editor de Supabase
-- 2. Si las políticas ya existen, usa CREATE OR REPLACE POLICY
-- 3. Asegúrate de que el bucket 'educacion' esté creado
-- 4. Las políticas se aplican inmediatamente después de ejecutarlas
-- =====================================================
