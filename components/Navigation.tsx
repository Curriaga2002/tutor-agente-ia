"use client"

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface NavigationProps {
  activeTab: "generar" | "estado" | "historial" | "usuarios"
  onTabChange: (tab: "generar" | "estado" | "historial" | "usuarios") => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { user, isAdmin, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleTabChange = (tab: "generar" | "estado" | "historial" | "usuarios") => {
    onTabChange(tab)
    setIsMobileMenuOpen(false) // Cerrar menú móvil al seleccionar
  }

  return (
          <nav className="bg-white/80 backdrop-blur-2xl border-b border-white/30 sticky top-0 z-50 shadow-xl shadow-black/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo/Usuario - Siempre visible */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {isAdmin && (
              <span className="hidden sm:inline-block px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                👑 Admin
              </span>
            )}
            <span className="text-xs sm:text-sm text-gray-600 truncate">
              {user?.email}
            </span>
          </div>
          
          {/* Botón hamburguesa - Solo móvil */}
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

          {/* Navegación desktop - Oculto en móvil */}
          <div className="hidden md:flex justify-center space-x-2 lg:space-x-3">
          <button
            onClick={() => onTabChange('generar')}
              className={`py-3 lg:py-4 px-4 lg:px-6 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                activeTab === 'generar'
                  ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
              }`}
            >
              <span className="hidden lg:inline">🚀 Generar Planeación</span>
              <span className="lg:hidden">🚀 Generar</span>
            </button>
            
            <button
              onClick={() => onTabChange('historial')}
              className={`py-3 lg:py-4 px-4 lg:px-6 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                activeTab === 'historial'
                  ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
              }`}
            >
              <span className="hidden lg:inline">📚 Banco de Recursos</span>
              <span className="lg:hidden">📚 Recursos</span>
            </button>
            
            {isAdmin && (
              <button
                onClick={() => onTabChange('estado')}
                className={`py-3 lg:py-4 px-4 lg:px-6 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                  activeTab === 'estado'
                    ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
                }`}
              >
                <span className="hidden lg:inline">📊 Estado de la App</span>
                <span className="lg:hidden">📊 Estado</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onTabChange('usuarios')}
                className={`py-3 lg:py-4 px-4 lg:px-6 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                  activeTab === 'usuarios'
                    ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
                }`}
              >
                <span className="hidden lg:inline">👥 Usuarios</span>
                <span className="lg:hidden">👥 Usuarios</span>
              </button>
            )}
          </div>
          
          {/* Botón salir - Solo desktop */}
          <button
            onClick={signOut}
            className="hidden md:block px-4 py-2 bg-gray-100/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-gray-200/80 transition-all duration-300 text-sm font-medium shadow-md shadow-gray-200/50 hover:shadow-lg hover:shadow-gray-200/60"
            title="Cerrar sesión"
          >
            🚪 Salir
          </button>
        </div>

        {/* Menú móvil - Solo visible cuando está abierto */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 py-4 space-y-2">
            <button
              onClick={() => handleTabChange('generar')}
              className={`w-full text-left py-3 px-4 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
              activeTab === 'generar'
                ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
            }`}
          >
            🚀 Generar Planeación
          </button>
          
          <button
              onClick={() => handleTabChange('historial')}
              className={`w-full text-left py-3 px-4 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
              activeTab === 'historial'
                ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
            }`}
          >
            📚 Banco de Recursos
          </button>
          
          {isAdmin && (
            <button
                onClick={() => handleTabChange('estado')}
                className={`w-full text-left py-3 px-4 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                activeTab === 'estado'
                  ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
              }`}
            >
              📊 Estado de la App
            </button>
          )}
          {isAdmin && (
            <button
                onClick={() => handleTabChange('usuarios')}
                className={`w-full text-left py-3 px-4 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                activeTab === 'usuarios'
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
