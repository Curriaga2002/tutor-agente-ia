"use client"

interface NavigationProps {
  activeTab: "generar" | "estado" | "historial"
  onTabChange: (tab: "generar" | "estado" | "historial") => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
          <nav className="bg-white/60 backdrop-blur-2xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-black/5">
      <div className="max-w-6xl mx-auto px-8">
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
        </div>
      </div>
    </nav>
  )
}
