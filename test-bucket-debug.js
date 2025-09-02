// Script de depuración para el bucket de Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yyeqybtcopfaccnpnorf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZXF5YnRjb3BmYWNjbnBub3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzYxNzUsImV4cCI6MjA3MjMxMjE3NX0.aqO1Ft-lAW_H_XRuON6kJCVxmnRA1votaqq3bjMhs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBucket() {
  console.log('🔍 **INICIANDO DEPURACIÓN DEL BUCKET**')
  
  try {
    // 1. Verificar conexión básica
    console.log('1️⃣ Verificando conexión básica...')
    const { data: testData, error: testError } = await supabase
      .from('planeaciones')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error de conexión básica:', testError)
      return
    }
    console.log('✅ Conexión básica exitosa')
    
    // 2. Listar buckets disponibles
    console.log('\n2️⃣ Listando buckets disponibles...')
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
    } else {
      console.log('📦 Buckets disponibles:', buckets.map(b => ({ name: b.name, id: b.id, public: b.public })))
    }
    
    // 3. Verificar bucket específico 'educacion'
    console.log('\n3️⃣ Verificando bucket "educacion"...')
    const { data: bucketInfo, error: bucketError } = await supabase
      .storage
      .getBucket('educacion')
    
    if (bucketError) {
      console.error('❌ Error accediendo al bucket educacion:', bucketError)
      console.log('💡 El bucket "educacion" no existe o no tienes permisos')
      return
    }
    console.log('✅ Bucket "educacion" encontrado:', bucketInfo)
    
    // 4. Listar archivos del bucket
    console.log('\n4️⃣ Listando archivos del bucket "educacion"...')
    const { data: files, error: filesError } = await supabase
      .storage
      .from('educacion')
      .list('', {
        limit: 100,
        offset: 0
      })
    
    if (filesError) {
      console.error('❌ Error listando archivos:', filesError)
      console.log('💡 Posible problema de permisos RLS')
    } else {
      console.log('📁 Archivos encontrados:', files.length)
      files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name} (${file.id}) - ${file.updated_at}`)
        if (file.name === '.emptyFolderPlaceholder') {
          console.log('     ⚠️ ARCHIVO PROBLEMÁTICO DETECTADO')
        }
      })
    }
    
    // 5. Verificar políticas RLS
    console.log('\n5️⃣ Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_storage_policies', { bucket_name: 'educacion' })
      .catch(() => ({ data: null, error: 'Función no disponible' }))
    
    if (policiesError) {
      console.log('ℹ️ No se pudieron verificar políticas RLS directamente')
      console.log('💡 Verifica manualmente en el dashboard de Supabase')
    } else {
      console.log('📋 Políticas RLS:', policies)
    }
    
    // 6. Intentar subir un archivo de prueba
    console.log('\n6️⃣ Intentando subir archivo de prueba...')
    const testContent = 'Archivo de prueba para verificar permisos'
    const testBlob = new Blob([testContent], { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('educacion')
      .upload('test-permissions.txt', testBlob, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Error subiendo archivo de prueba:', uploadError)
      console.log('💡 Problema de permisos de escritura')
    } else {
      console.log('✅ Archivo de prueba subido exitosamente:', uploadData)
      
      // Limpiar archivo de prueba
      const { error: deleteError } = await supabase
        .storage
        .from('educacion')
        .remove(['test-permissions.txt'])
      
      if (deleteError) {
        console.log('⚠️ No se pudo eliminar el archivo de prueba:', deleteError)
      } else {
        console.log('✅ Archivo de prueba eliminado')
      }
    }
    
  } catch (error) {
    console.error('❌ Error general en depuración:', error)
  }
}

// Ejecutar depuración
debugBucket()
