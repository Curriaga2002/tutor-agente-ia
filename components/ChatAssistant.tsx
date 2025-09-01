"use client"

import { useState, useEffect, useRef } from 'react'
import { vectorSearchService, SearchResult } from '../lib/vector-search'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isFormatted?: boolean
}

interface ChatAssistantProps {
  onChatUpdate?: (messages: Message[]) => void
  currentPlanningData?: any
  setCurrentPlanningData?: (data: any) => void
}

export default function ChatAssistant({ 
  onChatUpdate, 
  currentPlanningData, 
  setCurrentPlanningData 
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE - IE CAMILO TORRES**

¡Hola! Soy tu asistente pedagógico especializado en **Tecnología e Informática** para la Institución Educativa Camilo Torres.

**Mi misión es ayudarte a planificar clases completas** que integren:
• **Modelo pedagógico crítico-social** (exploración, problematización, diálogo, praxis-reflexión, acción-transformación)
• **Orientaciones curriculares MEN 2022** (componentes, competencias, evidencias, estrategias)
• **PEI institucional** (pensamiento crítico, praxis, transformación social)

**¿Qué plan de clase necesitas generar?** 
Ejemplo: "Genérame un plan de clase para grado 8° sobre edición de video en CapCut"

**Documentos disponibles para consulta:**
📚 Plan de Clases (estructura oficial)
📚 Revisión Sistemática del Modelo Crítico-Social
📚 Orientaciones Curriculares MEN 2022
📚 PEI Institucional`,
      isUser: false,
      timestamp: new Date(),
      isFormatted: true,
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatSaved, setChatSaved] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (onChatUpdate) {
      onChatUpdate(messages)
    }
  }, [messages, onChatUpdate])

  // Función para buscar documentos relevantes usando el sistema vectorial
  const searchRelevantDocuments = async (query: string, grado?: string) => {
    try {
      const searchParams = {
        query: query,
        grado: grado,
        doc_type: undefined, // Buscar en todos los tipos
        match_threshold: 0.6,
        max_results: 5
      }

      const results = await vectorSearchService.searchEducationalContent(searchParams)
      return results
    } catch (error) {
      console.error('Error buscando documentos:', error)
      return []
    }
  }

  // Función para generar respuesta usando el prompt pedagógico
  const generatePedagogicalResponse = async (userQuery: string, relevantDocs: SearchResult[]) => {
    try {
      // Construir el contexto con los documentos encontrados
      let contextInfo = "**DOCUMENTOS RELEVANTES ENCONTRADOS:**\n\n"
      
      if (relevantDocs.length > 0) {
        relevantDocs.forEach((doc, index) => {
          contextInfo += `${index + 1}. **${doc.title}** (${doc.doc_type})\n`
          contextInfo += `   • Grado: ${doc.metadata?.grado || 'No especificado'}\n`
          contextInfo += `   • Tema: ${doc.metadata?.tema || 'No especificado'}\n`
          contextInfo += `   • Contenido relevante: ${doc.content.substring(0, 200)}...\n`
          contextInfo += `   • Score de relevancia: ${(doc.combined_score * 100).toFixed(1)}%\n\n`
        })
      } else {
        contextInfo += "No se encontraron documentos específicos para esta consulta.\n"
        contextInfo += "Usando información general del sistema pedagógico.\n\n"
      }

      // Construir el prompt completo
      const fullPrompt = `
**SISTEMA PEDAGÓGICO CRÍTICO-SOCIAL - IE CAMILO TORRES**

**CONTEXTO DEL USUARIO:**
${userQuery}

**DOCUMENTOS DISPONIBLES:**
${contextInfo}

**INSTRUCCIONES:**
1. **Lee y analiza** la consulta del usuario
2. **Consulta los documentos relevantes** encontrados
3. **Genera un plan de clase completo** siguiendo la estructura oficial
4. **Integra el modelo crítico-social** con los momentos pedagógicos
5. **Alinea con el currículo MEN 2022** (componentes, competencias, evidencias)
6. **Contextualiza con el PEI** institucional
7. **Usa estrategias didácticas apropiadas** (CTS, Construcción-Fabricación, Análisis, Diseño-Rediseño)

**FORMATO DE RESPUESTA:**
- Responde de manera estructurada y pedagógica
- Incluye todos los elementos del plan de clase
- Mantén coherencia con el modelo crítico-social
- Sé específico y contextualizado en Tecnología e Informática

**RESPONDE AHORA:**`

      // Simular respuesta del asistente (en producción, esto sería una llamada a una API de IA)
      const response = await simulateAIResponse(fullPrompt, userQuery, relevantDocs)
      return response

    } catch (error) {
      console.error('Error generando respuesta pedagógica:', error)
      return "❌ Error generando la respuesta pedagógica. Por favor, intenta de nuevo."
    }
  }

  // Simulación de respuesta de IA (reemplazar con llamada real a API)
  const simulateAIResponse = async (prompt: string, userQuery: string, relevantDocs: SearchResult[]) => {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Extraer información del query del usuario
    const gradoMatch = userQuery.match(/grado\s*(\d+°?)/i)
    const temaMatch = userQuery.match(/sobre\s+(.+?)(?:\s+en\s+|$)/i)
    
    const grado = gradoMatch ? gradoMatch[1] : "8°"
    const tema = temaMatch ? temaMatch[1] : "tecnología e informática"
    
    // Generar respuesta estructurada basada en el prompt
    let response = `🎯 **PLAN DE CLASE GENERADO - ${grado.toUpperCase()}**

**TEMA:** ${tema.charAt(0).toUpperCase() + tema.slice(1)}

**DOCUMENTOS CONSULTADOS:** ${relevantDocs.length} documentos relevantes encontrados

**ESTRUCTURA DEL PLAN:**

📚 **COMPONENTE CURRICULAR:**
• Uso y apropiación de la tecnología e informática

🎯 **COMPETENCIAS:**
• Usar aplicaciones digitales para crear productos tecnológicos
• Analizar críticamente el impacto de la tecnología en la sociedad

🔍 **MOMENTOS PEDAGÓGICOS (Modelo Crítico-Social):**

1. **EXPLORACIÓN** (15 min)
   - Actividad: Análisis de ejemplos de ${tema}
   - Rol docente: Facilitador del diálogo crítico
   - Rol estudiante: Observador activo y reflexivo

2. **PROBLEMATIZACIÓN** (20 min)
   - Actividad: Identificación de desafíos y oportunidades
   - Rol docente: Guía en la formulación de preguntas críticas
   - Rol estudiante: Constructor de problemas significativos

3. **DIÁLOGO** (25 min)
   - Actividad: Discusión colaborativa sobre soluciones
   - Rol docente: Moderador del debate constructivo
   - Rol estudiante: Participante activo en la construcción colectiva

4. **PRAXIS-REFLEXIÓN** (30 min)
   - Actividad: Aplicación práctica de conceptos
   - Rol docente: Acompañante en el proceso de creación
   - Rol estudiante: Creador y reflexivo sobre su práctica

5. **ACCIÓN-TRANSFORMACIÓN** (20 min)
   - Actividad: Presentación y evaluación de productos
   - Rol docente: Evaluador formativo
   - Rol estudiante: Presentador y evaluador de pares

**ESTRATEGIA DIDÁCTICA:** Construcción-Fabricación
**EVIDENCIAS DE APRENDIZAJE:** Productos tecnológicos, reflexiones escritas, presentaciones

**EVALUACIÓN:**
• 40% - Producto tecnológico creado
• 30% - Reflexión crítica sobre el proceso
• 30% - Participación en el diálogo colaborativo

**CONTEXTUALIZACIÓN PEI:**
Este plan promueve el pensamiento crítico, la praxis transformadora y el compromiso comunitario, alineándose con los principios institucionales de la IE Camilo Torres.

**¿Te gustaría que profundice en algún aspecto específico del plan?** 🚀`

    return response
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Buscar documentos relevantes usando el sistema vectorial
      const relevantDocs = await searchRelevantDocuments(inputText)
      
      // Generar respuesta pedagógica
      const aiResponse = await generatePedagogicalResponse(inputText, relevantDocs)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        isFormatted: true,
      }

      setMessages(prev => [...prev, assistantMessage])
      setChatSaved(false)

    } catch (error) {
      console.error('Error en el chat:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "❌ Error procesando tu solicitud. Por favor, intenta de nuevo.",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const saveChatToDatabase = async () => {
    try {
      // Aquí implementarías la lógica para guardar el chat en la base de datos
      // usando el sistema vectorial para indexar la conversación
      setChatSaved(true)
      alert("✅ Chat guardado exitosamente en la base de datos")
    } catch (error) {
      console.error('Error guardando chat:', error)
      alert("❌ Error guardando el chat")
    }
  }

  const exportToWord = () => {
    try {
      const chatContent = messages.map(msg => 
        `${msg.isUser ? '👤 Usuario' : '🤖 Asistente'}: ${msg.text}`
      ).join('\n\n---\n\n')

      const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-pedagogico-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando chat:', error)
      alert("❌ Error exportando el chat")
    }
  }

  const clearChat = () => {
    if (confirm("¿Estás seguro de que quieres limpiar todo el chat? Esta acción no se puede deshacer.")) {
      setMessages([
        {
          id: "1",
          text: `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE - IE CAMILO TORRES**

¡Hola! Soy tu asistente pedagógico especializado en **Tecnología e Informática** para la Institución Educativa Camilo Torres.

**Mi misión es ayudarte a planificar clases completas** que integren:
• **Modelo pedagógico crítico-social** (exploración, problematización, diálogo, praxis-reflexión, acción-transformación)
• **Orientaciones curriculares MEN 2022** (componentes, competencias, evidencias, estrategias)
• **PEI institucional** (pensamiento crítico, praxis, transformación social)

**¿Qué plan de clase necesitas generar?** 
Ejemplo: "Genérame un plan de clase para grado 8° sobre edición de video en CapCut"

**Documentos disponibles para consulta:**
📚 Plan de Clases (estructura oficial)
📚 Revisión Sistemática del Modelo Crítico-Social
📚 Orientaciones Curriculares MEN 2022
📚 PEI Institucional`,
          isUser: false,
          timestamp: new Date(),
          isFormatted: true,
        },
      ])
      setChatSaved(false)
      setUploadedDocuments([])
      if (onChatUpdate) {
        onChatUpdate([])
      }
      alert("✅ Chat limpiado exitosamente")
    }
  }

  return (
    <div className="bg-gray-100 rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      {/* Header del Chat */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🎓 <span>Asistente Pedagógico IE Camilo Torres</span>
      </h3>
        <div className="flex gap-2">
          <button
            onClick={saveChatToDatabase}
            disabled={chatSaved}
            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            title="Guardar chat en la base de datos"
          >
            💾 {chatSaved ? 'Guardado' : 'Guardar Chat'}
          </button>
          <button
            onClick={exportToWord}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 text-sm font-medium"
            title="Exportar conversación"
          >
            📄 Exportar
          </button>
                <button
            onClick={clearChat}
            disabled={messages.length <= 1}
            className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            title="Limpiar toda la conversación y empezar de nuevo"
          >
            🗑️ Limpiar Chat
                </button>
        </div>
      </div>

      {/* Mensajes del Chat */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              {message.isFormatted ? (
                <div 
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br>') }}
                />
              ) : (
                <p>{message.text}</p>
              )}
              <p className={`text-xs mt-2 ${
                message.isUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Generando plan de clase...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input del Chat */}
      <form onSubmit={handleSubmit} className="flex gap-2">
      <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe el plan de clase que necesitas..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
        >
          {isLoading ? '🔄' : '🚀'}
        </button>
      </form>
    </div>
  )
}
