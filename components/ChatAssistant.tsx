"use client"

import { useState, useEffect, useRef } from 'react'
import { vectorSearchService, SearchResult } from '../lib/vector-search'
import { createClient } from '@supabase/supabase-js'
import { 
  getAllEducationalContent, 
  EducationalDocument, 
  PlanStructure 
} from '../lib/educational-content-service'
import { 
  PDFContent, 
  searchInPDFs 
} from '../lib/pdf-content-processor'
import { useBucketDocuments } from '../hooks/useBucketDocuments'
import { geminiService } from '../lib/gemini-service'

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

export default function ChatAssistant({ 
  onChatUpdate, 
  currentPlanningData, 
  setCurrentPlanningData 
}: ChatAssistantProps) {
  // Hook para documentos del bucket en tiempo real
  const { documents: bucketDocuments, isLoading: documentsLoading, error: documentsError, documentCount } = useBucketDocuments()
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.

**Mi misión es ayudarte a planificar clases completas** usando **documentos oficiales reales** del sistema:
• **Orientaciones curriculares oficiales**
• **Estructuras de planes de clase**
• **Proyectos educativos institucionales**
• **Modelos pedagógicos validados**

**Estado del sistema:** 🔄 Inicializando conexión...
**¿Qué plan de clase necesitas generar?** 
Ejemplos: 
• "Plan de clase para 5° sobre ecosistemas"
• "Plan de clase para 9° sobre ecuaciones cuadráticas"
• "Plan de clase para 11° sobre literatura latinoamericana"`,
      isUser: false,
      timestamp: new Date(),
      isFormatted: true,
    }
  ])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Actualizar mensaje inicial cuando cambie el estado de los documentos
  useEffect(() => {
    if (messages.length > 0) {
      const updatedMessages = [...messages]
      const initialMessage = updatedMessages[0]
      
      if (documentsLoading) {
        initialMessage.text = `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.

**Mi misión es ayudarte a planificar clases completas** usando **documentos oficiales reales** del sistema:
• **Orientaciones curriculares oficiales**
• **Estructuras de planes de clase**
• **Proyectos educativos institucionales**
• **Modelos pedagógicos validados**

**Estado del sistema:** 🔄 Cargando documentos del sistema...
**¿Qué plan de clase necesitas generar?** 
Ejemplos: 
• "Plan de clase para 5° sobre ecosistemas"
• "Plan de clase para 9° sobre ecuaciones cuadráticas"
• "Plan de clase para 11° sobre literatura latinoamericana"`
        } else if (documentsError) {
          initialMessage.text = `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.

**Mi misión es ayudarte a planificar clases completas** usando **documentos oficiales reales** del sistema:
• **Orientaciones curriculares oficiales**
• **Estructuras de planes de clase**
• **Proyectos educativos institucionales**
• **Modelos pedagógicos validados**

**⚠️ Estado del sistema:**
❌ Error de conexión: ${documentsError}
🔄 Reintentando conexión...

**¿Qué plan de clase necesitas generar?** 
Ejemplos: 
• "Plan de clase para 5° sobre ecosistemas"
• "Plan de clase para 9° sobre ecuaciones cuadráticas"
• "Plan de clase para 11° sobre literatura latinoamericana"`
        } else if (bucketDocuments.length > 0) {
          initialMessage.text = `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.

**Mi misión es ayudarte a planificar clases completas** usando **documentos oficiales reales** del sistema:
• **Orientaciones curriculares oficiales**
• **Estructuras de planes de clase**
• **Proyectos educativos institucionales**
• **Modelos pedagógicos validados**

**✅ Estado del sistema:**
✅ Conectado al sistema de documentos
📚 ${documentCount} documentos disponibles
🔄 Monitoreo en tiempo real activo

**¿Qué plan de clase necesitas generar?** 
Ejemplos: 
• "Plan de clase para 5° sobre ecosistemas"
• "Plan de clase para 9° sobre ecuaciones cuadráticas"
• "Plan de clase para 11° sobre literatura latinoamericana"`
        }
      
      setMessages(updatedMessages)
    }
  }, [documentsLoading, documentsError, bucketDocuments, documentCount])

  // Función para buscar documentos relevantes
  const searchRelevantDocuments = async (query: string): Promise<PDFContent[]> => {
    try {
      if (bucketDocuments.length === 0) {
        console.log('⚠️ No hay documentos disponibles para buscar')
        return []
      }
      
      console.log(`🔍 Buscando en ${bucketDocuments.length} documentos del bucket...`)
      // Buscar documentos que contengan la consulta
      const relevantDocs = bucketDocuments.filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.doc_type.toLowerCase().includes(query.toLowerCase())
      )
      console.log(`✅ Encontrados ${relevantDocs.length} documentos relevantes`)
      return relevantDocs
      
    } catch (error) {
      console.error('❌ Error buscando documentos:', error)
      return []
    }
  }

  // Función para generar respuesta pedagógica usando Gemini
  const generatePedagogicalResponse = async (userInput: string, relevantDocs: PDFContent[]): Promise<string> => {
    try {
      console.log('🤖 Gemini generando respuesta pedagógica...')
      console.log('📝 Entrada del usuario:', userInput)
      console.log('📚 Documentos relevantes:', relevantDocs)
      
      // Analizar entrada del usuario
      const analysis = analyzeUserInput(userInput)
      console.log('📊 Análisis de entrada:', analysis)
      
      // Buscar documentos relevantes si no se proporcionaron
      let relevantFiles = relevantDocs
      if (relevantFiles.length === 0) {
        console.log('🔍 Buscando documentos relevantes...')
        relevantFiles = await searchRelevantDocuments(userInput)
        console.log('📚 Documentos encontrados:', relevantFiles)
      }
      
      console.log('🚀 Llamando a Gemini para generar plan de clase...')
      console.log('📋 Parámetros para Gemini:', {
        grado: analysis.grado,
        tema: analysis.tema,
        context: analysis.context,
        relevantDocsCount: relevantFiles.length
      })
      
      // Usar Gemini para generar el plan de clase
      const geminiResponse = await geminiService.generateClassPlan(
        analysis.grado,
        analysis.tema,
        analysis.context,
        relevantFiles
      )
      
      console.log('📨 Respuesta de Gemini recibida:', geminiResponse)
      
      if (geminiResponse.success) {
        console.log('✅ Gemini generó respuesta exitosamente')
        console.log('📝 Longitud de la respuesta:', geminiResponse.text.length)
        return geminiResponse.text
      } else {
        console.error('❌ Error de Gemini:', geminiResponse.error)
        console.error('🔍 Detalles del error:', geminiResponse)
        
        // Respuesta de error dinámica sin formato preestablecido
        return `❌ **Error en la generación del plan de clase**

**Detalles técnicos:**
• Grado solicitado: ${analysis.grado}
• Tema solicitado: ${analysis.tema}
• Documentos disponibles: ${relevantFiles.length}
• Error de IA: ${geminiResponse.error}

**Solución:** Por favor, verifica la consola del navegador para más detalles y contacta al administrador si el problema persiste.`
      }
      
    } catch (error) {
      console.error('❌ Error generando respuesta:', error)
      console.error('🔍 Stack trace completo:', error)
      
      // Respuesta de error completamente dinámica
      const errorType = error instanceof Error ? error.constructor.name : typeof error
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : 'No disponible'
      
      return `❌ **Error inesperado en la generación del plan de clase**

**Información del error:**
• Tipo: ${errorType}
• Mensaje: ${errorMessage}
• Stack: ${errorStack}

**Acción requerida:** Por favor, verifica la consola del navegador para más detalles y contacta al administrador.`
    }
  }

  // Esta función ya no se usa - Gemini genera todo el contenido dinámicamente

  // Función para analizar la entrada del usuario
  const analyzeUserInput = (input: string) => {
    const lowerInput = input.toLowerCase()
    
    // Extraer grado dinámicamente
    let grado = "No especificado"
    if (lowerInput.includes('1°') || lowerInput.includes('primero')) grado = "1°"
    else if (lowerInput.includes('2°') || lowerInput.includes('segundo')) grado = "2°"
    else if (lowerInput.includes('3°') || lowerInput.includes('tercero')) grado = "3°"
    else if (lowerInput.includes('4°') || lowerInput.includes('cuarto')) grado = "4°"
    else if (lowerInput.includes('5°') || lowerInput.includes('quinto')) grado = "5°"
    else if (lowerInput.includes('6°') || lowerInput.includes('sexto')) grado = "6°"
    else if (lowerInput.includes('7°') || lowerInput.includes('séptimo')) grado = "7°"
    else if (lowerInput.includes('8°') || lowerInput.includes('octavo')) grado = "8°"
    else if (lowerInput.includes('9°') || lowerInput.includes('noveno')) grado = "9°"
    else if (lowerInput.includes('10°') || lowerInput.includes('décimo')) grado = "10°"
    else if (lowerInput.includes('11°') || lowerInput.includes('undécimo')) grado = "11°"
    
    // Extraer tema dinámicamente del contexto
    let tema = "Tema general"
    
    // Buscar patrones de temas en el input
    if (lowerInput.includes('robótica') || lowerInput.includes('arduino')) tema = "Robótica y Arduino"
    else if (lowerInput.includes('programación') || lowerInput.includes('coding') || lowerInput.includes('python') || lowerInput.includes('java') || lowerInput.includes('javascript')) tema = "Programación"
    else if (lowerInput.includes('video') || lowerInput.includes('capcut') || lowerInput.includes('edición')) tema = "Edición de video"
    else if (lowerInput.includes('diseño') || lowerInput.includes('3d') || lowerInput.includes('modelado')) tema = "Diseño y modelado"
    else if (lowerInput.includes('web') || lowerInput.includes('html') || lowerInput.includes('css')) tema = "Desarrollo web"
    else if (lowerInput.includes('matemáticas') || lowerInput.includes('álgebra') || lowerInput.includes('geometría')) tema = "Matemáticas"
    else if (lowerInput.includes('ciencias') || lowerInput.includes('física') || lowerInput.includes('química') || lowerInput.includes('biología')) tema = "Ciencias naturales"
    else if (lowerInput.includes('español') || lowerInput.includes('literatura') || lowerInput.includes('lectura')) tema = "Lengua castellana"
    else if (lowerInput.includes('inglés') || lowerInput.includes('english')) tema = "Inglés"
    else if (lowerInput.includes('historia') || lowerInput.includes('geografía') || lowerInput.includes('sociales')) tema = "Ciencias sociales"
    else if (lowerInput.includes('educación física') || lowerInput.includes('deportes')) tema = "Educación física"
    else if (lowerInput.includes('artes') || lowerInput.includes('música') || lowerInput.includes('dibujo')) tema = "Educación artística"
    else {
      // Intentar extraer el tema del contexto general
      const words = lowerInput.split(' ')
      const topicKeywords = words.filter(word => 
        word.length > 4 && 
        !['plan', 'clase', 'sobre', 'para', 'grado', 'generar', 'crear', 'hacer'].includes(word)
      )
      if (topicKeywords.length > 0) {
        tema = topicKeywords[0].charAt(0).toUpperCase() + topicKeywords[0].slice(1)
      }
    }
    
    // Determinar contexto dinámicamente
    const context = `Educación para ${grado !== "No especificado" ? grado : "nivel educativo"}`
    
    // Determinar complejidad dinámicamente
    let complexity = "Intermedio"
    if (grado.includes('1') || grado.includes('2') || grado.includes('3')) complexity = "Básico"
    else if (grado.includes('10') || grado.includes('11')) complexity = "Avanzado"
    
    // Enfoque pedagógico dinámico
    const pedagogicalFocus = "Modelo pedagógico adaptativo"
    
    return { grado, tema, context, complexity, pedagogicalFocus }
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
      
      // Notificar actualización del chat
      if (onChatUpdate) {
        onChatUpdate([...messages, userMessage, assistantMessage])
      }
      
    } catch (error) {
      console.error('❌ Error en el chat:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `❌ **Error generando respuesta:** ${error instanceof Error ? error.message : 'Error desconocido'}\n\nPor favor, intenta nuevamente.`,
        isUser: false,
        timestamp: new Date(),
        isFormatted: true,
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Función para guardar el chat en la base de datos
  const saveChatToDatabase = async () => {
    if (messages.length <= 1) {
      alert('No hay planeación para guardar')
      return
    }

    setIsSaving(true)
    try {
      // Extraer grado y tema del primer mensaje del usuario
      let grado = "No especificado"
      let tema = "Tema general"
      let duracion = "Variable"
      let sesiones = "Por definir"
      
      const firstUserMessage = messages.find(m => m.isUser)
      if (firstUserMessage) {
        const analysis = analyzeUserInput(firstUserMessage.text)
        grado = analysis.grado
        tema = analysis.tema
        
        // Calcular duración estimada basada en la complejidad
        if (analysis.complexity === "Básico") {
          duracion = "45 minutos"
          sesiones = "1 sesión"
        } else if (analysis.complexity === "Intermedio") {
          duracion = "90 minutos"
          sesiones = "2 sesiones"
        } else {
          duracion = "135 minutos"
          sesiones = "3 sesiones"
        }
      }

      // Preparar datos para guardar
      const chatData = {
        grado,
        tema,
        duracion,
        sesiones,
        contenido: messages.map(m => `${m.isUser ? 'Usuario' : 'Asistente'}: ${m.text}`).join('\n\n'),
        chat_history: messages,
        user_id: null // Se asignará automáticamente por RLS
      }

      console.log('💾 Guardando chat en base de datos:', chatData)

      // Guardar en la base de datos
      const { data, error } = await supabase
        .from('planeaciones')
        .insert([chatData])
        .select()

      if (error) {
        console.error('❌ Error guardando chat:', error)
        alert(`❌ Error al guardar: ${error.message}`)
      } else {
        console.log('✅ Chat guardado exitosamente:', data)
        alert('✅ Planeación guardada exitosamente en la base de datos')
        
        // Actualizar datos de planeación actual
        if (setCurrentPlanningData && data && data[0]) {
          setCurrentPlanningData(data[0])
        }
      }
    } catch (error) {
      console.error('❌ Error general guardando chat:', error)
      alert(`❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Función para exportar el chat como Word
  const exportToWord = () => {
    if (messages.length <= 1) {
      alert('No hay planeación para exportar')
      return
    }

    try {
      // Crear contenido HTML formateado
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Planeación Didáctica - Conversación Completa</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .user { background-color: #f0f0f0; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; }
            .assistant { background-color: #e8f5e8; padding: 10px; margin: 10px 0; border-left: 4px solid #28a745; }
            .timestamp { color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Planeación Didáctica - Conversación Completa</h1>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          <p><strong>Generado por:</strong> Asistente Pedagógico IA</p>
          <hr>
      `

      messages.forEach((message, index) => {
        if (index === 0) return // Saltar mensaje inicial
        
        const messageClass = message.isUser ? 'user' : 'assistant'
        const sender = message.isUser ? 'Usuario' : 'Asistente IA'
        
        htmlContent += `
          <div class="${messageClass}">
            <strong>${sender}:</strong><br>
            ${message.text.replace(/\n/g, '<br>')}
            <div class="timestamp">${message.timestamp.toLocaleString('es-ES')}</div>
          </div>
        `
      })

      htmlContent += `
        </body>
        </html>
      `

      // Crear y descargar archivo
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plan-clase-chat-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('✅ Planeación exportada exitosamente como HTML')
    } catch (error) {
      console.error('❌ Error exportando chat:', error)
      alert('❌ Error al exportar el chat')
    }
  }

  // Función para limpiar el chat
  const clearChat = () => {
    if (messages.length <= 1) {
      alert('La conversación ya está limpia')
      return
    }

    if (confirm('¿Estás seguro de que quieres limpiar toda la conversación? Esta acción no se puede deshacer.')) {
      setMessages([messages[0]]) // Mantener solo el mensaje inicial
      geminiService.resetChat() // Reiniciar chat de Gemini
      alert('✅ Conversación limpiada exitosamente')
    }
  }

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg">
      {/* Header del Chat */}
      <div className="bg-white border-b border-gray-200 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">💬 Asistente Pedagógico IA</h2>
            <p className="text-sm text-gray-600">
              {documentsLoading ? '🔄 Conectando al bucket...' : 
               documentsError ? '❌ Error de conexión' : 
               `✅ ${documentCount} documentos disponibles`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={clearChat}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              title="Limpiar chat"
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={exportToWord}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              title="Exportar chat"
            >
              📄 Exportar
            </button>
            <button
              onClick={saveChatToDatabase}
              disabled={isSaving || messages.length <= 1}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Guardar chat en base de datos"
            >
              {isSaving ? '💾 Guardando...' : '💾 Guardar Chat'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes del Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              {message.isFormatted ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: message.text.replace(/\n/g, '<br>') 
                  }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.text}</p>
              )}
              <div className={`text-xs mt-2 ${
                message.isUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input del Chat */}
      <div className="bg-white border-t border-gray-200 p-4 rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu consulta aquí..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '🔄 Generando...' : '🚀 Generar'}
          </button>
        </form>
      </div>
    </div>
  )
}
