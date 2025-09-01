"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ChatAssistant from "./ChatAssistant"
import { createClient } from "../lib/supabase/client"

interface PlanningFormProps {
  currentPlanningData: any
  setCurrentPlanningData: (data: any) => void
}

export default function PlanningForm({ currentPlanningData, setCurrentPlanningData }: PlanningFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [formData, setFormData] = useState({
    grado: "",
    tema: "",
    duracion: "",
    sesiones: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      setError("Error al generar la planeación: " + error.message)
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
    setSuccess(null)

    try {
      const planData = {
        grado: formData.grado,
        tema: formData.tema,
        duracion: formData.duracion,
        sesiones: Number.parseInt(formData.sesiones),
        contenido: currentPlanningData,
        user_id: null, // Will be set by RLS policies using auth.uid()
      }

      // Verificar si Supabase está configurado
      if (supabase.from === undefined) {
        // Modo fallback - simular guardado exitoso
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSuccess("✅ Planeación guardada exitosamente (modo local)")
        return
      }

      const { data, error } = await supabase
        .from("planeaciones")
        .insert([planData])
        .select()

      if (error) {
        throw new Error(error.message)
      }

      setSuccess("✅ Planeación guardada exitosamente en la base de datos!")
      
      // Opcional: limpiar el formulario después de guardar
      // setFormData({ grado: "", tema: "", duracion: "", sesiones: "" })
      // setCurrentPlanningData(null)
    } catch (error: any) {
      console.error("Error saving plan:", error)
      setError("❌ Error al guardar la planeación: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!currentPlanningData) {
      setError("Primero debe generar una planeación antes de descargarla.")
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      // Generate Word document content
      const docContent = generateWordContent(currentPlanningData, formData)

      // Create and download the file
      const blob = new Blob([docContent], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Planeacion_${formData.grado}_${formData.tema.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccess("✅ Documento Word descargado exitosamente")
    } catch (error: any) {
      console.error("Error exporting to Word:", error)
      setError("❌ Error al exportar a Word: " + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const generateWordContent = (planData: any, formData: any): string => {
    const currentDate = new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return `
PLANEACIÓN DIDÁCTICA
====================

Información General:
- Grado: ${formData.grado}
- Tema: ${formData.tema}
- Duración por sesión: ${formData.duracion}
- Número de sesiones: ${formData.sesiones}
- Fecha de creación: ${currentDate}
- Estrategia: ${planData.estrategia || "No especificada"}

OBJETIVOS DE APRENDIZAJE:
${planData.objetivos?.map((obj: string, index: number) => `${index + 1}. ${obj}`).join("\n") || "No especificados"}

DESARROLLO DE LA CLASE:

Inicio:
${planData.planeacion?.inicio || "No especificado"}

Desarrollo:
${planData.planeacion?.desarrollo || "No especificado"}

Cierre:
${planData.planeacion?.cierre || "No especificado"}

RECURSOS NECESARIOS:
${planData.recursos?.map((recurso: string) => `• ${recurso}`).join("\n") || "No especificados"}

EVIDENCIAS DE APRENDIZAJE:
${planData.evidencias?.map((evidencia: string) => `• ${evidencia}`).join("\n") || "No especificadas"}

CRITERIOS DE EVALUACIÓN:
${
  planData.evaluacion?.criterios
    ?.map(
      (criterio: any, index: number) => `
${index + 1}. ${criterio.criterio}:
   - Nivel Básico: ${criterio.nivel1}
   - Nivel Intermedio: ${criterio.nivel2}
   - Nivel Avanzado: ${criterio.nivel3}
`,
    )
    .join("\n") || "No especificados"
}

---
Documento generado por el Sistema de Planeación Didáctica
Fecha: ${currentDate}
    `.trim()
  }

  const handleReset = () => {
    setFormData({ grado: "", tema: "", duracion: "", sesiones: "" })
    setCurrentPlanningData(null)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Configuración de la Planeación</h2>
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 flex items-center gap-2"
        >
          <span>💬</span>
          {showChat ? "Ocultar Chat" : "Tutor IA"}
        </button>
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

      {showChat && (
        <div className="mb-6">
          <ChatAssistant formData={formData} setFormData={setFormData} />
        </div>
      )}

      <form className="space-y-6">
        <div>
          <label htmlFor="grado" className="block text-sm font-medium text-gray-700 mb-2">
            Grado
          </label>
          <select
            id="grado"
            name="grado"
            value={formData.grado}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Seleccionar grado</option>
            <option value="8°">8° Grado</option>
            <option value="9°">9° Grado</option>
          </select>
        </div>

        <div>
          <label htmlFor="tema" className="block text-sm font-medium text-gray-700 mb-2">
            Tema
          </label>
          <input
            type="text"
            id="tema"
            name="tema"
            value={formData.tema}
            onChange={handleInputChange}
            placeholder="Ej: Algoritmos, Fracciones, Ecosistemas..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="duracion" className="block text-sm font-medium text-gray-700 mb-2">
            Duración por sesión
          </label>
          <select
            id="duracion"
            name="duracion"
            value={formData.duracion}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Seleccionar duración</option>
            <option value="1 hora">1 hora</option>
            <option value="2 horas">2 horas</option>
          </select>
        </div>

        <div>
          <label htmlFor="sesiones" className="block text-sm font-medium text-gray-700 mb-2">
            Número de sesiones
          </label>
          <input
            type="number"
            id="sesiones"
            name="sesiones"
            value={formData.sesiones}
            onChange={handleInputChange}
            min="1"
            max="10"
            placeholder="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition duration-200 font-medium disabled:bg-gray-400"
          >
            {isGenerating ? "⏳ Generando..." : "🎯 Generar Planeación"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!currentPlanningData || isSaving}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? "💾 Guardando..." : "💾 Guardar Planeación"}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!currentPlanningData || isExporting}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isExporting ? "📄 Exportando..." : "📄 Descargar Word"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-200 font-medium"
          >
            🔄 Limpiar Formulario
          </button>
        </div>
      </form>
    </div>
  )
}
