"use client"

interface NavigationProps {
  activeTab: "generar" | "historial" | "busqueda" | "indexar"
  onTabChange: (tab: "generar" | "historial" | "busqueda" | "indexar") => void
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
        <button
          onClick={() => onTabChange("busqueda")}
          className={`flex-shrink-0 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === "busqueda" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          🔍 Búsqueda Inteligente
        </button>
        <button
          onClick={() => onTabChange("indexar")}
          className={`flex-shrink-0 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === "indexar" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          📚 Indexar Documentos
        </button>
      </div>
    </nav>
  )
}
