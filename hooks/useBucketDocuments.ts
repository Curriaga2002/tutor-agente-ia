import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../lib/supabase/client'
import { PDFContent, processAllPDFs } from '../lib/pdf-content-processor'

// Crear cliente de Supabase
const supabase = createClient()

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
        setDocuments([])
        return
      }
      
      
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
          return false
        }
        
        // Excluir archivos ocultos
        if (file.name.startsWith('.')) {
          return false
        }
        
        // Solo incluir archivos con extensiones válidas
        const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
        const hasValidExtension = validExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        )
        
        if (!hasValidExtension) {
          return false
        }
        
        return true
      })
      
      
      if (validFiles.length === 0) {
        setDocuments([])
        return
      }
      
      // Procesar solo los archivos válidos
      const processedDocs = await processAllPDFs(validFiles)
      
      setDocuments(processedDocs)
      setLastUpdated(new Date())
      
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
          
          // Refrescar documentos cuando hay cambios
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
            loadDocuments()
          }
        }
      )
      .subscribe()

    // Limpiar suscripción al desmontar
    return () => {
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
