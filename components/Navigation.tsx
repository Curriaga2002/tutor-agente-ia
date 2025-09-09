"use client"

import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigation } from '../contexts/NavigationContext'
import { ActiveTab } from '../types'

export function Navigation() {
  const { user, isAdmin, signOut } = useAuth()
  const { activeTab, setActiveTab } = useNavigation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white/90 backdrop-blur-2xl border-b border-slate-200/50 sticky top-0 z-50 shadow-xl shadow-slate-900/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Usuario - Izquierda */}
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            {isAdmin && (
              <span className="hidden sm:inline-block px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                👑 Admin
              </span>
            )}
            <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-[200px]">
              {user?.email}
            </span>
          </div>
          
          {/* Navegación centrada */}
          <div className="flex-1 flex justify-center items-center px-2 sm:px-4">
            <div className="flex space-x-1 sm:space-x-2 lg:space-x-3">
              <button
                onClick={() => handleTabChange(ActiveTab.GENERAR)}
                className={`py-2 sm:py-3 px-2 sm:px-3 lg:px-4 font-medium text-xs sm:text-sm transition-all duration-300 rounded-lg sm:rounded-xl backdrop-blur-sm whitespace-nowrap ${
                  activeTab === ActiveTab.GENERAR
                    ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
                }`}
              >
                <span className="hidden xl:inline">🚀 Generar Planeación</span>
                <span className="hidden lg:inline xl:hidden">🚀 Generar</span>
                <span className="lg:hidden">🚀</span>
              </button>
              
              <button
                onClick={() => handleTabChange(ActiveTab.HISTORIAL)}
                className={`py-2 sm:py-3 px-2 sm:px-3 lg:px-4 font-medium text-xs sm:text-sm transition-all duration-300 rounded-lg sm:rounded-xl backdrop-blur-sm whitespace-nowrap ${
                  activeTab === ActiveTab.HISTORIAL
                    ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
                }`}
              >
                <span className="hidden xl:inline">📚 Banco de Recursos</span>
                <span className="hidden lg:inline xl:hidden">📚 Recursos</span>
                <span className="lg:hidden">📚</span>
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => handleTabChange(ActiveTab.USUARIOS)}
                  className={`py-2 sm:py-3 px-2 sm:px-3 lg:px-4 font-medium text-xs sm:text-sm transition-all duration-300 rounded-lg sm:rounded-xl backdrop-blur-sm whitespace-nowrap ${
                    activeTab === ActiveTab.USUARIOS
                      ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
                  }`}
                >
                  <span className="hidden xl:inline">👥 Usuarios</span>
                  <span className="hidden lg:inline xl:hidden">👥 Usuarios</span>
                  <span className="lg:hidden">👥</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Botones de acción - Derecha */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={signOut}
              className="hidden md:block px-3 sm:px-4 py-2 bg-gray-100/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-gray-200/80 transition-all duration-300 text-sm font-medium shadow-md shadow-gray-200/50 hover:shadow-lg hover:shadow-gray-200/60"
              title="Cerrar sesión"
            >
              <span className="hidden lg:inline">🚪 Salir</span>
              <span className="lg:hidden">🚪</span>
            </button>
            
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-300"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 py-4 space-y-2">
            <button
              onClick={() => handleTabChange(ActiveTab.GENERAR)}
              className={`w-full text-left py-3 px-4 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                activeTab === ActiveTab.GENERAR
                  ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
              }`}
            >
              🚀 Generar Planeación
            </button>
            
            <button
              onClick={() => handleTabChange(ActiveTab.HISTORIAL)}
              className={`w-full text-left py-3 px-4 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                activeTab === ActiveTab.HISTORIAL
                  ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
              }`}
            >
              📚 Banco de Recursos
            </button>
            
            {isAdmin && (
              <button
                onClick={() => handleTabChange(ActiveTab.USUARIOS)}
                className={`w-full text-left py-3 px-4 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                  activeTab === ActiveTab.USUARIOS
                    ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
                }`}
              >
                👥 Usuarios
              </button>
            )}
            
            <button
              onClick={signOut}
              className="w-full text-left py-3 px-4 bg-gray-100/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-gray-200/80 transition-all duration-300 text-sm font-medium shadow-md shadow-gray-200/50 hover:shadow-lg hover:shadow-gray-200/60"
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}