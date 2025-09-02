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
      
      console.log('🔄 Cargando documentos del bucket en tiempo real...')
      
      // Procesar todos los PDFs del bucket
      const processedDocs = await processAllPDFs()
      
      if (processedDocs && processedDocs.length > 0) {
        setDocuments(processedDocs)
        setLastUpdated(new Date())
        console.log(`✅ ${processedDocs.length} documentos cargados exitosamente`)
      } else {
        setDocuments([])
        setError('No se encontraron documentos en el bucket')
        console.log('⚠️ No se encontraron documentos en el bucket')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('❌ Error cargando documentos:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
