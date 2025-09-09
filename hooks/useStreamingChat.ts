import { useCallback, useState, useRef } from 'react'
import { useChat } from '../contexts/ChatContext'
import { usePlanning } from '../contexts/PlanningContext'
import { useDocuments } from '../contexts/DocumentContext'
import { PDFContent } from '../types'

export function useStreamingChat() {
  const { 
    addMessage, 
    updateMessage,
    setLoading, 
    setSaving, 
    setError,
    updateConsultedDocuments,
    planningConfig,
    messages
  } = useChat()
  
  const { addToChatHistory } = usePlanning()
  const { searchDocuments, documents } = useDocuments()
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Función para buscar documentos relevantes
  const searchRelevantDocuments = useCallback(async (query: string): Promise<PDFContent[]> => {
    try {
      return searchDocuments(query)
    } catch (error) {
      console.error('❌ Error buscando documentos:', error)
      return []
    }
  }, [searchDocuments])

  // Función para consultar documentos institucionales
  const consultarDocumentosInstitucionales = useCallback(async (): Promise<{
    pei: PDFContent[]
    modeloPedagogico: PDFContent[]
    orientacionesCurriculares: PDFContent[]
    tabla7: PDFContent[]
    todosLosDocumentos: PDFContent[]
  }> => {
    try {
      // Buscar PEI
      const peiDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes('pei') ||
        doc.title.toLowerCase().includes('proyecto educativo') ||
        doc.content.toLowerCase().includes('proyecto educativo institucional')
      )
      
      // Buscar Modelo Pedagógico
      const modeloPedagogicoDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes('modelo pedagógico') ||
        doc.title.toLowerCase().includes('enfoque pedagógico') ||
        doc.content.toLowerCase().includes('modelo pedagógico')
      )
      
      // Buscar Orientaciones Curriculares
      const orientacionesCurricularesDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes('orientaciones') ||
        doc.title.toLowerCase().includes('curricular') ||
        doc.content.toLowerCase().includes('orientaciones curriculares')
      )
      
      // Buscar Tabla 7
      const tabla7Docs = documents.filter(doc => 
        doc.title.toLowerCase().includes('tabla 7') ||
        doc.content.toLowerCase().includes('tabla 7') ||
        doc.content.toLowerCase().includes('criterios de evaluación')
      )
      
      const todosLosDocumentos = [...documents]
      
      return {
        pei: peiDocs,
        modeloPedagogico: modeloPedagogicoDocs,
        orientacionesCurriculares: orientacionesCurricularesDocs,
        tabla7: tabla7Docs,
        todosLosDocumentos
      }
    } catch (error) {
      console.error('❌ Error consultando documentos institucionales:', error)
      return { 
        pei: [], 
        modeloPedagogico: [], 
        orientacionesCurriculares: [],
        tabla7: [],
        todosLosDocumentos: []
      }
    }
  }, [documents])

  // Función para generar respuesta con streaming
  const generateStreamingResponse = useCallback(async (
    userInput: string, 
    relevantDocs: PDFContent[], 
    chatHistory: any[]
  ): Promise<void> => {
    try {
      setLoading(true)
      setIsStreaming(true)
      
      // Crear nuevo AbortController para esta solicitud
      abortControllerRef.current = new AbortController()
      
      // Consultar documentos institucionales
      const documentosInstitucionales = await consultarDocumentosInstitucionales()
      
      // Actualizar estado de documentos consultados
      updateConsultedDocuments({
        pei: documentosInstitucionales.pei,
        modeloPedagogico: documentosInstitucionales.modeloPedagogico,
        orientacionesCurriculares: documentosInstitucionales.orientacionesCurriculares,
        tabla7: documentosInstitucionales.tabla7,
        relevantDocs: relevantDocs
      })
      
      // Usar TODOS los documentos disponibles del bucket
      let relevantFiles = [...documentosInstitucionales.todosLosDocumentos]
      
      // Agregar TODOS los documentos del contexto
      relevantDocs.forEach(doc => {
        if (!relevantFiles.some(existing => existing.id === doc.id)) {
          relevantFiles.push(doc)
        }
      })
      
      // Construir contexto con historial del chat
      const sesionesNum = Math.min(2, Math.max(1, Number(planningConfig.sesiones || '1') || 1))
      const horasNum = sesionesNum * 2
      
      const chatContext = chatHistory.length > 0 ? `
## 📝 HISTORIAL DE LA CONVERSACIÓN:
${chatHistory.map((msg, index) => {
  const sender = msg.isUser ? '👤 Docente' : '🤖 Asistente IA'
  const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString('es-ES') : 'Sin fecha'
  return `${sender} (${timestamp}):\n${msg.text}\n`
}).join('\n---\n')}

## 🎯 MENSAJE ACTUAL DEL DOCENTE:
${userInput}

` : `
## 🎯 MENSAJE ACTUAL DEL DOCENTE:
${userInput}

`
      
      const combinedContext = `REGLAS ESTRICTAS PARA LA RESPUESTA (OBLIGATORIAS):
1) Usa EXACTAMENTE la duración total: ${horasNum} horas.
2) Usa EXACTAMENTE el número de sesiones: ${sesionesNum}.
3) Distribuye el tiempo en ${sesionesNum} sesiones; la suma total debe ser ${horasNum} horas.
4) Trabaja únicamente en minutos en toda la respuesta.
5) Incluye la institución "IE Camilo Torres" y mantente en la asignatura: ${planningConfig.asignatura}.

${chatContext}`
      
      // Crear mensaje inicial para streaming
      const streamingMessage = {
        text: '🔄 Generando respuesta...',
        isUser: false,
        isFormatted: true
      }
      
      const messageId = addMessage(streamingMessage)
      setStreamingMessageId(messageId)
      
      
      // Realizar llamada a la API con streaming
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          context: combinedContext,
          relevantDocs: relevantFiles,
          planningConfig: planningConfig
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No se pudo obtener el stream de respuesta')
      }
      
      const decoder = new TextDecoder()
      let accumulatedText = ''
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk
          
          // Actualizar el mensaje con el texto acumulado
          updateMessage(messageId, { text: accumulatedText })
          
        }
      } finally {
        reader.releaseLock()
      }
      
      // Agregar al historial cuando termine el streaming
      const finalMessage = {
        text: accumulatedText,
        isUser: false,
        isFormatted: true
      }
      addToChatHistory(finalMessage as any)
      
      
    } catch (error) {
      console.error('❌ Error en streaming:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      setError(error instanceof Error ? error.message : 'Error desconocido')
      
      // Actualizar el mensaje de streaming con el error
      if (streamingMessageId) {
        updateMessage(streamingMessageId, { 
          text: `❌ **Error generando respuesta:** ${error instanceof Error ? error.message : 'Error desconocido'}` 
        })
      }
    } finally {
      setLoading(false)
      setIsStreaming(false)
      setStreamingMessageId(null)
      abortControllerRef.current = null
    }
  }, [planningConfig, setLoading, setError, updateConsultedDocuments, consultarDocumentosInstitucionales, addMessage, updateMessage, addToChatHistory])

  // Función para enviar mensaje con streaming
  const sendMessage = useCallback(async (inputText: string) => {
    if (!inputText.trim()) return

    const userMessage = {
      text: inputText,
      isUser: true,
      isFormatted: false
    }

    addMessage(userMessage)
    addToChatHistory(userMessage as any)

    try {
      // Obtener historial actual del chat (sin incluir el mensaje que acabamos de agregar)
      const currentChatHistory = messages.slice(0, -1)
      
      // Generar respuesta con streaming
      await generateStreamingResponse(inputText, documents, currentChatHistory)
      
    } catch (error) {
      console.error('❌ Error en el chat:', error)
      const errorMessage = {
        text: `❌ **Error generando respuesta:** ${error instanceof Error ? error.message : 'Error desconocido'}`,
        isUser: false,
        isFormatted: true
      }
      addMessage(errorMessage)
    }
  }, [addMessage, addToChatHistory, messages, generateStreamingResponse, documents])

  // Función para cancelar streaming
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    sendMessage,
    cancelStreaming,
    isStreaming,
    streamingMessageId,
    searchRelevantDocuments,
    consultarDocumentosInstitucionales,
    generateStreamingResponse
  }
}
