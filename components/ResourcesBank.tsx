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
}

export default function ResourcesBank({ setActiveTab, setCurrentPlanningData }: ResourcesBankProps) {
  const [planeaciones, setPlaneaciones] = useState<Planeacion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const fetchAllPlans = async (): Promise<Planeacion[]> => {
    try {
      const { data, error } = await supabase.from("planeaciones").select("*").order("created_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error("Error fetching plans:", error)
      return []
    }
  }

  const loadHistorial = async () => {
    setIsLoading(true)
    try {
      const plans = await fetchAllPlans()
      setPlaneaciones(plans)
    } catch (error: any) {
      console.error("Error loading history:", error)
      alert("Error al cargar el historial: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const viewPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase.from("planeaciones").select("*").eq("id", planId).single()

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
      const { data, error } = await supabase.from("planeaciones").select("*").eq("id", planId).single()

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
      const { error } = await supabase.from("planeaciones").delete().eq("id", planId)

      if (error) {
        throw new Error(error.message)
      }

      await loadHistorial() // Refresh the list
      alert("Planeación eliminada exitosamente")
    } catch (error: any) {
      alert("Error al eliminar la planeación: " + error.message)
    }
  }

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

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planeaciones...</p>
        </div>
      )}

      {!isLoading && planeaciones.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📋</div>
          <p>No hay planeaciones guardadas aún.</p>
          <p className="text-sm mt-2">Genera y guarda tu primera planeación para verla aquí.</p>
        </div>
      )}

      {!isLoading && planeaciones.length > 0 && (
        <div className="space-y-4">
          {planeaciones.map((plan) => (
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
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    👁️ Ver
                  </button>
                  <button
                    onClick={() => duplicatePlan(plan.id)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    📋 Duplicar
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
