"use client"

interface NavigationProps {
  activeTab: "generar" | "estado" | "historial"
  onTabChange: (tab: "generar" | "estado" | "historial") => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <button
            onClick={() => onTabChange('generar')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🚀 Generar Planeación
          </button>
          
          <button
            onClick={() => onTabChange('historial')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'historial'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📚 Banco de Recursos
          </button>
          
          <button
            onClick={() => onTabChange('estado')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'estado'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Estado de la App
          </button>
        </div>
      </div>
    </nav>
  )
}
