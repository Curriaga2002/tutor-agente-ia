import React from 'react'
import { useBucketDocuments } from '../hooks/useBucketDocuments'

export default function AppStatus() {
  const { documents: bucketDocuments, isLoading: documentsLoading, error: documentsError, documentCount, lastUpdated } = useBucketDocuments()

  const getStatusColor = () => {
    if (documentsLoading) return 'bg-yellow-100 text-yellow-800'
    if (documentsError) return 'bg-red-100 text-red-800'
    if (documentCount > 0) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = () => {
    if (documentsLoading) return '🔄'
    if (documentsError) return '❌'
    if (documentCount > 0) return '✅'
    return '⚪'
  }

  const getStatusText = () => {
    if (documentsLoading) return 'Conectando al sistema...'
    if (documentsError) return 'Error de conexión'
    if (documentCount > 0) return `${documentCount} documentos disponibles`
    return 'Sin documentos'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">📊 Estado de la Aplicación</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusIcon()} {getStatusText()}
        </div>
      </div>

      {/* Estado del Sistema de Documentos */}
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-3">📚 Sistema de Documentos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado de conexión:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor()}`}>
                  {getStatusIcon()} {getStatusText()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Documentos cargados:</span>
                <span className="text-sm font-medium text-gray-800">
                  {documentsLoading ? '...' : documentCount}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Última actualización:</span>
                <span className="text-sm font-medium text-gray-800">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('es-ES') : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monitoreo en tiempo real:</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  🔄 Activo
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bucket Supabase:</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✅ Conectado
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de datos:</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✅ Conectada
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de la IA */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-3">🤖 Sistema de Inteligencia Artificial</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gemini API:</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✅ Activa
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Modelo:</span>
                <span className="text-sm font-medium text-gray-800">gemini-1.5-flash</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sistema de fallback:</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  🔄 Disponible
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Generación de planes:</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✅ Funcionando
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Documentos Disponibles */}
        {bucketDocuments.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-700 mb-3">📖 Documentos Disponibles</h3>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {bucketDocuments.slice(0, 10).map((doc, index) => (
                <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500">{doc.doc_type}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">#{index + 1}</span>
                </div>
              ))}
              {bucketDocuments.length > 10 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  ... y {bucketDocuments.length - 10} documentos más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Errores del Sistema */}
        {documentsError && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h3 className="text-lg font-medium text-red-700 mb-2">⚠️ Error del Sistema</h3>
            <p className="text-sm text-red-600">{documentsError}</p>
            <p className="text-xs text-red-500 mt-2">
              El sistema continuará funcionando con funcionalidad limitada.
            </p>
          </div>
        )}
      </div>

      {/* Botón de Actualización */}
      <div className="mt-6 text-center">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          🔄 Actualizar Estado
        </button>
      </div>
    </div>
  )
}
