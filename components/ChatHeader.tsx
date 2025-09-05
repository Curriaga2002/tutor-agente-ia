"use client"

import React from 'react'
import { useChat } from '../contexts/ChatContext'
import { usePlanningActions } from '../hooks/usePlanningActions'

export function ChatHeader() {
  const { isConfigured, isLoading, isSaving, clearMessages } = useChat()
  const { saveChatToDatabase, exportToWord } = usePlanningActions()

  return (
    <div className="bg-white border-b border-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex-1 min-w-0">
          {/* Título principal */}
          <div className="mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1 sm:mb-2 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                Planeador Inteligente
              </span>
            </h1>
            
            {/* Subtítulo */}
            <p className="text-sm sm:text-base lg:text-lg text-gray-700 font-semibold mb-2 sm:mb-3 leading-relaxed">
              Sistema de planeación de clases con inteligencia artificial
            </p>
            
            {/* Institución */}
            <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-md shadow-blue-500/20 border border-blue-500/20">
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-bold tracking-wide">
                  🏫 Institución Educativa Camilo Torres
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
          <button
            onClick={clearMessages}
            disabled={isLoading || isSaving}
            className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-gray-200/90 backdrop-blur-sm text-gray-800 rounded-xl sm:rounded-2xl hover:bg-gray-300/90 disabled:opacity-50 transition-all duration-300 font-medium shadow-md shadow-gray-300/60 hover:shadow-lg hover:shadow-gray-300/70"
            title="Limpiar conversación"
          >
            <span className="hidden sm:inline">🗑️ Limpiar</span>
            <span className="sm:hidden">🗑️</span>
          </button>
          
          <button
            onClick={() => exportToWord('agent-only')}
            disabled={isLoading || isSaving || !isConfigured}
            className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-blue-200/90 backdrop-blur-sm text-blue-800 rounded-xl sm:rounded-2xl hover:bg-blue-300/90 disabled:opacity-50 transition-all duration-300 font-medium shadow-md shadow-blue-300/60 hover:shadow-lg hover:shadow-blue-300/70"
            title="Exportar plan de clase como Word"
          >
            <span className="hidden sm:inline">📄 Exportar Word</span>
            <span className="sm:hidden">📄 Word</span>
          </button>
          
          <button
            onClick={saveChatToDatabase}
            disabled={isLoading || isSaving || !isConfigured}
            className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-green-200/90 backdrop-blur-sm text-green-800 rounded-xl sm:rounded-2xl hover:bg-green-300/90 disabled:opacity-50 transition-all duration-300 font-medium shadow-md shadow-green-300/60 hover:shadow-lg hover:shadow-green-300/70"
            title="Guardar planeación"
          >
            <span className="hidden sm:inline">💾 Guardar</span>
            <span className="sm:hidden">💾</span>
          </button>
        </div>
      </div>
    </div>
  )
}
