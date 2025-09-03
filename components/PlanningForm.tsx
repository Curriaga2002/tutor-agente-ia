"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ChatAssistant from "./ChatAssistant"
import { createClient } from "../lib/supabase/client"

interface PlanningFormProps {
  currentPlanningData: any
  setCurrentPlanningData: (data: any) => void
  chatHistory?: Array<{
    id: string
    text: string
    isUser: boolean
    timestamp: Date
    isFormatted?: boolean
  }>
}

export default function PlanningForm({ currentPlanningData, setCurrentPlanningData }: PlanningFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [formData, setFormData] = useState({
    grado: "",
    tema: "",
    duracion: "",
    sesiones: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [chatConversations, setChatConversations] = useState<Array<{
    id: string
    text: string
    isUser: boolean
    timestamp: Date
    isFormatted?: boolean
  }>>([])

  const supabase = createClient()

  useEffect(() => {
    if (currentPlanningData) {
      setFormData({
        grado: currentPlanningData.grado || "",
        tema: currentPlanningData.tema || "",
        duracion: currentPlanningData.duracion || "",
        sesiones: currentPlanningData.sesiones?.toString() || "",
      })
    }
  }, [currentPlanningData])

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const mockPlanningData = {
    estrategia: "Construcción-Fabricación",
    objetivos: [
      "Comprender los conceptos fundamentales del tema propuesto",
      "Aplicar conocimientos teóricos en situaciones prácticas",
      "Desarrollar habilidades de pensamiento crítico y análisis",
    ],
    planeacion: {
      inicio: "Actividad motivadora: presentación de situación problema relacionada con el tema",
      desarrollo: "Trabajo colaborativo en grupos pequeños para explorar y construir conocimiento",
      cierre: "Socialización de resultados y retroalimentación grupal",
    },
    recursos: ["Computadores", "Material didáctico", "Internet", "Papel y lápiz"],
    evidencias: ["Producto final del trabajo en grupo", "Participación en discusiones"],
    evaluacion: {
      criterios: [
        {
          criterio: "Comprensión conceptual",
          nivel1: "Básico - Identifica conceptos principales",
          nivel2: "Intermedio - Relaciona conceptos entre sí",
          nivel3: "Avanzado - Aplica conceptos en nuevas situaciones",
        },
        {
          criterio: "Trabajo colaborativo",
          nivel1: "Básico - Participa en actividades grupales",
          nivel2: "Intermedio - Contribuye activamente al grupo",
          nivel3: "Avanzado - Lidera y facilita el trabajo grupal",
        },
      ],
    },
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleGenerate = async () => {
    if (!formData.grado || !formData.tema || !formData.duracion || !formData.sesiones) {
      setError("Por favor complete todos los campos requeridos.")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Simulate API call with more realistic timing
      await new Promise(resolve => setTimeout(resolve, 2000))

      const planData = {
        ...mockPlanningData,
        grado: formData.grado,
        tema: formData.tema,
        duracion: formData.duracion,
        sesiones: Number.parseInt(formData.sesiones),
      }

      // Personalizar según el tema
      if (formData.tema.toLowerCase().includes("algoritmo") || formData.tema.toLowerCase().includes("programación")) {
        planData.estrategia = "Construcción-Fabricación"
        planData.objetivos = [
          "Entender la lógica básica de un algoritmo",
          "Aplicar pasos secuenciales en la resolución de problemas",
          "Crear algoritmos simples para situaciones cotidianas",
        ]
        planData.recursos = ["Computadores", "Software de programación", "Diagramas de flujo", "Ejercicios prácticos"]
        planData.evidencias = ["Diagrama de flujo simple", "Algoritmo escrito paso a paso", "Código funcional"]
      } else if (formData.tema.toLowerCase().includes("fracción") || formData.tema.toLowerCase().includes("matemática")) {
        planData.estrategia = "Descubrimiento Guiado"
        planData.objetivos = [
          "Comprender el concepto de fracción como parte de un todo",
          "Representar fracciones de diferentes maneras",
          "Resolver operaciones básicas con fracciones",
        ]
        planData.recursos = ["Material manipulativo", "Fichas de fracciones", "Problemas contextualizados", "Calculadora"]
        planData.evidencias = ["Representaciones gráficas", "Resolución de problemas", "Participación en actividades"]
      } else if (formData.tema.toLowerCase().includes("ecosistema") || formData.tema.toLowerCase().includes("biología")) {
        planData.estrategia = "Investigación-Discovery"
        planData.objetivos = [
          "Identificar los componentes de un ecosistema",
          "Analizar las interacciones entre seres vivos",
          "Valorar la importancia de la biodiversidad",
        ]
        planData.recursos = ["Imágenes y videos", "Material de laboratorio", "Casos de estudio", "Salidas de campo"]
        planData.evidencias = ["Mapa conceptual", "Reporte de observación", "Presentación de hallazgos"]
      }

      setCurrentPlanningData(planData)
      setSuccess("✅ Planeación generada exitosamente!")
    } catch (error: any) {
      console.error("Error generating plan:", error)
      setError("Error al generar la planeación: " + (error?.message || 'Error desconocido'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!currentPlanningData) {
      setError("Primero debe generar una planeación antes de guardarla.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Verificar si estamos en modo fallback
      if (supabase.from === undefined) {
        // Simular guardado en modo fallback
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSuccess("✅ Planeación guardada exitosamente (modo local)")
        return
      }

      // Preparar datos para guardar incluyendo el historial del chat
      const dataToSave = {
        grado: formData.grado,
        tema: formData.tema,
        duracion: formData.duracion,
        sesiones: parseInt(formData.sesiones),
        contenido: currentPlanningData,
        chat_history: chatConversations, // Incluir el historial completo del chat
        user_id: null
      }

      const { error } = await supabase
        .from("planeaciones")
        .insert([dataToSave])

      if (error) {
        throw new Error(error.message || 'Error desconocido al guardar la planeación')
      }

      setSuccess("✅ Planeación guardada exitosamente en la base de datos!")
      
      // Opcional: limpiar el formulario después de guardar
      // setFormData({ grado: "", tema: "", duracion: "", sesiones: "" })
      // setCurrentPlanningData(null)
    } catch (error: any) {
      console.error("Error saving plan:", error)
      setError("❌ Error al guardar la planeación: " + (error?.message || 'Error desconocido'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async (exportType: 'complete' | 'agent-only' = 'complete') => {
    if (!currentPlanningData) {
      setError("Primero debe generar una planeación antes de descargarla.")
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      // Generate Word document content based on export type
      const docContent = exportType === 'agent-only' 
        ? generateAgentOnlyContent(currentPlanningData, formData)
        : generateWordContent(currentPlanningData, formData)

      // Create and download the file
      const blob = new Blob([docContent], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      const suffix = exportType === 'agent-only' ? '_Solo_Agente' : '_Completa'
      const fileName = `Planeacion_Didactica_${formData.grado}_${formData.tema.replace(/\s+/g, "_")}${suffix}_${new Date().toISOString().split("T")[0]}_${new Date().toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' }).replace(/:/g, "-")}.docx`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      const message = exportType === 'agent-only' 
        ? "✅ Documento Word (solo agente) descargado exitosamente"
        : "✅ Documento Word completo descargado exitosamente"
      setSuccess(message)
    } catch (error: any) {
      console.error("Error exporting to Word:", error)
      setError("❌ Error al exportar a Word: " + (error?.message || 'Error desconocido'))
    } finally {
      setIsExporting(false)
    }
  }

  const generateAgentOnlyContent = (planData: any, formData: any): string => {
    // Extraer solo las respuestas del agente (no del usuario)
    const agentMessages = chatConversations.filter(msg => 
      !msg.isUser && msg.id !== "1" && msg.text.trim().length > 0
    )

    if (agentMessages.length === 0) {
      return "No hay contenido del agente disponible para exportar."
    }

    // Tomar la última respuesta del agente (que debería ser el plan completo)
    const lastAgentMessage = agentMessages[agentMessages.length - 1]
    
    // Limpiar el texto del agente
    let agentContent = lastAgentMessage.text
    
    // Remover emojis y formateo markdown básico
    agentContent = agentContent
      .replace(/\*\*/g, '') // Remover **bold**
      .replace(/\*/g, '')   // Remover *italic*
      .replace(/`/g, '')    // Remover `code`
      .replace(/#{1,6}\s/g, '') // Remover headers markdown
      .replace(/^\s*[-*+]\s/gm, '• ') // Normalizar listas
      .replace(/•\s*•/g, '•') // Corregir dobles puntos sin eliminar espacios
      .replace(/\n{3,}/g, '\n\n') // Limpiar saltos múltiples
    
    return agentContent
  }

  const generateWordContent = (planData: any, formData: any): string => {
    const currentDate = new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Filtrar conversaciones del chat (excluir el mensaje inicial del sistema)
    const relevantChatMessages = chatConversations.filter(msg => 
      msg.id !== "1" && msg.text.trim().length > 0
    )

    // Generar contenido del chat formateado
    const chatContent = relevantChatMessages.length > 0 
      ? relevantChatMessages.map(msg => {
          const time = msg.timestamp.toLocaleTimeString("es-CO", { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
          const role = msg.isUser ? "DOCENTE" : "TUTOR IA"
          const cleanText = msg.text.replace(/\*\*/g, '').replace(/\*/g, '')
          return `${role} (${time}):\n${cleanText}\n`
        }).join("\n")
      : "No hay conversaciones registradas en el chat."

    return `
PLANEACIÓN DIDÁCTICA COMPLETA
=============================

INFORMACIÓN GENERAL
------------------
📚 Grado: ${formData.grado}
🎯 Tema: ${formData.tema}
⏰ Duración por sesión: ${formData.duracion}
📅 Número de sesiones: ${formData.sesiones}
📅 Fecha de creación: ${currentDate}
🏗️ Estrategia metodológica: ${planData.estrategia || "No especificada"}

OBJETIVOS DE APRENDIZAJE
------------------------
${planData.objetivos?.map((obj: string, index: number) => `${index + 1}. ${obj}`).join("\n") || "No especificados"}

DESARROLLO DE LA CLASE
----------------------

🎭 INICIO (15-20 minutos):
${planData.planeacion?.inicio || "No especificado"}

🔄 DESARROLLO (${formData.duracion === "2 horas" ? "60-80 minutos" : "30-40 minutos"}):
${planData.planeacion?.desarrollo || "No especificado"}

🏁 CIERRE (15-20 minutos):
${planData.planeacion?.cierre || "No especificado"}

RECURSOS EDUCATIVOS NECESARIOS
------------------------------
${planData.recursos?.map((recurso: string) => `• ${recurso}`).join("\n") || "No especificados"}

EVIDENCIAS DE APRENDIZAJE
-------------------------
${planData.evidencias?.map((evidencia: string) => `• ${evidencia}`).join("\n") || "No especificadas"}

CRITERIOS DE EVALUACIÓN
-----------------------
${
  planData.evaluacion?.criterios
    ?.map(
      (criterio: any, index: number) => `
${index + 1}. ${criterio.criterio}:
   📊 Nivel Básico: ${criterio.nivel1}
   📊 Nivel Intermedio: ${criterio.nivel2}
   📊 Nivel Avanzado: ${criterio.nivel3}
`,
    )
    .join("\n") || "No especificados"
}

CONVERSACIONES CON EL TUTOR IA
------------------------------
${chatContent}

DISTRIBUCIÓN TEMPORAL DETALLADA
-------------------------------
📋 Sesión 1: ${planData.planeacion?.inicio || "Actividad de inicio"}
📋 Sesión ${formData.sesiones}: ${planData.planeacion?.cierre || "Actividad de cierre"}

${
  Number(formData.sesiones) > 2 
    ? `📋 Sesiones intermedias: ${planData.planeacion?.desarrollo || "Actividades de desarrollo"}\n`
    : ""
}

NOTAS ADICIONALES
-----------------
• Esta planeación fue generada con la asistencia del Sistema de Planeación Didáctica
• Las conversaciones con el Tutor IA proporcionan contexto adicional y sugerencias
• Se recomienda revisar y adaptar según las necesidades específicas del grupo
• Considerar el contexto socio-cultural de los estudiantes

---
📄 Documento generado por el Sistema de Planeación Didáctica
📅 Fecha: ${currentDate}
⏰ Hora: ${new Date().toLocaleTimeString("es-CO")}
👨‍🏫 Docente: [Nombre del docente]
🏫 Institución: [Nombre de la institución]
    `.trim()
  }

  const handleReset = () => {
    setFormData({ grado: "", tema: "", duracion: "", sesiones: "" })
    setCurrentPlanningData(null)
    setError(null)
    setSuccess(null)
    setChatConversations([])
  }

  const handleChatUpdate = (conversations: Array<{
    id: string
    text: string
    isUser: boolean
    timestamp: Date
    isFormatted?: boolean
  }>) => {
    setChatConversations(conversations)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Planeación Didáctica con Tutor IA</h2>
      </div>

      {/* Mensajes de estado */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Chat expandido */}
      <div className="w-full">
        <ChatAssistant 
          formData={formData} 
          setFormData={setFormData} 
          onChatUpdate={handleChatUpdate}
          currentPlanningData={currentPlanningData}
        />
      </div>
    </div>
  )
}
