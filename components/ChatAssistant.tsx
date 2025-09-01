"use client"

import { useState, useEffect, useRef } from 'react'
import { vectorSearchService, SearchResult } from '../lib/vector-search'
import { createClient } from '@supabase/supabase-js'

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

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Formato oficial estático del plan de clases (basado en estructura MEN)
const OFFICIAL_PLAN_FORMAT = {
  title: "Plan de Clases (Estructura Oficial MEN)",
  sections: [
    {
      name: "IDENTIFICACIÓN",
      content: "Datos básicos de la planeación",
      subsections: [
        { name: "Institución", content: "IE Camilo Torres" },
        { name: "Área", content: "Tecnología e Informática" },
        { name: "Grado", content: "Variable según solicitud" },
        { name: "Tema", content: "Variable según solicitud" },
        { name: "Duración", content: "Variable según solicitud" },
        { name: "Docente", content: "Profesor del área" }
      ]
    },
    {
      name: "ESTÁNDARES BÁSICOS DE COMPETENCIAS",
      content: "Competencias establecidas por el MEN",
      subsections: [
        { name: "Competencia 1", content: "Usar aplicaciones digitales para crear productos tecnológicos" },
        { name: "Competencia 2", content: "Analizar críticamente el impacto de la tecnología en la sociedad" },
        { name: "Competencia 3", content: "Diseñar soluciones tecnológicas innovadoras" },
        { name: "Competencia 4", content: "Comunicar ideas técnicas de manera efectiva" }
      ]
    },
    {
      name: "COMPETENCIAS ESPECÍFICAS",
      content: "Competencias específicas del área y tema",
      subsections: [
        { name: "Cognitiva", content: "Comprender conceptos y principios tecnológicos" },
        { name: "Procedimental", content: "Aplicar procedimientos y técnicas tecnológicas" },
        { name: "Actitudinal", content: "Desarrollar valores y actitudes hacia la tecnología" }
      ]
    },
    {
      name: "INDICADORES DE DESEMPEÑO",
      content: "Criterios para evaluar el logro de competencias",
      subsections: [
        { name: "Indicador 1", content: "Identifica y describe elementos tecnológicos del tema" },
        { name: "Indicador 2", content: "Aplica procedimientos tecnológicos de manera correcta" },
        { name: "Indicador 3", content: "Demuestra interés y responsabilidad en el trabajo tecnológico" }
      ]
    },
    {
      name: "MOMENTOS PEDAGÓGICOS",
      content: "Estructura de la clase según modelo crítico-social",
      subsections: [
        { name: "Exploración", content: "Activación de conocimientos previos y motivación inicial" },
        { name: "Problematización", content: "Formulación de preguntas generadoras y desafíos" },
        { name: "Diálogo", content: "Conversación colaborativa y construcción colectiva" },
        { name: "Praxis-Reflexión", content: "Aplicación práctica con reflexión crítica" },
        { name: "Acción-Transformación", content: "Proyecto final con impacto social" }
      ]
    },
    {
      name: "ESTRATEGIAS DIDÁCTICAS",
      content: "Métodos y técnicas de enseñanza",
      subsections: [
        { name: "Aprendizaje Basado en Proyectos", content: "Desarrollo de proyectos tecnológicos reales" },
        { name: "Trabajo Colaborativo", content: "Aprendizaje en equipo y cooperativo" },
        { name: "Reflexión Crítica", content: "Análisis y evaluación de procesos tecnológicos" },
        { name: "Aplicación Práctica", content: "Uso de herramientas y tecnologías reales" }
      ]
    },
    {
      name: "RECURSOS Y MATERIALES",
      content: "Elementos necesarios para el desarrollo de la clase",
      subsections: [
        { name: "Recursos Tecnológicos", content: "Computadores, software, dispositivos móviles" },
        { name: "Materiales de Consulta", content: "Documentos, videos, presentaciones" },
        { name: "Espacios de Trabajo", content: "Aula de tecnología, laboratorio, espacios colaborativos" }
      ]
    },
    {
      name: "EVALUACIÓN",
      content: "Criterios y métodos de evaluación",
      subsections: [
        { name: "Evaluación Formativa", content: "Observación directa del proceso de aprendizaje" },
        { name: "Productos Tecnológicos", content: "Evaluación de productos creados por los estudiantes" },
        { name: "Reflexiones Escritas", content: "Análisis de procesos y aprendizajes" },
        { name: "Autoevaluación y Coevaluación", content: "Evaluación entre pares y autoevaluación" }
      ]
    },
    {
      name: "CONTEXTUALIZACIÓN PEI",
      content: "Alineación con el Proyecto Educativo Institucional",
      subsections: [
        { name: "Pensamiento Crítico", content: "Desarrollo de análisis crítico y reflexivo" },
        { name: "Praxis Transformadora", content: "Aplicación práctica con impacto transformador" },
        { name: "Compromiso Comunitario", content: "Responsabilidad social y comunitaria" }
      ]
    }
  ]
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

**Formato oficial disponible:**
📚 ${OFFICIAL_PLAN_FORMAT.title} (${OFFICIAL_PLAN_FORMAT.sections.length} secciones estructuradas)`,
      isUser: false,
      timestamp: new Date(),
      isFormatted: true,
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatSaved, setChatSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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

  // Función para generar respuesta usando el formato oficial
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
        })
      } else {
        contextInfo += "No se encontraron documentos específicos para esta consulta.\n"
      }

      // Extraer información del query del usuario
      const gradoMatch = userQuery.match(/grado\s*(\d+°?)/i)
      const temaMatch = userQuery.match(/sobre\s+(.+?)(?:\s+en\s+|$)/i)
      
      const grado = gradoMatch ? gradoMatch[1] : "8°"
      const tema = temaMatch ? temaMatch[1] : "tecnología e informática"

      // Generar respuesta usando el formato oficial
      let response = `🎯 **PLAN DE CLASE GENERADO - ${grado.toUpperCase()}**\n\n`
      response += `**TEMA:** ${tema.charAt(0).toUpperCase() + tema.slice(1)}\n\n`
      response += `${contextInfo}\n\n`
      
      response += "**ESTRUCTURA OFICIAL DEL PLAN DE CLASES (MEN):**\n\n"
      
      OFFICIAL_PLAN_FORMAT.sections.forEach((section, index) => {
        response += `📚 **${section.name.toUpperCase()}**\n`
        
        if (section.subsections && section.subsections.length > 0) {
          section.subsections.forEach(subsection => {
            response += `  • **${subsection.name}:** ${subsection.content}\n`
          })
        } else if (section.content.trim()) {
          response += `  ${section.content}\n`
        }
        
        response += '\n'
      })
      
      response += "**CONTEXTUALIZACIÓN ESPECÍFICA PARA EL TEMA:**\n\n"
      response += `• **Grado:** ${grado}\n`
      response += `• **Área:** Tecnología e Informática\n`
      response += `• **Enfoque:** Modelo pedagógico crítico-social\n`
      response += `• **Estrategia:** Aprendizaje basado en proyectos\n\n`
      
      response += "**¿Te gustaría que profundice en alguna sección específica del plan?** 🚀"
      
      return response
    } catch (error) {
      console.error('Error generando respuesta pedagógica:', error)
      return "❌ Error generando la respuesta pedagógica. Por favor, intenta de nuevo."
    }
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
    if (isSaving) return
    
    setIsSaving(true)
    try {
      // Extraer información del chat para crear metadatos
      const userMessages = messages.filter(msg => msg.isUser)
      const assistantMessages = messages.filter(msg => !msg.isUser)
      
      // Buscar información de grado y tema en los mensajes del usuario
      let grado = ''
      let tema = ''
      
      for (const msg of userMessages) {
        const text = msg.text.toLowerCase()
        if (text.includes('grado') || text.includes('°')) {
          const gradoMatch = text.match(/(\d+)[°]/)
          if (gradoMatch) {
            grado = `${gradoMatch[1]}°`
            break
          }
        }
        if (text.includes('sobre') || text.includes('tema')) {
          const temaMatch = text.match(/(?:sobre|tema)\s+(.+)/)
          if (temaMatch) {
            tema = temaMatch[1].trim()
            break
          }
        }
      }
      
      // Si no se encontró tema, usar el primer mensaje del usuario
      if (!tema && userMessages.length > 0) {
        tema = userMessages[0].text.substring(0, 100)
      }
      
      // Preparar datos para la base de datos
      const chatData = {
        grado: grado || 'No especificado',
        tema: tema || 'Conversación pedagógica',
        duracion: 'Variable',
        sesiones: 1,
        contenido: messages.map(msg => 
          `${msg.isUser ? '👤 Usuario' : '🤖 Asistente'}: ${msg.text}`
        ).join('\n\n---\n\n'),
        chat_history: messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          isUser: msg.isUser,
          timestamp: msg.timestamp.toISOString(),
          isFormatted: msg.isFormatted
        })),
        user_id: null // Por ahora null, se puede implementar autenticación después
      }
      
      // Insertar en la base de datos
      const { data, error } = await supabase
        .from('planeaciones')
        .insert([chatData])
        .select()
      
      if (error) {
        console.error('Error insertando en base de datos:', error)
        throw new Error(`Error de base de datos: ${error.message}`)
      }
      
      setChatSaved(true)
      alert(`✅ Chat guardado exitosamente en la base de datos!\n\n📊 Información guardada:\n• Grado: ${chatData.grado}\n• Tema: ${chatData.tema}\n• Mensajes: ${messages.length}\n• ID: ${data?.[0]?.id || 'N/A'}`)
      
      // Notificar al componente padre
      if (onChatUpdate) {
        onChatUpdate(messages)
      }
      
    } catch (error) {
      console.error('Error guardando chat:', error)
      alert(`❌ Error guardando el chat: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
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

**Formato oficial disponible:**
📚 ${OFFICIAL_PLAN_FORMAT.title} (${OFFICIAL_PLAN_FORMAT.sections.length} secciones estructuradas)`,
          isUser: false,
          timestamp: new Date(),
          isFormatted: true,
        },
      ])
      setChatSaved(false)
      
      if (onChatUpdate) {
        onChatUpdate(messages)
      }
    }
  }

  return (
    <div className="bg-gray-100 rounded-lg p-6 h-full flex flex-col">
      {/* Header del chat */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🎓 <span>Asistente Pedagógico IA</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={saveChatToDatabase}
            disabled={isSaving || chatSaved || messages.length <= 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              chatSaved
                ? 'bg-green-500 text-white cursor-not-allowed'
                : isSaving
                ? 'bg-yellow-500 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={chatSaved ? 'Chat ya guardado' : 'Guardar chat en base de datos'}
          >
            {isSaving ? '💾 Guardando...' : chatSaved ? '✅ Guardado' : '💾 Guardar Chat'}
          </button>
          
          <button
            onClick={exportToWord}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            title="Exportar chat como archivo de texto"
          >
            📄 Exportar
          </button>
          
          <button
            onClick={clearChat}
            disabled={messages.length <= 1}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Limpiar todo el chat"
          >
            🗑️ Limpiar Chat
          </button>
        </div>
      </div>

      {/* Indicador de formato oficial */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800">
          <span>📚</span>
          <span className="text-sm font-medium">
            Formato oficial MEN disponible: {OFFICIAL_PLAN_FORMAT.sections.length} secciones estructuradas
          </span>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-white rounded-lg p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.isFormatted ? (
                <div 
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                       .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                       .replace(/\n/g, '<br>')
                  }} 
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.text}</p>
              )}
              <div className={`text-xs mt-2 ${
                message.isUser ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input del usuario */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe tu solicitud de planeación aquí..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? '🔄 Procesando...' : '🚀 Enviar'}
        </button>
      </form>
    </div>
  )
}
