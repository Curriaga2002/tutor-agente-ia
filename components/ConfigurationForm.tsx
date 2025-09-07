"use client"

import React from 'react'
import { useChat } from '../contexts/ChatContext'
import { PlanningConfig } from '../types'

interface ConfigurationFormProps {
  onSubmit: () => void
}

export function ConfigurationForm({ onSubmit }: ConfigurationFormProps) {
  const { planningConfig, updateConfiguration } = useChat()

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const sesionesNum = Number(planningConfig.sesiones)
    const sesionesValid = Number.isFinite(sesionesNum) && sesionesNum >= 1 && sesionesNum <= 2
    
    updateConfiguration({
      grado: planningConfig.grado,
      asignatura: planningConfig.asignatura,
      tema: planningConfig.tema,
      recursos: planningConfig.recursos,
      nombreDocente: planningConfig.nombreDocente
    })
    
    // Validación detallada
    const validationErrors = []
    if (!planningConfig.grado) validationErrors.push('grado')
    if (!planningConfig.asignatura) validationErrors.push('asignatura')
    if (!planningConfig.tema) validationErrors.push('tema')
    if (!sesionesValid) validationErrors.push('sesiones')
    if (!planningConfig.recursos) validationErrors.push('recursos')
    if (!planningConfig.nombreDocente) validationErrors.push('nombreDocente')
    
    if (validationErrors.length === 0) {
      onSubmit()
    } else {
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'asignatura') {
      updateConfiguration({ asignatura: 'Tecnología e informática' })
      return
    }
    
    if (field === 'sesiones') {
      const digitsOnly = value.replace(/[^0-9]/g, '')
      updateConfiguration({ 
        [field]: digitsOnly,
        horas: String((parseInt(digitsOnly) || 0) * 2)
      })
      return
    }
    
    updateConfiguration({ [field]: value })
  }

  // Asegurar que la asignatura esté siempre configurada
  React.useEffect(() => {
    if (!planningConfig.asignatura) {
      updateConfiguration({ asignatura: 'Tecnología e informática' })
    }
  }, [planningConfig.asignatura, updateConfiguration])

  const normalizeNumericField = (field: 'sesiones') => {
    let num = Number(planningConfig[field])
    if (!Number.isFinite(num) || num === 0) num = 1
    if (num < 1) num = 1
    if (num > 2) num = 2
    
    updateConfiguration({ 
      [field]: String(num),
      horas: String(num * 2)
    })
  }

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 mb-6 sm:mb-8 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-200/30">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10 lg:mb-12">
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Configuración Inicial
          </span>
        </h3>
        
        <div className="max-w-3xl mx-auto">
          <p className="text-lg sm:text-xl text-gray-600 font-medium leading-relaxed mb-2">
            Configura los parámetros básicos de tu planeación
          </p>
          <p className="text-sm sm:text-base text-gray-500 font-light">
            Personaliza la experiencia para obtener resultados óptimos
          </p>
        </div>
        
        {/* Línea decorativa */}
        <div className="flex items-center justify-center mt-6 sm:mt-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
          <div className="mx-4 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
        </div>
      </div>

      <form onSubmit={handleConfigSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
              Grado *
            </label>
            <select
              value={planningConfig.grado}
              onChange={(e) => handleInputChange('grado', e.target.value)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              required
            >
              <option value="">Selecciona el grado</option>
              <option value="1°">1° Primaria</option>
              <option value="2°">2° Primaria</option>
              <option value="3°">3° Primaria</option>
              <option value="4°">4° Primaria</option>
              <option value="5°">5° Primaria</option>
              <option value="6°">6° Primaria</option>
              <option value="7°">7° Secundaria</option>
              <option value="8°">8° Secundaria</option>
              <option value="9°">9° Secundaria</option>
              <option value="10°">10° Secundaria</option>
              <option value="11°">11° Secundaria</option>
            </select>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
              Asignatura *
            </label>
            <input
              type="text"
              value="Tecnología e informática"
              readOnly
              className="w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-xl sm:rounded-2xl bg-gray-100 text-gray-700 text-sm sm:text-base cursor-not-allowed"
              required
            />
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
              Tema Específico *
            </label>
            <input
              type="text"
              value={planningConfig.tema}
              onChange={(e) => handleInputChange('tema', e.target.value)}
              placeholder="Ej: El computador, Internet, Programación básica..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              required
            />
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
              Número de Sesiones *
            </label>
            <select
              value={planningConfig.sesiones}
              onChange={(e) => handleInputChange('sesiones', e.target.value)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              required
            >
              <option value="">Selecciona número de sesiones</option>
              <option value="1">1 sesión (2 horas)</option>
              <option value="2">2 sesiones (4 horas)</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              💡 Cada sesión equivale a 2 horas exactas
            </p>
          </div>
          
          <div className="sm:col-span-2 space-y-2 sm:space-y-3">
            <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
              Recursos Disponibles *
            </label>
            <input
              type="text"
              value={planningConfig.recursos}
              onChange={(e) => handleInputChange('recursos', e.target.value)}
              placeholder="Ej: Computadores, internet, sala de cómputo, software..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              required
            />
          </div>
          
          <div className="sm:col-span-2 space-y-2 sm:space-y-3">
            <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
              Nombre del Docente *
            </label>
            <input
              type="text"
              value={planningConfig.nombreDocente}
              onChange={(e) => handleInputChange('nombreDocente', e.target.value)}
              placeholder="Ej: María González, Juan Pérez..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              required
            />
          </div>
        </div>
        
        <div className="text-center pt-4 sm:pt-6 lg:pt-8">
          <button
            type="submit"
            className="inline-flex items-center px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 backdrop-blur-sm text-white rounded-md sm:rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-200/20 transition-all duration-300 font-medium text-xs sm:text-sm lg:text-base shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5"
          >
            <span className="mr-2 sm:mr-3">✅</span>
            <span className="hidden sm:inline">Aceptar y Continuar</span>
            <span className="sm:hidden">Continuar</span>
          </button>
        </div>
      </form>
    </div>
  )
}
