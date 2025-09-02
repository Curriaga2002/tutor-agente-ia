"use client"

import { useState, useEffect } from "react"
import { createClient } from "../lib/supabase/client"

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
  const [filterGrado, setFilterGrado] = useState("")
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
    const matchesGrado = !filterGrado || plan.grado === filterGrado
    return matchesSearch && matchesGrado
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
          <div className="w-32">
            <select
              value={filterGrado}
              onChange={(e) => setFilterGrado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los grados</option>
              <option value="8°">8° Grado</option>
              <option value="9°">9° Grado</option>
            </select>
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
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-2">
            Mostrando {filteredPlaneaciones.length} de {planeaciones.length} planeaciones
          </div>
          
          {filteredPlaneaciones.map((plan) => (
            <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{plan.tema}</h3>
                  <p className="text-sm text-gray-600">
                    Grado {plan.grado} • {plan.duracion} • {plan.sesiones} sesión(es)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Creado: {new Date(plan.created_at).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewChatHistory(plan)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1 rounded hover:bg-purple-50"
                    title="Ver historial completo del chat"
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p className="text-gray-700">
                  <strong>Objetivos:</strong>
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  {plan.contenido.objetivos
                    ?.slice(0, 2)
                    .map((obj: string, index: number) => <li key={index}>{obj}</li>) || <li>No disponible</li>}
                </ul>
                {plan.contenido.objetivos?.length > 2 && (
                  <p className="text-xs text-gray-500 mt-1">
                    +{plan.contenido.objetivos.length - 2} objetivo(s) más...
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para mostrar historial del chat */}
      {showChatHistory && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                💬 Historial Completo del Chat - {selectedPlan.tema}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(formatChatForCopy(selectedPlan), "Chat completo")}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 text-sm"
                >
                  📋 Copiar Todo
                </button>
                <button
                  onClick={closeChatHistory}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200 text-sm"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Información de la planeación */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">📚 Información de la Planeación</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Grado:</span> {selectedPlan.grado}
                  </div>
                  <div>
                    <span className="font-medium">Duración:</span> {selectedPlan.duracion}
                  </div>
                  <div>
                    <span className="font-medium">Sesiones:</span> {selectedPlan.sesiones}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {new Date(selectedPlan.created_at).toLocaleDateString("es-CO")}
                  </div>
                </div>
              </div>

              {/* Historial del chat */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 mb-4">💬 Conversación Completa</h4>
                
                {selectedPlan.chat_history && selectedPlan.chat_history.length > 0 ? (
                  selectedPlan.chat_history.map((message) => (
                    <div key={message.id} className={`${message.isUser ? "text-right" : "text-left"}`}>
                      <div
                        className={`inline-block max-w-[85%] p-3 rounded-lg ${
                          message.isUser 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-100 text-gray-800 border-l-4 border-blue-400"
                        }`}
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.isFormatted ? 
                            message.text.replace(/\*\*/g, '').replace(/\*/g, '') : 
                            message.text
                          }
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString("es-CO")}
                          </span>
                          <span className="text-xs opacity-70">
                            {message.isUser ? "DOCENTE" : "TUTOR IA"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">💬</div>
                    <p>No hay historial de chat disponible para esta planeación.</p>
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