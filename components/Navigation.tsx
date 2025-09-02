"use client"

interface NavigationProps {
  activeTab: "generar" | "estado" | "historial"
  onTabChange: (tab: "generar" | "estado" | "historial") => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => onTabChange('generar')}
            className={`py-4 px-6 font-medium text-sm transition-all duration-200 rounded-xl ${
              activeTab === 'generar'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            🚀 Generar Planeación
          </button>
          
          <button
            onClick={() => onTabChange('historial')}
            className={`py-4 px-6 font-medium text-sm transition-all duration-200 rounded-xl ${
              activeTab === 'historial'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📚 Banco de Recursos
          </button>
          
          <button
            onClick={() => onTabChange('estado')}
            className={`py-4 px-6 font-medium text-sm transition-all duration-200 rounded-xl ${
              activeTab === 'estado'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📊 Estado de la App
          </button>
        </div>
      </div>
    </nav>
  )
}
