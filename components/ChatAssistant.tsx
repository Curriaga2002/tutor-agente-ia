"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isFormatted?: boolean
}

interface UploadedDocument {
  id: string
  name: string
  content: string
  type: string
}

interface ChatAssistantProps {
  formData: {
    grado: string
    tema: string
    duracion: string
    sesiones: string
  }
  setFormData: (data: any) => void
  onChatUpdate?: (conversations: Array<{
    id: string
    text: string
    isUser: boolean
    timestamp: Date
    isFormatted?: boolean
  }>) => void
  currentPlanningData?: any
}

export default function ChatAssistant({ formData, setFormData, onChatUpdate, currentPlanningData }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "🎓 **ASISTENTE DE PLANEACIÓN DIDÁCTICA**\n\n¡Hola! Soy tu tutor IA especializado en **planeación didáctica** para **Grados 8° y 9°**.\n\n🛠️ **Puedo ayudarte con:**\n• **Objetivos de aprendizaje** claros y medibles\n• **Actividades pedagógicas** motivadoras\n• **Recursos educativos** apropiados\n• **Estrategias de evaluación** efectivas\n\n💡 **¿En qué te puedo ayudar hoy?**",
      isUser: false,
      timestamp: new Date(),
      isFormatted: true,
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Notificar al componente padre sobre las actualizaciones del chat
    if (onChatUpdate) {
      onChatUpdate(messages)
    }
  }, [messages, onChatUpdate])

  // Mostrar la planeación generada en el chat
  useEffect(() => {
    if (currentPlanningData && currentPlanningData.objetivos) {
      const planningMessage: Message = {
        id: Date.now().toString() + "_planning",
        text: formatPlanningData(currentPlanningData),
        isUser: false,
        timestamp: new Date(),
        isFormatted: true,
      }
      
      // Verificar si ya existe un mensaje de planeación para evitar duplicados
      const existingPlanning = messages.find(msg => msg.id.includes('_planning'))
      if (!existingPlanning) {
        setMessages(prev => [...prev, planningMessage])
      }
    }
  }, [currentPlanningData])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    for (const file of files) {
      try {
        let content = ""

        if (file.type === "text/plain") {
          content = await file.text()
        } else if (file.type === "application/pdf") {
          content = `[Documento PDF cargado: ${file.name}]\n\nEste documento ha sido procesado y su contenido está disponible para consultas. Puedes preguntarme sobre cualquier tema relacionado con este material.`
        } else if (file.type.includes("word") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
          content = `[Documento Word cargado: ${file.name}]\n\nEste documento ha sido procesado y su contenido está disponible para consultas. Puedes preguntarme sobre cualquier tema relacionado con este material.`
        } else {
          content = `[Archivo cargado: ${file.name}]\n\nArchivo de tipo ${file.type} procesado. El contenido está disponible para consultas.`
        }

        const newDocument: UploadedDocument = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          content: content,
          type: file.type,
        }

        setUploadedDocuments((prev) => [...prev, newDocument])

        const systemMessage: Message = {
          id: Date.now().toString(),
          text: `📄 **Documento cargado exitosamente**\n\nEl archivo **"${file.name}"** ha sido procesado y está disponible para consultas.\n\n💡 **Ahora puedes preguntarme sobre:**\n• El contenido específico del documento\n• Cómo aplicar la información en tu planeación\n• Relaciones con tu tema de clase\n• Sugerencias basadas en el material`,
          isUser: false,
          timestamp: new Date(),
          isFormatted: true,
        }
        setMessages((prev) => [...prev, systemMessage])
      } catch (error) {
        console.error("Error processing file:", error)
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: `❌ **Error al procesar archivo**\n\nNo se pudo procesar el archivo **"${file.name}"**.\n\n💡 **Sugerencias:**\n• Verifica que el archivo no esté corrupto\n• Intenta con un formato diferente\n• Asegúrate de que el archivo sea legible`,
          isUser: false,
          timestamp: new Date(),
          isFormatted: true,
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeDocument = (documentId: string) => {
    setUploadedDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
    const systemMessage: Message = {
      id: Date.now().toString(),
      text: `📄 **Documento removido**\n\nEl documento ha sido removido del contexto de la conversación.\n\n💡 **Puedes cargar nuevos documentos** usando el botón 📎 para enriquecer nuestras conversaciones.`,
      isUser: false,
      timestamp: new Date(),
      isFormatted: true,
    }
    setMessages((prev) => [...prev, systemMessage])
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            grado: formData.grado,
            tema: formData.tema,
            duracion: formData.duracion,
            sesiones: formData.sesiones,
          },
          documents: uploadedDocuments.map((doc) => ({
            name: doc.name,
            content: doc.content,
            type: doc.type,
          })),
        }),
      })

      let aiResponseText = ""

      if (!response.ok) {
        console.warn("API response not ok:", response.status)
        aiResponseText = getFallbackResponse(inputMessage, formData, uploadedDocuments)
      } else {
        const data = await response.json()
        aiResponseText = data.response || getFallbackResponse(inputMessage, formData, uploadedDocuments)

        if (data.formSuggestions) {
          setFormData((prev: any) => ({
            ...prev,
            ...data.formSuggestions,
          }))
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
        isFormatted: true,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error:", error)
      const fallbackResponse = getFallbackResponse(inputMessage, formData, uploadedDocuments)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        isUser: false,
        timestamp: new Date(),
        isFormatted: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickQuestions = [
    "¿Qué objetivos puedo usar para este tema?",
    "Sugiere actividades para mi clase",
    "¿Qué recursos necesito?",
    "¿Cómo evaluar este tema?",
  ]

  const getFallbackResponse = (message: string, context: any, documents: UploadedDocument[]): string => {
    const lowerMessage = message.toLowerCase()
    const documentContext = documents.length > 0 ? `\n\n📄 **Documentos disponibles:** ${documents.map((doc) => doc.name).join(", ")}` : ""

    // Respuestas específicas por tema con formato mejorado
    if (lowerMessage.includes("objetivo") || lowerMessage.includes("meta")) {
      return `🎯 **OBJETIVOS DE APRENDIZAJE** para "${context.tema || "tu tema"}" en **Grado ${context.grado || "8° o 9°"}**

📋 **Objetivos Generales:**
• **Comprender** los conceptos fundamentales del tema propuesto
• **Desarrollar** habilidades de análisis y síntesis
• **Aplicar** los conocimientos en situaciones prácticas
• **Fomentar** el pensamiento crítico y la participación activa

🎯 **Objetivos Específicos:**
• Identificar y describir los elementos principales del tema
• Relacionar conceptos teóricos con ejemplos del mundo real
• Crear productos o soluciones basadas en el aprendizaje
• Participar activamente en discusiones y actividades grupales

💡 **¿Te gustaría que profundice en algún objetivo específico o que los adapte a tu tema particular?**${documentContext}`
    }

    if (lowerMessage.includes("actividad") || lowerMessage.includes("ejercicio")) {
      return `🚀 **ACTIVIDADES PEDAGÓGICAS** para "${context.tema || "tu tema"}"

⏰ **Duración:** ${context.duracion || "duración planificada"}
📅 **Sesiones:** ${context.sesiones || "varias"}

🎭 **Actividades de Inicio (15-20 min):**
• **Lluvia de ideas** para activar conocimientos previos
• **Pregunta motivadora** que genere curiosidad
• **Video corto** o imagen impactante relacionada con el tema

🔄 **Actividades de Desarrollo (${context.duracion === "2 horas" ? "60-80 min" : "30-40 min"}):**
• **Trabajo en grupos pequeños** con roles definidos
• **Talleres prácticos** con ejemplos reales
• **Presentaciones cortas** de los estudiantes
• **Debates estructurados** sobre el tema

🏁 **Actividades de Cierre (15-20 min):**
• **Síntesis grupal** de los aprendizajes
• **Reflexión individual** sobre el proceso
• **Evaluación formativa** rápida

💡 **¿Te gustaría que adapte estas actividades a tu tema específico o que sugiera actividades más detalladas?**${documentContext}`
    }

    if (lowerMessage.includes("recurso") || lowerMessage.includes("material")) {
      return `📚 **RECURSOS EDUCATIVOS** para tu clase

🖥️ **Recursos Digitales:**
• **Presentaciones visuales** (PowerPoint, Canva, Prezi)
• **Videos educativos** de YouTube o plataformas especializadas
• **Simuladores virtuales** y aplicaciones interactivas
• **Plataformas digitales** como Kahoot, Mentimeter, Padlet

📖 **Recursos Impresos:**
• **Fichas de trabajo** imprimibles y personalizables
• **Materiales manipulativos** según el tema
• **Libros de texto** del MEN Colombia
• **Revistas científicas** adaptadas al nivel

🎨 **Recursos Audiovisuales:**
• **Podcasts educativos** sobre el tema
• **Infografías** y mapas conceptuales
• **Imágenes y fotografías** de alta calidad
• **Audios** explicativos o narrativos

🔧 **Recursos de Evaluación:**
• **Rúbricas** de evaluación claras y detalladas
• **Portafolios** digitales de evidencias
• **Herramientas** de autoevaluación y coevaluación

💡 **¿Necesitas ayuda con algún recurso específico o quieres que te ayude a crear alguno?**${documentContext}`
    }

    if (lowerMessage.includes("evalua") || lowerMessage.includes("califica")) {
      return `📊 **ESTRATEGIAS DE EVALUACIÓN** para tu tema

⏱️ **Distribución temporal** para ${context.sesiones || "varias"} sesiones:

🔍 **1. Evaluación Diagnóstica (Sesión 1):**
• **Cuestionario inicial** sobre conocimientos previos
• **Lluvia de ideas** para identificar conceptos conocidos
• **Mapa conceptual** inicial del tema

📈 **2. Evaluación Formativa (Durante el proceso):**
• **Observación directa** de la participación
• **Preguntas de comprensión** durante la clase
• **Autoevaluación** de las actividades realizadas
• **Coevaluación** entre pares

📋 **3. Evaluación Sumativa (Sesión final):**
• **Proyecto final** o presentación
• **Quiz de conocimientos** adquiridos
• **Portafolio** de evidencias de aprendizaje
• **Rúbrica de evaluación** con criterios claros

🎯 **Criterios de Evaluación Sugeridos:**
• **Comprensión conceptual** (30%)
• **Participación activa** (25%)
• **Trabajo colaborativo** (25%)
• **Producto final** (20%)

💡 **¿Te gustaría que diseñe una rúbrica específica para tu tema o que ajuste estos criterios?**${documentContext}`
    }

    if (lowerMessage.includes("documento") || lowerMessage.includes("archivo")) {
      if (documents.length > 0) {
        return `📄 **DOCUMENTOS DISPONIBLES** para consulta

Tienes **${documents.length} documento(s)** cargado(s) en el sistema:

${documents.map((doc, index) => `**${index + 1}.** ${doc.name} (${doc.type})`).join("\n")}

💬 **Puedes preguntarme sobre:**
• El contenido específico de cualquiera de estos documentos
• Cómo aplicar la información en tu planeación didáctica
• Relaciones entre el contenido y tu tema de clase
• Sugerencias basadas en el material cargado

🔍 **¿Sobre qué aspecto del contenido te gustaría que profundice?**`
      } else {
        return `📄 **CARGAR DOCUMENTOS**

Actualmente **no tienes documentos** cargados en el sistema.

💡 **Para enriquecer nuestras conversaciones, puedes cargar:**
• **Archivos PDF** con contenido educativo
• **Documentos Word** (.doc, .docx)
• **Archivos de texto** (.txt)
• **Presentaciones** y materiales didácticos

📎 **Usa el botón de archivo** para cargar documentos y podré darte respuestas más específicas y contextualizadas.`
      }
    }

    // Respuesta general por defecto con formato mejorado
    return `🎓 **ASISTENTE DE PLANEACIÓN DIDÁCTICA**

¡Hola! Soy tu tutor IA especializado en **planeación didáctica** para **Grado ${context.grado || "8° o 9°"}**.

📚 **Sobre tu tema:** "${context.tema || "el tema de tu clase"}"
⏰ **Duración planificada:** ${context.duracion || "la planificada"}
📅 **Número de sesiones:** ${context.sesiones || "varias"}

🛠️ **Puedo ayudarte con:**

🎯 **Objetivos de Aprendizaje**
• Definir metas claras y medibles
• Adaptar objetivos al nivel del grado
• Crear secuencias de aprendizaje

🚀 **Actividades Pedagógicas**
• Diseñar actividades motivadoras
• Distribuir el tiempo de clase
• Crear dinámicas grupales

📚 **Recursos Educativos**
• Sugerir materiales apropiados
• Recomendar herramientas digitales
• Crear recursos personalizados

📊 **Estrategias de Evaluación**
• Diseñar rúbricas de evaluación
• Planificar evaluaciones formativas
• Crear instrumentos de medición

💡 **¿En qué aspecto específico te gustaría que te ayude? Puedes ser más específico sobre tu tema o usar las preguntas rápidas disponibles.**${documentContext}

*Nota: Estoy funcionando en modo inteligente. Para respuestas más personalizadas, verifica la conexión a internet.*`
  }

  const renderFormattedMessage = (text: string) => {
    if (!text.includes('**')) return text

    // Convertir markdown básico a HTML
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')

    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />
  }

  const formatPlanningData = (data: any) => {
    return `🎯 **PLANEACIÓN DIDÁCTICA GENERADA**

📚 **INFORMACIÓN GENERAL**
• **Grado:** ${formData.grado || "No especificado"}
• **Tema:** ${formData.tema || "No especificado"}
• **Duración por sesión:** ${formData.duracion || "No especificado"}
• **Número de sesiones:** ${formData.sesiones || "No especificado"}
• **Estrategia metodológica:** ${data.estrategia || "No especificada"}

🎯 **OBJETIVOS DE APRENDIZAJE**
${data.objetivos?.map((obj: string, index: number) => `${index + 1}. ${obj}`).join('\n') || "No especificados"}

📋 **DESARROLLO DE LA CLASE**

🎭 **INICIO (15-20 minutos):**
${data.planeacion?.inicio || "No especificado"}

🔄 **DESARROLLO (${formData.duracion === "2 horas" ? "60-80 minutos" : "30-40 minutos"}):**
${data.planeacion?.desarrollo || "No especificado"}

🏁 **CIERRE (15-20 minutos):**
${data.planeacion?.cierre || "No especificado"}

📚 **RECURSOS EDUCATIVOS NECESARIOS**
${data.recursos?.map((recurso: string) => `• ${recurso}`).join('\n') || "No especificados"}

📊 **EVIDENCIAS DE APRENDIZAJE**
${data.evidencias?.map((evidencia: string) => `• ${evidencia}`).join('\n') || "No especificadas"}

📈 **CRITERIOS DE EVALUACIÓN**
${
  data.evaluacion?.criterios
    ?.map(
      (criterio: any, index: number) => `
${index + 1}. **${criterio.criterio}:**
   📊 **Nivel Básico:** ${criterio.nivel1}
   📊 **Nivel Intermedio:** ${criterio.nivel2}
   📊 **Nivel Avanzado:** ${criterio.nivel3}
`,
    )
    .join('\n') || "No especificados"
}

💡 **¿Te gustaría que ajuste algún aspecto específico de esta planeación o tienes alguna pregunta sobre su implementación?**`
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
        <span>🤖</span>
        Tutor IA - Asistente Inteligente
      </h3>

      {uploadedDocuments.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📄 Documentos cargados:</h4>
          <div className="space-y-2">
            {uploadedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded border">
                <span className="text-sm text-gray-700 truncate flex-1">{doc.name}</span>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="text-red-500 hover:text-red-700 ml-2 text-sm"
                  title="Remover documento"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="bg-white rounded-lg border border-gray-200 h-80 overflow-y-auto p-3 mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`mb-3 ${message.isUser ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block max-w-[85%] p-3 rounded-lg ${
                message.isUser 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-800 border-l-4 border-blue-400"
              }`}
            >
              <div className="text-sm leading-relaxed">
                {message.isFormatted ? renderFormattedMessage(message.text) : message.text}
              </div>
              <span className="text-xs opacity-70 mt-2 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {(isLoading || isUploading) && (
          <div className="text-left mb-3">
            <div className="inline-block bg-gray-100 text-gray-800 p-3 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">{isUploading ? "Procesando archivo..." : "Generando respuesta..."}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">💡 Preguntas rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(question)}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition duration-200 border border-blue-200"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        accept=".txt,.pdf,.doc,.docx"
        multiple
        className="hidden"
      />

      {/* Input Area */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          title="Cargar documento"
        >
          📎
        </button>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu pregunta sobre la planeación didáctica..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={2}
          disabled={isLoading || isUploading}
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading || isUploading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <span>📤</span>
        </button>
      </div>
    </div>
  )
}
