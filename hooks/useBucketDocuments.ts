import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PDFContent, processAllPDFs } from '../lib/pdf-content-processor'

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UseBucketDocumentsReturn {
  documents: PDFContent[]
  isLoading: boolean
  error: string | null
  refreshDocuments: () => Promise<void>
  documentCount: number
  lastUpdated: Date | null
}

export function useBucketDocuments(): UseBucketDocumentsReturn {
  const [documents, setDocuments] = useState<PDFContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Función para cargar documentos
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 Cargando documentos del bucket...')
      
      // Listar archivos del bucket
      const { data: files, error } = await supabase.storage
        .from('educacion')
        .list('', {
          limit: 1000,
          offset: 0
        })
      
      if (error) {
        console.error('❌ Error listando archivos:', error)
        setError(`Error listando archivos: ${error.message}`)
        return
      }
      
      if (!files || files.length === 0) {
        console.log('📁 No se encontraron archivos en el bucket')
        setDocuments([])
        return
      }
      
      console.log(`📁 Archivos encontrados en el bucket: ${files.length}`)
      
      // Filtrar archivos del sistema y archivos problemáticos
      const validFiles = files.filter(file => {
        // Excluir archivos del sistema
        const systemFiles = [
          '.emptyFolderPlaceholder',
          '.DS_Store',
          'Thumbs.db',
          '.gitkeep',
          '.gitignore'
        ]
        
        if (systemFiles.includes(file.name)) {
          console.log(`🚫 Archivo del sistema excluido: ${file.name}`)
          return false
        }
        
        // Excluir archivos ocultos
        if (file.name.startsWith('.')) {
          console.log(`🚫 Archivo oculto excluido: ${file.name}`)
          return false
        }
        
        // Solo incluir archivos con extensiones válidas
        const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
        const hasValidExtension = validExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        )
        
        if (!hasValidExtension) {
          console.log(`🚫 Archivo sin extensión válida excluido: ${file.name}`)
          return false
        }
        
        return true
      })
      
      console.log(`✅ Archivos válidos después del filtrado: ${validFiles.length}`)
      
      if (validFiles.length === 0) {
        console.log('⚠️ No hay archivos válidos después del filtrado')
        setDocuments([])
        return
      }
      
      // Procesar solo los archivos válidos
      const processedDocs = await processAllPDFs(validFiles)
      console.log(`📚 Documentos procesados exitosamente: ${processedDocs.length}`)
      
      setDocuments(processedDocs)
      setLastUpdated(Date.now())
      
    } catch (error) {
      console.error('❌ Error cargando documentos:', error)
      setError(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }, [supabase.storage])

  // Función para refrescar documentos
  const refreshDocuments = useCallback(async () => {
    await loadDocuments()
  }, [loadDocuments])

  // Cargar documentos al montar el componente
  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Configurar suscripción en tiempo real al bucket
  useEffect(() => {
    console.log('🔔 Configurando suscripción en tiempo real al bucket...')
    
    // Suscribirse a cambios en el bucket
    const channel = supabase
      .channel('bucket-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'storage',
          table: 'objects',
          filter: `bucket_id=eq.educacion`
        },
        (payload) => {
          console.log('🔄 Cambio detectado en el bucket:', payload)
          
          // Refrescar documentos cuando hay cambios
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
            console.log('📝 Cambio detectado, refrescando documentos...')
            loadDocuments()
          }
        }
      )
      .subscribe()

    // Limpiar suscripción al desmontar
    return () => {
      console.log('🔕 Desuscribiendo del bucket...')
      supabase.removeChannel(channel)
    }
  }, [loadDocuments])

  return {
    documents,
    isLoading,
    error,
    refreshDocuments,
    documentCount: documents.length,
    lastUpdated
  }
}
