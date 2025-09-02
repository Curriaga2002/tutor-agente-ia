"use client"

import { useState, useEffect } from "react"
import { createClient } from "../lib/supabase/client"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

interface ResourcesBankProps {
  setActiveTab: (tab: "generar" | "historial") => void
  setCurrentPlanningData: (data: any) => void
}

interface Planeacion {
  id: string
  grado: string
  tema: string
  duracion: string
  sesiones: number
  contenido: any
  chat_history?: Array<{
    id: string
    text: string
    isUser: boolean
    timestamp: Date
    isFormatted?: boolean
  }>
  created_at: string
  user_id?: string
}

export default function ResourcesBank({ setActiveTab, setCurrentPlanningData }: ResourcesBankProps) {
  const [planeaciones, setPlaneaciones] = useState<Planeacion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Planeacion | null>(null)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const supabase = createClient()

  const fetchAllPlans = async (): Promise<Planeacion[]> => {
    try {
      setError(null)
      
      // Verificar si estamos en modo fallback
      if (supabase.from === undefined) {
        console.warn("Supabase no está configurado, usando datos de ejemplo")
        return getMockData()
      }

      const { data, error } = await supabase
        .from("planeaciones")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      // Procesar los datos para deserializar chat_history si es necesario
      const processedData = (data || []).map((plan: any) => ({
        ...plan,
        chat_history: parseChatHistory(plan.chat_history)
      }))

      return processedData
    } catch (error) {
      console.error("Error fetching plans:", error)
      setError("Error al cargar las planeaciones. Verificando conexión...")
      
      // Si hay error, mostrar datos de ejemplo
      return getMockData()
    }
  }

  // Función para parsear el chat_history que puede venir como string o array
  const parseChatHistory = (chatHistory: any): Array<{
    id: string
    text: string
    isUser: boolean
    timestamp: Date
    isFormatted?: boolean
  }> => {
    if (!chatHistory) return []
    
    // Si ya es un array, retornarlo
    if (Array.isArray(chatHistory)) {
      return chatHistory.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }
    
    // Si es un string, intentar parsearlo como JSON
    if (typeof chatHistory === 'string') {
      try {
        const parsed = JSON.parse(chatHistory)
        if (Array.isArray(parsed)) {
          return parsed.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }
      } catch (e) {
        console.warn("Error parsing chat_history JSON:", e)
      }
    }
    
    // Si no se puede parsear, retornar array vacío
    return []
  }

  const getMockData = (): Planeacion[] => {
    return [
      {
        id: "1",
        grado: "Ejemplo",
        tema: "Plan de demostración",
        duracion: "Variable",
        sesiones: 1,
        contenido: {
          estrategia: "Metodología adaptativa",
          objetivos: [
            "Este es un ejemplo de plan generado",
            "Demuestra la funcionalidad del sistema",
            "Los planes reales serán generados dinámicamente"
          ],
          planeacion: {
            inicio: "Plan de ejemplo para demostración",
            desarrollo: "Contenido generado dinámicamente por IA",
            cierre: "Los planes reales serán únicos y personalizados"
          },
          recursos: ["Recursos adaptativos", "Materiales personalizados"],
          evidencias: ["Productos únicos", "Evaluación personalizada"],
          evaluacion: {
            criterios: [
              {
                criterio: "Ejemplo de criterio",
                nivel1: "Criterios adaptativos",
                nivel2: "Evaluación personalizada",
                nivel3: "Resultados específicos"
              }
            ]
          }
        },
        chat_history: [
          {
            id: "1",
            text: "🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**\n\n¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.",
            isUser: false,
            timestamp: new Date(Date.now() - 3600000),
            isFormatted: true
          },
          {
            id: "2",
            text: "Este es un plan de ejemplo para demostrar la funcionalidad del sistema.",
            isUser: true,
            timestamp: new Date(Date.now() - 3500000),
            isFormatted: false
          },
          {
            id: "3",
            text: "Los planes reales serán generados dinámicamente por la IA según tus necesidades específicas.",
            isUser: false,
            timestamp: new Date(Date.now() - 3400000),
            isFormatted: true
          }
        ],
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        grado: "9°",
        tema: "Ecosistemas y Biodiversidad",
        duracion: "1 hora",
        sesiones: 1,
        contenido: {
          estrategia: "Investigación-Discovery",
          objetivos: [
            "Identificar los componentes de un ecosistema",
            "Analizar las interacciones entre seres vivos",
            "Valorar la importancia de la biodiversidad"
          ],
          planeacion: {
            inicio: "Observación de imágenes de ecosistemas",
            desarrollo: "Análisis de casos de estudio",
            cierre: "Reflexión sobre la conservación"
          },
          recursos: ["Imágenes", "Videos", "Material de laboratorio"],
          evidencias: ["Mapa conceptual", "Reporte de observación"],
          evaluacion: {
            criterios: [
              {
                criterio: "Análisis científico",
                nivel1: "Describe fenómenos observables",
                nivel2: "Explica relaciones causales",
                nivel3: "Propone soluciones a problemas"
              }
            ]
          }
        },
        chat_history: [
          {
            id: "1",
            text: "🎓 **ASISTENTE DE PLANEACIÓN DIDÁCTICA**\n\n¡Hola! Soy tu tutor IA para ayudarte a crear planeaciones didácticas efectivas. ¿En qué grado estás trabajando y qué tema quieres desarrollar?",
            isUser: false,
            timestamp: new Date(Date.now() - 86400000 - 3600000),
            isFormatted: true
          },
          {
            id: "2",
            text: "Necesito una planeación para 9° grado sobre ecosistemas. ¿Qué estrategia me recomiendas?",
            isUser: true,
            timestamp: new Date(Date.now() - 86400000 - 3500000),
            isFormatted: false
          },
          {
            id: "3",
            text: "Para ecosistemas, la estrategia de **Investigación-Discovery** es perfecta. Permite a los estudiantes explorar y descubrir por sí mismos. ¿Te gustaría que desarrollemos la planeación completa?",
            isUser: false,
            timestamp: new Date(Date.now() - 86400000 - 3400000),
            isFormatted: true
          }
        ],
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }

  // Datos de ejemplo para el desarrollo (remover en producción)
  const mockPlans = [
    {
      id: 1,
      grado: "Ejemplo",
      tema: "Plan de ejemplo",
      duracion: "Variable",
      sesiones: "Por definir",
      contenido: "Este es un plan de ejemplo para demostrar la funcionalidad.",
      created_at: new Date().toISOString(),
      chat_history: [
        { id: "1", text: "Plan de ejemplo", isUser: true, timestamp: new Date() },
        { id: "2", text: "Este es un plan generado como ejemplo.", isUser: false, timestamp: new Date() }
      ]
    }
  ]

  const loadHistorial = async () => {
    setIsLoading(true)
    try {
      const plans = await fetchAllPlans()
      setPlaneaciones(plans)
    } catch (error: any) {
      console.error("Error loading history:", error)
      setError("Error al cargar el historial: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta planeación?")) return

    try {
      if (supabase.from === undefined) {
        // Modo fallback - eliminar de datos locales
        setPlaneaciones(prev => prev.filter(p => p.id !== planId))
        alert("Planeación eliminada exitosamente (modo local)")
        return
      }

      const { error } = await supabase
        .from("planeaciones")
        .delete()
        .eq("id", planId)

      if (error) {
        throw new Error(error.message)
      }

      await loadHistorial() // Refresh the list
      alert("Planeación eliminada exitosamente")
    } catch (error: any) {
      alert("Error al eliminar la planeación: " + error.message)
    }
  }

  // Función para visualizar el historial del chat
  const viewChatHistory = (plan: Planeacion) => {
    setSelectedPlan(plan)
    setShowChatHistory(true)
  }

  // Función para cerrar la visualización del chat
  const closeChatHistory = () => {
    setShowChatHistory(false)
    setSelectedPlan(null)
  }

  // Función para exportar el chat como Word
  const exportChatToWord = async (plan: Planeacion) => {
    try {
      // Crear párrafos del documento
      const paragraphs: Paragraph[] = []

      // Header del documento
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "📚 Planeación Didáctica",
              bold: true,
              size: 32,
              color: "2c3e50"
            })
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      )

      // Información de fecha y generador
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}`,
              size: 22,
              color: "7f8c8d"
            })
          ],
          spacing: { after: 200 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `🤖 Generado por: Asistente Pedagógico IA`,
              size: 22,
              color: "7f8c8d"
            })
          ],
          spacing: { after: 400 }
        })
      )

      // Información de la planeación
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "📋 Información de la Planeación",
              bold: true,
              size: 28,
              color: "3498db"
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 }
        })
      )

      // Datos de la planeación
      const planData = [
        { icon: "🎓", label: "Grado", value: plan.grado },
        { icon: "📖", label: "Tema", value: plan.tema },
        { icon: "⏰", label: "Duración", value: plan.duracion },
        { icon: "📝", label: "Sesiones", value: plan.sesiones.toString() },
        { icon: "📅", label: "Creado", value: new Date(plan.created_at).toLocaleDateString('es-ES') }
      ]

      planData.forEach(data => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.icon} ${data.label}: `,
                bold: true,
                size: 24,
                color: "2c3e50"
              }),
              new TextRun({
                text: data.value,
                size: 24,
                color: "2c3e50"
              })
            ],
            spacing: { after: 200 }
          })
        )
      })

      // Espacio antes de la conversación
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 600 }
        })
      )

      // Título de la conversación
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "💬 Conversación Completa",
              bold: true,
              size: 28,
              color: "27ae60"
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        })
      )

      // Agregar cada mensaje del chat
      if (plan.chat_history && plan.chat_history.length > 0) {
        plan.chat_history.forEach((message, index) => {
          const sender = message.isUser ? '👤 Docente' : '🤖 Asistente IA'
          const timestamp = new Date(message.timestamp).toLocaleString('es-ES')
          const senderColor = message.isUser ? "e74c3c" : "27ae60"
          
          // Nombre del emisor
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: sender,
                  bold: true,
                  size: 24,
                  color: senderColor
                })
              ],
              spacing: { after: 100 }
            })
          )

          // Timestamp
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `📅 ${timestamp}`,
                  size: 18,
                  color: "7f8c8d",
                  italics: true
                })
              ],
              spacing: { after: 200 }
            })
          )

          // Contenido del mensaje
          let cleanText = message.text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Limpiar negritas
            .replace(/\*(.*?)\*/g, '$1') // Limpiar cursivas
            .replace(/^### (.*$)/gim, '$1') // Títulos como texto normal
            .replace(/^## (.*$)/gim, '$1') // Títulos como texto normal
            .replace(/^# (.*$)/gim, '$1') // Títulos como texto normal
            .replace(/^\- (.*$)/gim, '• $1') // Listas con viñetas
            .replace(/^\d+\. (.*$)/gim, '• $1') // Listas numeradas como viñetas

          // Dividir el texto en párrafos
          const textParagraphs = cleanText.split('\n').filter(p => p.trim() !== '')
          
          textParagraphs.forEach(textPara => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: textPara,
                    size: 22,
                    color: "2c3e50"
                  })
                ],
                spacing: { after: 200 }
              })
            )
          })

          // Espacio entre mensajes
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 400 }
            })
          )
        })
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "💬 No hay historial de chat disponible para esta planeación.",
                size: 22,
                color: "7f8c8d"
              })
            ],
            spacing: { after: 400 }
          })
        )
      }

      // Footer
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 600 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "✨ Fin del documento",
              bold: true,
              size: 24,
              color: "2c3e50"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `🤖 Generado automáticamente por el Asistente Pedagógico IA`,
              size: 18,
              color: "7f8c8d"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📅 ${new Date().toLocaleString('es-ES')}`,
              size: 18,
              color: "7f8c8d"
            })
          ],
          alignment: AlignmentType.CENTER
        })
      )

      // Crear el documento
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      })

      // Generar y descargar el archivo
      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      })
      
      const fileName = `plan-clase-${plan.tema.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`
      saveAs(blob, fileName)

      alert('✅ Chat exportado exitosamente como Word')
    } catch (error) {
      console.error('❌ Error exportando chat:', error)
      alert('❌ Error al exportar el chat')
    }
  }

  // Función para copiar texto al portapapeles
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
    }
  }

  // Función para formatear el historial del chat para copiar
  const formatChatForCopy = (plan: Planeacion): string => {
    let formattedText = `PLANEACIÓN DIDÁCTICA: ${plan.tema}\n`
    formattedText += `Grado: ${plan.grado} | Duración: ${plan.duracion} | Sesiones: ${plan.sesiones}\n`
    formattedText += `Fecha: ${new Date(plan.created_at).toLocaleDateString("es-CO")}\n`
    formattedText += `\n${'='.repeat(50)}\n\n`

    // Agregar contenido de la planeación
    if (plan.contenido) {
      formattedText += `INFORMACIÓN GENERAL:\n`
      formattedText += `Estrategia: ${plan.contenido.estrategia || 'No especificada'}\n\n`
      
      if (plan.contenido.objetivos) {
        formattedText += `OBJETIVOS DE APRENDIZAJE:\n`
        plan.contenido.objetivos.forEach((obj: string, index: number) => {
          formattedText += `${index + 1}. ${obj}\n`
        })
        formattedText += '\n'
      }

      if (plan.contenido.planeacion) {
        formattedText += `DESARROLLO DE LA CLASE:\n`
        formattedText += `Inicio: ${plan.contenido.planeacion.inicio || 'No especificado'}\n`
        formattedText += `Desarrollo: ${plan.contenido.planeacion.desarrollo || 'No especificado'}\n`
        formattedText += `Cierre: ${plan.contenido.planeacion.cierre || 'No especificado'}\n\n`
      }

      if (plan.contenido.recursos) {
        formattedText += `RECURSOS EDUCATIVOS:\n`
        plan.contenido.recursos.forEach((recurso: string) => {
          formattedText += `• ${recurso}\n`
        })
        formattedText += '\n'
      }

      if (plan.contenido.evidencias) {
        formattedText += `EVIDENCIAS DE APRENDIZAJE:\n`
        plan.contenido.evidencias.forEach((evidencia: string) => {
          formattedText += `• ${evidencia}\n`
        })
        formattedText += '\n'
      }

      if (plan.contenido.evaluacion?.criterios) {
        formattedText += `CRITERIOS DE EVALUACIÓN:\n`
        plan.contenido.evaluacion.criterios.forEach((criterio: any, index: number) => {
          formattedText += `${index + 1}. ${criterio.criterio}:\n`
          formattedText += `   Nivel Básico: ${criterio.nivel1}\n`
          formattedText += `   Nivel Intermedio: ${criterio.nivel2}\n`
          formattedText += `   Nivel Avanzado: ${criterio.nivel3}\n\n`
        })
      }
    }

    // Agregar historial del chat
    if (plan.chat_history && plan.chat_history.length > 0) {
      formattedText += `${'='.repeat(50)}\n`
      formattedText += `HISTORIAL COMPLETO DEL CHAT\n`
      formattedText += `${'='.repeat(50)}\n\n`
      
      plan.chat_history.forEach((message) => {
        const time = new Date(message.timestamp).toLocaleTimeString("es-CO", { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        const role = message.isUser ? "DOCENTE" : "TUTOR IA"
        const cleanText = message.text.replace(/\*\*/g, '').replace(/\*/g, '')
        formattedText += `${role} (${time}):\n${cleanText}\n\n`
      })
    }

    return formattedText
  }

  // Filtrar planeaciones
  const filteredPlaneaciones = planeaciones.filter(plan => {
    const matchesSearch = plan.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.grado.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  useEffect(() => {
    loadHistorial()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Banco de Recursos - Planeaciones Guardadas</h2>
        <button
          onClick={loadHistorial}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Filtros de búsqueda */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por tema o grado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-yellow-800 text-sm">⚠️ {error}</p>
            <p className="text-yellow-700 text-xs mt-1">Mostrando datos de ejemplo. Configure Supabase para funcionalidad completa.</p>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planeaciones...</p>
        </div>
      )}

      {!isLoading && filteredPlaneaciones.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📋</div>
          <p>No hay planeaciones que coincidan con los filtros.</p>
          <p className="text-sm mt-2">
            {planeaciones.length === 0 
              ? "Genera y guarda tu primera planeación para verla aquí."
              : "Intenta ajustar los filtros de búsqueda."
            }
          </p>
        </div>
      )}

      {!isLoading && filteredPlaneaciones.length > 0 && (
        <div className="space-y-6">
          <div className="text-sm text-gray-600 mb-4">
            Mostrando {filteredPlaneaciones.length} de {planeaciones.length} planeaciones
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaneaciones.map((plan) => (
              <div 
                key={plan.id} 
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-gray-700 transition-colors">
                      {plan.tema}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        📚 {plan.grado}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ⏱️ {plan.duracion}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        📅 {plan.sesiones} sesión(es)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Creado: {new Date(plan.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => viewChatHistory(plan)}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 text-sm font-medium group-hover:bg-blue-50 group-hover:text-blue-700"
                    title="Ver historial completo del chat"
                  >
                    💬 Ver Chat
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para mostrar historial del chat */}
      {showChatHistory && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-8 border-b border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-800">
                💬 Historial Completo del Chat - {selectedPlan.tema}
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(formatChatForCopy(selectedPlan), "Chat completo")}
                  className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition duration-200 text-sm font-medium"
                >
                  📋 Copiar Todo
                </button>
                <button
                  onClick={() => exportChatToWord(selectedPlan)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition duration-200 text-sm font-medium"
                >
                  📄 Descargar Word
                </button>
                <button
                  onClick={closeChatHistory}
                  className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition duration-200 text-sm font-medium"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
              {/* Información de la planeación */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                <h4 className="font-semibold text-blue-800 mb-4 text-lg">📚 Información de la Planeación</h4>
                <div className="grid grid-cols-2 gap-6 text-base">
                  <div>
                    <span className="font-medium text-blue-900">Grado:</span> 
                    <span className="ml-2 text-blue-700">{selectedPlan.grado}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Duración:</span> 
                    <span className="ml-2 text-blue-700">{selectedPlan.duracion}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Sesiones:</span> 
                    <span className="ml-2 text-blue-700">{selectedPlan.sesiones}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Fecha:</span> 
                    <span className="ml-2 text-blue-700">{new Date(selectedPlan.created_at).toLocaleDateString("es-CO")}</span>
                  </div>
                </div>
              </div>

              {/* Historial del chat */}
              <div className="space-y-6">
                <h4 className="font-semibold text-gray-800 mb-6 text-xl">💬 Conversación Completa</h4>
                
                {selectedPlan.chat_history && selectedPlan.chat_history.length > 0 ? (
                  selectedPlan.chat_history.map((message) => (
                    <div key={message.id} className={`${message.isUser ? "text-right" : "text-left"}`}>
                      <div
                        className={`inline-block max-w-[90%] p-6 rounded-2xl ${
                          message.isUser 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-100 text-gray-800 border-l-4 border-blue-400"
                        }`}
                      >
                        <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
                          {message.isFormatted ? 
                            message.text.replace(/\*\*/g, '').replace(/\*/g, '') : 
                            message.text
                          }
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-sm opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString("es-CO")}
                          </span>
                          <span className="text-sm opacity-70 font-medium">
                            {message.isUser ? "DOCENTE" : "TUTOR IA"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-lg">No hay historial de chat disponible para esta planeación.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de texto copiado */}
      {copiedText && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          ✅ {copiedText} copiado al portapapeles
        </div>
      )}
    </div>
  )
}