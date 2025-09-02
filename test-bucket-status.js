const { createClient } = require('@supabase/supabase-js')

// Configuración con tus credenciales
const SUPABASE_URL = 'https://yyeqybtcopfaccnpnorf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZXF5YnRjb3BmYWNjbnBub3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzYxNzUsImV4cCI6MjA3MjMxMjE3NX0.aqO1Ft-lAW_H_XRuON6kJCVyqxmNRA1votaqq3bjMhs'

// Crear cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkBucketStatus() {
  console.log('🔍 VERIFICANDO ESTADO DEL BUCKET SUPABASE')
  console.log('=' .repeat(50))
  
  try {
    // 1. Verificar conexión básica
    console.log('\n1️⃣ Verificando conexión a Supabase...')
    const { data: profile, error: profileError } = await supabase.auth.getUser()
    
    if (profileError) {
      console.log('❌ Error de autenticación:', profileError.message)
    } else {
      console.log('✅ Conexión a Supabase exitosa')
    }
    
    // 2. Listar todos los buckets disponibles
    console.log('\n2️⃣ Listando buckets disponibles...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.log('❌ Error listando buckets:', bucketsError.message)
      console.log('🔍 Detalles del error:', bucketsError)
    } else {
      console.log('✅ Buckets encontrados:', buckets.length)
      buckets.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`)
      })
    }
    
    // 3. Intentar acceder específicamente al bucket "educacion"
    console.log('\n3️⃣ Intentando acceder al bucket "educacion"...')
    const { data: educacionFiles, error: educacionError } = await supabase.storage
      .from('educacion')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })
    
    if (educacionError) {
      console.log('❌ Error accediendo al bucket "educacion":', educacionError.message)
      console.log('🔍 Código de error:', educacionError.statusCode)
      console.log('🔍 Detalles completos:', educacionError)
      
      // Analizar el tipo de error
      if (educacionError.message.includes('not found')) {
        console.log('💡 El bucket "educacion" no existe')
      } else if (educacionError.message.includes('unauthorized')) {
        console.log('💡 No tienes permisos para acceder al bucket')
      } else if (educacionError.message.includes('forbidden')) {
        console.log('💡 Acceso prohibido al bucket')
      }
    } else {
      console.log('✅ Acceso exitoso al bucket "educacion"')
      console.log('📁 Archivos encontrados:', educacionFiles.length)
      
      if (educacionFiles.length > 0) {
        educacionFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes)`)
        })
      } else {
        console.log('   📂 El bucket está vacío')
      }
    }
    
    // 4. Verificar políticas de storage
    console.log('\n4️⃣ Verificando políticas de storage...')
    try {
      const { data: policies, error: policiesError } = await supabase.rpc('get_storage_policies')
      if (policiesError) {
        console.log('❌ No se pudieron obtener políticas:', policiesError.message)
      } else {
        console.log('✅ Políticas de storage obtenidas')
        console.log('📋 Políticas:', policies)
      }
    } catch (error) {
      console.log('❌ Error verificando políticas:', error.message)
    }
    
    // 5. Intentar crear un bucket de prueba (si tienes permisos)
    console.log('\n5️⃣ Verificando permisos de creación de buckets...')
    try {
      const { data: testBucket, error: createError } = await supabase.storage.createBucket('test-bucket-verification', {
        public: false
      })
      
      if (createError) {
        console.log('❌ No puedes crear buckets:', createError.message)
      } else {
        console.log('✅ Puedes crear buckets')
        
        // Limpiar bucket de prueba
        const { error: deleteError } = await supabase.storage.deleteBucket('test-bucket-verification')
        if (deleteError) {
          console.log('⚠️ No se pudo eliminar bucket de prueba:', deleteError.message)
        } else {
          console.log('✅ Bucket de prueba eliminado')
        }
      }
    } catch (error) {
      console.log('❌ Error en prueba de creación:', error.message)
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message)
    console.log('🔍 Stack trace:', error.stack)
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('🏁 VERIFICACIÓN COMPLETADA')
}

// Ejecutar la verificación
checkBucketStatus().catch(console.error)
