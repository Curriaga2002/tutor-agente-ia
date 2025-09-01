"use client"

import { useState, useEffect } from 'react'
import { vectorSearchService, SearchResult, SearchParams } from '../lib/vector-search'

interface IntelligentSearchProps {
  onResultsFound: (results: SearchResult[]) => void
  context?: {
    grado?: string
    tema?: string
    doc_type?: string
  }
  placeholder?: string
}

export default function IntelligentSearch({ 
  onResultsFound, 
  context = {}, 
  placeholder = "Buscar planeaciones, orientaciones, PEI..." 
}: IntelligentSearchProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchStats, setSearchStats] = useState<any>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    grado: context.grado || '',
    doc_type: context.doc_type || '',
    match_threshold: 0.7,
    max_results: 10
  })

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadSearchStats()
  }, [])

  const loadSearchStats = async () => {
    try {
      const stats = await vectorSearchService.getSearchStats()
      setSearchStats(stats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const searchParams: SearchParams = {
        query: query.trim(),
        grado: advancedFilters.grado || undefined,
        doc_type: advancedFilters.doc_type || undefined,
        match_threshold: advancedFilters.match_threshold,
        max_results: advancedFilters.max_results
      }

      const searchResults = await vectorSearchService.searchEducationalContent(searchParams)
      setResults(searchResults)
      onResultsFound(searchResults)
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    onResultsFound([])
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header con estadísticas */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🔍 <span>Búsqueda Inteligente</span>
        </h3>
        
        {searchStats && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{searchStats.total_documents}</span> documentos • 
            <span className="font-medium ml-1">{searchStats.total_chunks}</span> fragmentos
          </div>
        )}
      </div>

      {/* Barra de búsqueda principal */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
        >
          {isSearching ? '🔍 Buscando...' : '🔍 Buscar'}
        </button>
      </div>

      {/* Filtros avanzados */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ⚙️ {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avanzados
        </button>
        
        {showAdvanced && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro por grado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grado
                </label>
                <select
                  value={advancedFilters.grado}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, grado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos los grados</option>
                  <option value="8°">8° Grado</option>
                  <option value="9°">9° Grado</option>
                </select>
              </div>

              {/* Filtro por tipo de documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={advancedFilters.doc_type}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, doc_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="plan">Plan de Clase</option>
                  <option value="revision">Revisión</option>
                  <option value="orientaciones">Orientaciones</option>
                  <option value="pei">PEI</option>
                </select>
              </div>

              {/* Umbral de similitud */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Umbral de Similitud
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={advancedFilters.match_threshold}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, match_threshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">
                  {formatScore(advancedFilters.match_threshold)}
                </div>
              </div>

              {/* Número máximo de resultados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máx. Resultados
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={advancedFilters.max_results}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, max_results: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-800">
              📄 {results.length} resultado(s) encontrado(s)
            </h4>
            <button
              onClick={clearSearch}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar resultados
            </button>
          </div>

          {results.map((result, index) => (
            <div key={result.chunk_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-800 mb-1">
                    📚 {result.title}
                  </h5>
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
                    {formatScore(result.combined_score)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 mb-3">
                <div className="line-clamp-3">{result.content}</div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex gap-4">
                  <span>Texto: {formatScore(result.text_score)}</span>
                  <span>Vector: {formatScore(result.vector_score)}</span>
                </div>
                <span>ID: {result.chunk_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado de búsqueda */}
      {isSearching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando contenido educativo...</p>
          <p className="text-sm text-gray-500 mt-1">Analizando similitud semántica y textual</p>
        </div>
      )}

      {/* Sin resultados */}
      {!isSearching && results.length === 0 && query && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p>No se encontraron resultados para "{query}"</p>
          <p className="text-sm mt-1">Intenta con términos diferentes o ajusta los filtros</p>
        </div>
      )}
    </div>
  )
}
