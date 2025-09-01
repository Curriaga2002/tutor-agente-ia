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
  created_at: string
  user_id?: string
}

export default function ResourcesBank({ setActiveTab, setCurrentPlanningData }: ResourcesBankProps) {
  const [planeaciones, setPlaneaciones] = useState<Planeacion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGrado, setFilterGrado] = useState("")
  const [error, setError] = useState<string | null>(null)

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

      return data || []
    } catch (error) {
      console.error("Error fetching plans:", error)
      setError("Error al cargar las planeaciones. Verificando conexión...")
      
      // Si hay error, mostrar datos de ejemplo
      return getMockData()
    }
  }

  const getMockData = (): Planeacion[] => {
    return [
      {
        id: "1",
        grado: "8°",
        tema: "Algoritmos y Programación",
        duracion: "2 horas",
        sesiones: 3,
        contenido: {
          estrategia: "Construcción-Fabricación",
          objetivos: [
            "Comprender los conceptos fundamentales de algoritmos",
            "Aplicar pasos secuenciales en la resolución de problemas",
            "Crear algoritmos simples para situaciones cotidianas"
          ],
          planeacion: {
            inicio: "Actividad motivadora con problemas del mundo real",
            desarrollo: "Trabajo colaborativo en grupos pequeños",
            cierre: "Socialización de resultados y retroalimentación"
          },
          recursos: ["Computadores", "Material didáctico", "Internet"],
          evidencias: ["Diagrama de flujo", "Algoritmo escrito"],
          evaluacion: {
            criterios: [
              {
                criterio: "Comprensión conceptual",
                nivel1: "Identifica conceptos principales",
                nivel2: "Relaciona conceptos entre sí",
                nivel3: "Aplica conceptos en nuevas situaciones"
              }
            ]
          }
        },
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        grado: "9°",
        tema: "Ecosistemas y Biodiversidad",
        duracion: "1 hora",
        sesiones: 2,
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
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }

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

  const viewPlan = async (planId: string) => {
    try {
      if (supabase.from === undefined) {
        // Modo fallback - buscar en datos locales
        const plan = planeaciones.find(p => p.id === planId)
        if (plan) {
          setActiveTab("generar")
          setCurrentPlanningData(plan.contenido)
          return
        }
        throw new Error("Planeación no encontrada")
      }

      const { data, error } = await supabase
        .from("planeaciones")
        .select("*")
        .eq("id", planId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      if (!data) throw new Error("Planeación no encontrada")

      setActiveTab("generar")
      setCurrentPlanningData(data.contenido)
    } catch (error: any) {
      alert("Error al cargar la planeación: " + error.message)
    }
  }

  const duplicatePlan = async (planId: string) => {
    try {
      if (supabase.from === undefined) {
        // Modo fallback - buscar en datos locales
        const plan = planeaciones.find(p => p.id === planId)
        if (plan) {
          setCurrentPlanningData(plan.contenido)
          setActiveTab("generar")
          alert("Planeación duplicada. Puede modificarla y guardarla nuevamente.")
          return
        }
        throw new Error("Planeación no encontrada")
      }

      const { data, error } = await supabase
        .from("planeaciones")
        .select("*")
        .eq("id", planId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      if (!data) throw new Error("Planeación no encontrada")

      setCurrentPlanningData(data.contenido)
      setActiveTab("generar")
      alert("Planeación duplicada. Puede modificarla y guardarla nuevamente.")
    } catch (error: any) {
      alert("Error al duplicar la planeación: " + error.message)
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
                    onClick={() => viewPlan(plan.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50"
                  >
                    👁️ Ver
                  </button>
                  <button
                    onClick={() => duplicatePlan(plan.id)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1 rounded hover:bg-green-50"
                  >
                    📋 Duplicar
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
    </div>
  )
}
