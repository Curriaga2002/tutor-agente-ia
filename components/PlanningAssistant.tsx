"use client"

import { useState } from "react"
import Header from "./Header"
import Navigation from "./Navigation"
import PlanningForm from "./PlanningForm"
import ResultsPanel from "./ResultsPanel"
import ResourcesBank from "./ResourcesBank"
import IntelligentSearch from "./IntelligentSearch"
import DocumentIndexer from "./DocumentIndexer"

export default function PlanningAssistant() {
  const [activeTab, setActiveTab] = useState<"generar" | "historial" | "busqueda" | "indexar">("generar")
  const [currentPlanningData, setCurrentPlanningData] = useState(null)
  const [searchResults, setSearchResults] = useState([])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "generar" && (
          <div className="w-full">
            <PlanningForm currentPlanningData={currentPlanningData} setCurrentPlanningData={setCurrentPlanningData} />
          </div>
        )}

        {activeTab === "historial" && (
          <ResourcesBank setActiveTab={setActiveTab} setCurrentPlanningData={setCurrentPlanningData} />
        )}

        {activeTab === "busqueda" && (
          <div className="w-full space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🔍 <span>Búsqueda Inteligente de Recursos Educativos</span>
              </h2>
              <p className="text-gray-600 mb-6">
                Encuentra planeaciones, orientaciones y recursos educativos usando búsqueda semántica avanzada.
              </p>
            </div>
            
            <IntelligentSearch
              onResultsFound={setSearchResults}
              context={{
                grado: "8°",
                tema: "robótica",
                doc_type: "plan"
              }}
              placeholder="Buscar planeaciones, orientaciones, PEI..."
            />
            
            {/* Resultados de Búsqueda */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📊 <span>Resultados de Búsqueda ({searchResults.length})</span>
                </h3>
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-1">
                            📚 {result.title}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {result.doc_type}
                            </span>
                            {result.metadata?.grado && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {result.metadata.grado}
                              </span>
                            )}
                            {result.metadata?.tema && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                {result.metadata.tema}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right text-sm">
                          <div className="text-gray-500">Score combinado</div>
                          <div className="font-semibold text-blue-600">
                            {(result.combined_score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 mb-3">
                        <div className="line-clamp-3">{result.content}</div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex gap-4">
                          <span>Texto: {(result.text_score * 100).toFixed(1)}%</span>
                          <span>Vector: {(result.vector_score * 100).toFixed(1)}%</span>
                        </div>
                        <span>ID: {result.chunk_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "indexar" && (
          <div className="w-full space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📚 <span>Indexador de Documentos Educativos</span>
              </h2>
              <p className="text-gray-600 mb-6">
                Sube PDFs de planeaciones, orientaciones y recursos para hacerlos buscables con IA.
              </p>
            </div>
            
            <DocumentIndexer
              onIndexingComplete={(results) => {
                console.log('Indexación completada:', results)
                alert(`✅ ${results.length} documentos indexados exitosamente!`)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
