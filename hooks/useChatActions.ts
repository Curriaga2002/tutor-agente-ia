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
    planningConfig 
  } = useChat()
  
  const { addToChatHistory } = usePlanning()
  const { searchDocuments } = useDocuments()

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
      const { documents } = useDocuments.getState?.() || { documents: [] }
      
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
  }, [])

  // Función para generar respuesta pedagógica
  const generatePedagogicalResponse = useCallback(async (userInput: string, relevantDocs: PDFContent[]): Promise<string> => {
    try {
      setLoading(true)
      
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
      
      // Usar todos los documentos disponibles
      let relevantFiles = [...documentosInstitucionales.todosLosDocumentos]
      
      // Agregar documentos específicos de la consulta
      relevantDocs.forEach(doc => {
        if (!relevantFiles.some(existing => existing.id === doc.id)) {
          relevantFiles.push(doc)
        }
      })
      
      // Construir contexto
      const sesionesNum = Math.min(2, Math.max(1, Number(planningConfig.sesiones || '1') || 1))
      const horasNum = sesionesNum * 2
      
      const combinedContext = `REGLAS ESTRICTAS PARA LA RESPUESTA (OBLIGATORIAS):
1) Usa EXACTAMENTE la duración total: ${horasNum} horas.
2) Usa EXACTAMENTE el número de sesiones: ${sesionesNum}.
3) Distribuye el tiempo en ${sesionesNum} sesiones; la suma total debe ser ${horasNum} horas.
4) Trabaja únicamente en minutos en toda la respuesta.
5) Incluye la institución "IE Camilo Torres" y mantente en la asignatura: ${planningConfig.asignatura}.`
      
      // Generar respuesta con Gemini
      const geminiResponse = await geminiService.generateClassPlan(
        planningConfig.grado,
        planningConfig.tema,
        combinedContext,
        relevantFiles,
        planningConfig.recursos,
        planningConfig.nombreDocente
      )
      
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
      // Buscar documentos relevantes
      const relevantDocs = await searchRelevantDocuments(inputText)
      
      // Generar respuesta
      const aiResponse = await generatePedagogicalResponse(inputText, relevantDocs)
      
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
  }, [addMessage, addToChatHistory, searchRelevantDocuments, generatePedagogicalResponse])

  return {
    sendMessage,
    searchRelevantDocuments,
    consultarDocumentosInstitucionales,
    generatePedagogicalResponse
  }
}
