"use client"

interface NavigationProps {
  activeTab: "generar" | "historial"
  onTabChange: (tab: "generar" | "historial") => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="mb-8">
      <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm overflow-x-auto">
        <button
          onClick={() => onTabChange("generar")}
          className={`flex-shrink-0 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === "generar" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          🎯 Generar Planeación
        </button>
        <button
          onClick={() => onTabChange("historial")}
          className={`flex-shrink-0 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === "historial" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          📚 Banco de Recursos
        </button>

      </div>
    </nav>
  )
}
