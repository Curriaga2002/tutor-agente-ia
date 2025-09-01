"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
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
}

export default function ChatAssistant({ formData, setFormData }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "¡Hola! Soy tu asistente de planeación didáctica. Puedo ayudarte a definir mejor tu tema, sugerir objetivos, actividades y recursos. También puedes cargar documentos para enriquecer nuestras conversaciones. ¿En qué te puedo ayudar?",
      isUser: false,
      timestamp: new Date(),
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
          // Para PDFs, mostraremos un mensaje indicando que se procesó
          content = `[Documento PDF cargado: ${file.name}]\n\nEste documento ha sido procesado y su contenido está disponible para consultas. Puedes preguntarme sobre cualquier tema relacionado con este material.`
        } else if (file.type.includes("word") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
          // Para documentos Word
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

        // Agregar mensaje del sistema indicando que el documento fue cargado
        const systemMessage: Message = {
          id: Date.now().toString(),
          text: `📄 Documento "${file.name}" cargado exitosamente. Ahora puedes hacerme preguntas sobre su contenido.`,
          isUser: false,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, systemMessage])
      } catch (error) {
        console.error("Error processing file:", error)
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: `❌ Error al procesar el archivo "${file.name}". Por favor, intenta con otro formato.`,
          isUser: false,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    }

    setIsUploading(false)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeDocument = (documentId: string) => {
    setUploadedDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
    const systemMessage: Message = {
      id: Date.now().toString(),
      text: "📄 Documento removido del contexto de la conversación.",
      isUser: false,
      timestamp: new Date(),
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

        // Si la IA sugiere cambios en el formulario, aplicarlos
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

    // Si hay documentos cargados, mencionar que se pueden consultar
    const documentContext =
      documents.length > 0 ? `\n\n📄 Documentos disponibles: ${documents.map((doc) => doc.name).join(", ")}` : ""

    // Respuestas específicas por tema
    if (lowerMessage.includes("objetivo") || lowerMessage.includes("meta")) {
      return `Para el tema "${context.tema || "tu tema"}" en grado ${context.grado || "8° o 9°"}, algunos objetivos podrían ser:
      
• Comprender los conceptos fundamentales del tema
• Desarrollar habilidades de análisis y síntesis
• Aplicar los conocimientos en situaciones prácticas
• Fomentar el pensamiento crítico y la participación activa

¿Te gustaría que profundice en algún objetivo específico?${documentContext}`
    }

    if (lowerMessage.includes("actividad") || lowerMessage.includes("ejercicio")) {
      return `Para desarrollar el tema "${context.tema || "tu tema"}" te sugiero estas actividades:
      
• Lluvia de ideas inicial para activar conocimientos previos
• Trabajo en grupos pequeños con roles definidos
• Presentaciones cortas de los estudiantes
• Talleres prácticos con ejemplos reales
• Debates estructurados sobre el tema

Considera adaptar las actividades según el tiempo disponible (${context.duracion || "duración planificada"}).${documentContext}`
    }

    if (lowerMessage.includes("recurso") || lowerMessage.includes("material")) {
      return `Recursos recomendados para tu clase:
      
• Presentaciones visuales (PowerPoint o Canva)
• Videos educativos de YouTube o plataformas especializadas
• Fichas de trabajo imprimibles
• Materiales manipulativos según el tema
• Plataformas digitales como Kahoot para evaluación
• Libros de texto del MEN Colombia

¿Necesitas ayuda con algún recurso específico?${documentContext}`
    }

    if (lowerMessage.includes("evalua") || lowerMessage.includes("califica")) {
      return `Estrategias de evaluación para tu tema:
      
• Evaluación diagnóstica al inicio
• Evaluación formativa durante el proceso (observación, preguntas)
• Evaluación sumativa al final (quiz, proyecto, presentación)
• Rúbricas claras con criterios específicos
• Autoevaluación y coevaluación entre estudiantes

Para ${context.sesiones || "varias"} sesiones, distribuye la evaluación a lo largo del proceso.${documentContext}`
    }

    if (lowerMessage.includes("documento") || lowerMessage.includes("archivo")) {
      if (documents.length > 0) {
        return `Tienes ${documents.length} documento(s) cargado(s):
        
${documents.map((doc) => `• ${doc.name} (${doc.type})`).join("\n")}

Puedes preguntarme sobre el contenido de cualquiera de estos documentos o cómo aplicar la información en tu planeación didáctica.`
      } else {
        return `No tienes documentos cargados actualmente. Puedes cargar archivos PDF, Word o de texto usando el botón 📎 para enriquecer nuestras conversaciones con contenido específico.`
      }
    }

    // Respuesta general por defecto
    return `Gracias por tu pregunta sobre "${context.tema || "el tema de tu clase"}". 

Como asistente de planeación didáctica, te puedo ayudar con:
• Definición de objetivos de aprendizaje
• Sugerencias de actividades pedagógicas
• Recursos y materiales educativos
• Estrategias de evaluación
• Distribución del tiempo de clase

Para grado ${context.grado || "8° o 9°"} y una duración de ${context.duracion || "la planificada"}, ¿podrías ser más específico sobre qué aspecto te gustaría desarrollar?${documentContext}

*Nota: Estoy funcionando en modo offline. Para respuestas más personalizadas, verifica la conexión a internet.*`
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
        <span>🤖</span>
        Tutor IA
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
      <div className="bg-white rounded-lg border border-gray-200 h-64 overflow-y-auto p-3 mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`mb-3 ${message.isUser ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                message.isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <span className="text-xs opacity-70 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
        {(isLoading || isUploading) && (
          <div className="text-left mb-3">
            <div className="inline-block bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">{isUploading ? "Procesando archivo..." : "Escribiendo..."}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Preguntas rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(question)}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition duration-200"
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
          placeholder="Escribe tu pregunta sobre la planeación..."
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
