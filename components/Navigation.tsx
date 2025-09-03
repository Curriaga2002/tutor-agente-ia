"use client"

import { useAuth } from '../hooks/useAuth'

interface NavigationProps {
  activeTab: "generar" | "estado" | "historial" | "usuarios"
  onTabChange: (tab: "generar" | "estado" | "historial" | "usuarios") => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { user, isAdmin, signOut } = useAuth()

  return (
          <nav className="bg-white/80 backdrop-blur-2xl border-b border-white/30 sticky top-0 z-50 shadow-xl shadow-black/10">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                👑 Admin
              </span>
            )}
            <span className="text-sm text-gray-600">
              {user?.email}
            </span>
          </div>
          
          <div className="flex justify-center space-x-3">
          <button
            onClick={() => onTabChange('generar')}
            className={`py-4 px-6 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
              activeTab === 'generar'
                ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
            }`}
          >
            🚀 Generar Planeación
          </button>
          
          <button
            onClick={() => onTabChange('historial')}
            className={`py-4 px-6 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
              activeTab === 'historial'
                ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
            }`}
          >
            📚 Banco de Recursos
          </button>
          
          {isAdmin && (
            <button
              onClick={() => onTabChange('estado')}
              className={`py-4 px-6 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
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
              onClick={() => onTabChange('usuarios')}
              className={`py-4 px-6 font-medium text-sm transition-all duration-300 rounded-xl backdrop-blur-sm ${
                activeTab === 'usuarios'
                  ? 'bg-gray-900/90 text-white shadow-lg shadow-gray-900/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40 hover:shadow-md hover:shadow-gray-200/50'
              }`}
            >
              👥 Usuarios
            </button>
          )}
          </div>
          
          <button
            onClick={signOut}
            className="px-4 py-2 bg-gray-100/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-gray-200/80 transition-all duration-300 text-sm font-medium shadow-md shadow-gray-200/50 hover:shadow-lg hover:shadow-gray-200/60"
            title="Cerrar sesión"
          >
            🚪 Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
