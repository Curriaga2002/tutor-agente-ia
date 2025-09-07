import { useCallback } from 'react'
import { useChat } from '../contexts/ChatContext'
import { usePlanning } from '../contexts/PlanningContext'
import { useDocuments } from '../contexts/DocumentContext'
import { geminiService } from '../lib/gemini-service'
import { PDFContent } from '../types'

export function useChatActions() {
  const { 
    addMessage, 
    setLoading, 
    setSaving, 
    setError,
    updateConsultedDocuments,
    planningConfig,
    messages
  } = useChat()
  
  const { addToChatHistory } = usePlanning()
  const { searchDocuments, documents } = useDocuments()

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
      console.log('🔍 Consultando documentos institucionales...')
      console.log('📚 Total de documentos disponibles:', documents.length)
      
      // Buscar PEI
      const peiDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes('pei') ||
        doc.title.toLowerCase().includes('proyecto educativo') ||
        doc.content.toLowerCase().includes('proyecto educativo institucional')
      )
      console.log('🏫 Documentos PEI encontrados:', peiDocs.length)
      
      // Buscar Modelo Pedagógico
      const modeloPedagogicoDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes('modelo pedagógico') ||
        doc.title.toLowerCase().includes('enfoque pedagógico') ||
        doc.content.toLowerCase().includes('modelo pedagógico')
      )
      console.log('🧠 Documentos Modelo Pedagógico encontrados:', modeloPedagogicoDocs.length)
      
      // Buscar Orientaciones Curriculares
      const orientacionesCurricularesDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes('orientaciones') ||
        doc.title.toLowerCase().includes('curricular') ||
        doc.content.toLowerCase().includes('orientaciones curriculares')
      )
      console.log('📋 Documentos Orientaciones Curriculares encontrados:', orientacionesCurricularesDocs.length)
      
      // Buscar Tabla 7
      const tabla7Docs = documents.filter(doc => 
        doc.title.toLowerCase().includes('tabla 7') ||
        doc.content.toLowerCase().includes('tabla 7') ||
        doc.content.toLowerCase().includes('criterios de evaluación')
      )
      console.log('📊 Documentos Tabla 7 encontrados:', tabla7Docs.length)
      
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

  // Función para generar respuesta pedagógica
  const generatePedagogicalResponse = useCallback(async (userInput: string, relevantDocs: PDFContent[], chatHistory: any[]): Promise<string> => {
    try {
      setLoading(true)
      console.log('🔍 Iniciando generación de respuesta pedagógica...')
      console.log('📝 Input del usuario:', userInput)
      console.log('📚 Documentos relevantes recibidos:', relevantDocs.length)
      console.log('💬 Historial del chat:', chatHistory.length, 'mensajes')
      
      // Consultar documentos institucionales
      console.log('🔍 Buscando documentos institucionales...')
      const documentosInstitucionales = await consultarDocumentosInstitucionales()
      console.log('📚 Documentos institucionales encontrados:', {
        pei: documentosInstitucionales.pei ? '✅' : '❌',
        modeloPedagogico: documentosInstitucionales.modeloPedagogico ? '✅' : '❌',
        orientacionesCurriculares: documentosInstitucionales.orientacionesCurriculares ? '✅' : '❌',
        tabla7: documentosInstitucionales.tabla7 ? '✅' : '❌',
        totalDocumentos: documentosInstitucionales.todosLosDocumentos?.length || 0
      })
      
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
      console.log('📁 Documentos del bucket:', relevantFiles.length)
      
      // Agregar TODOS los documentos del contexto (ya incluye todos los documentos del bucket)
      relevantDocs.forEach(doc => {
        if (!relevantFiles.some(existing => existing.id === doc.id)) {
          relevantFiles.push(doc)
        }
      })
      console.log('📚 Total de documentos a procesar:', relevantFiles.length)
      
      
      // Construir contexto con historial del chat
      const sesionesNum = Math.min(2, Math.max(1, Number(planningConfig.sesiones || '1') || 1))
      const horasNum = sesionesNum * 2
      
      // Construir historial del chat para el contexto
      
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
      
      // Generar respuesta con Gemini
      console.log('🤖 Enviando solicitud a Gemini con contexto...')
      console.log('📋 Configuración:', {
        grado: planningConfig.grado,
        tema: planningConfig.tema,
        sesiones: sesionesNum,
        horas: horasNum,
        documentos: relevantFiles.length
      })
      
      const geminiResponse = await geminiService.generateClassPlan(
        planningConfig.grado,
        planningConfig.tema,
        combinedContext,
        relevantFiles,
        planningConfig.recursos,
        planningConfig.nombreDocente
      )
      
      console.log('✅ Respuesta de Gemini recibida:', geminiResponse.success ? 'Éxito' : 'Error')
      
      if (geminiResponse.success) {
        return geminiResponse.text
      } else {
        throw new Error(geminiResponse.error || 'Error generando respuesta')
      }
      
    } catch (error) {
      console.error('❌ Error generando respuesta pedagógica:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      return `❌ **Error generando respuesta:** ${error instanceof Error ? error.message : 'Error desconocido'}`
    } finally {
      setLoading(false)
    }
  }, [planningConfig, setLoading, setError, updateConsultedDocuments, consultarDocumentosInstitucionales])

  // Función para enviar mensaje
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
      // El userMessage se agrega al final del array, así que tomamos todos excepto el último
      const currentChatHistory = messages.slice(0, -1)
      
      // Debug: mostrar historial que se envía al agente
      console.log('📝 Historial del chat enviado al agente:', currentChatHistory.map(msg => ({
        sender: msg.isUser ? 'Docente' : 'Asistente',
        text: msg.text.substring(0, 100) + '...',
        timestamp: msg.timestamp
      })))
      
      // Generar respuesta con historial del chat y TODOS los documentos
      const aiResponse = await generatePedagogicalResponse(inputText, documents, currentChatHistory)
      
      const assistantMessage = {
        text: aiResponse,
        isUser: false,
        isFormatted: true
      }

      addMessage(assistantMessage)
      addToChatHistory(assistantMessage as any)
      
    } catch (error) {
      console.error('❌ Error en el chat:', error)
      const errorMessage = {
        text: `❌ **Error generando respuesta:** ${error instanceof Error ? error.message : 'Error desconocido'}`,
        isUser: false,
        isFormatted: true
      }
      addMessage(errorMessage)
    }
  }, [addMessage, addToChatHistory, messages, searchRelevantDocuments, generatePedagogicalResponse])

  return {
    sendMessage,
    searchRelevantDocuments,
    consultarDocumentosInstitucionales,
    generatePedagogicalResponse
  }
}
