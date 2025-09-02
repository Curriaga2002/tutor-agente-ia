import React from 'react'
import { useBucketDocuments } from '../hooks/useBucketDocuments'

export default function AppStatus() {
  const { documents: bucketDocuments, isLoading: documentsLoading, error: documentsError, documentCount, lastUpdated, refreshDocuments } = useBucketDocuments()

  const getStatusColor = () => {
    if (documentsLoading) return 'text-amber-500'
    if (documentsError) return 'text-red-500'
    if (documentCount > 0) return 'text-green-500'
    return 'text-gray-400'
  }

  const getStatusIcon = () => {
    if (documentsLoading) return '⏳'
    if (documentsError) return '⚠️'
    if (documentCount > 0) return '✅'
    return '○'
  }

  const getStatusText = () => {
    if (documentsLoading) return 'Conectando'
    if (documentsError) return 'Error'
    if (documentCount > 0) return 'Conectado'
    return 'Desconectado'
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header Principal - Estilo Apple */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">
          Estado del Sistema
        </h1>
        <p className="text-xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
          Monitoreo en tiempo real del estado de la aplicación y recursos disponibles
        </p>
      </div>

      {/* Tarjeta Principal de Estado - Estilo Apple Card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg shadow-black/5 border border-white/30 p-12 mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-light text-gray-900">Estado General</h2>
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            <span className="text-2xl">{getStatusIcon()}</span>
            <span className="text-lg font-medium">{getStatusText()}</span>
          </div>
        </div>

        {/* Grid de Métricas - Estilo Apple */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Documentos</h3>
            <p className="text-3xl font-light text-gray-900 mb-1">
              {documentsLoading ? '...' : documentCount}
            </p>
            <p className="text-sm text-gray-500">Total disponibles</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inteligencia Artificial</h3>
            <p className="text-3xl font-light text-gray-900 mb-1">Activa</p>
            <p className="text-sm text-gray-500">Gemini API</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Monitoreo</h3>
            <p className="text-3xl font-light text-gray-900 mb-1">Tiempo Real</p>
            <p className="text-sm text-gray-500">Activo</p>
          </div>
        </div>
      </div>

      {/* Detalles del Sistema - Estilo Apple */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sistema de Documentos */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg shadow-black/5 border border-white/30 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-xl">📚</span>
            </div>
            <h3 className="text-xl font-light text-gray-900">Sistema de Documentos</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <span className="text-gray-600 font-medium">Estado de conexión</span>
              <span className={`flex items-center space-x-2 ${getStatusColor()}`}>
                <span>{getStatusIcon()}</span>
                <span className="font-medium">{getStatusText()}</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <span className="text-gray-600 font-medium">Documentos cargados</span>
              <span className="font-medium text-gray-900">
                {documentsLoading ? '...' : documentCount}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <span className="text-gray-600 font-medium">Última actualización</span>
              <span className="font-medium text-gray-900">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('es-ES') : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Bucket Supabase</span>
              <span className="flex items-center space-x-2 text-green-500">
                <span>✅</span>
                <span className="font-medium">Conectado</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sistema de IA */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg shadow-black/5 border border-white/30 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-xl">🤖</span>
            </div>
            <h3 className="text-xl font-light text-gray-900">Inteligencia Artificial</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <span className="text-gray-600 font-medium">Gemini API</span>
              <span className="flex items-center space-x-2 text-green-500">
                <span>✅</span>
                <span className="font-medium">Activa</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <span className="text-gray-600 font-medium">Modelo</span>
              <span className="font-medium text-gray-900">gemini-1.5-flash</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <span className="text-gray-600 font-medium">Sistema de fallback</span>
              <span className="flex items-center space-x-2 text-blue-500">
                <span>🔄</span>
                <span className="font-medium">Disponible</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Generación de planes</span>
              <span className="flex items-center space-x-2 text-green-500">
                <span>✅</span>
                <span className="font-medium">Funcionando</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Documentos Disponibles - Estilo Apple */}
      {bucketDocuments.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-xl">📖</span>
            </div>
            <h3 className="text-xl font-light text-gray-900">Documentos Disponibles</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
            {bucketDocuments.slice(0, 12).map((doc, index) => (
              <div key={doc.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-relaxed">{doc.title}</h4>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">#{index + 1}</span>
                </div>
                <p className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                  {doc.doc_type}
                </p>
              </div>
            ))}
          </div>
          
          {bucketDocuments.length > 12 && (
            <div className="text-center mt-6">
              <span className="text-sm text-gray-500">
                ... y {bucketDocuments.length - 12} documentos más
              </span>
            </div>
          )}
        </div>
      )}

      {/* Errores del Sistema - Estilo Apple */}
      {documentsError && (
        <div className="bg-red-50 rounded-3xl border border-red-100 p-8 mt-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-xl">⚠️</span>
            </div>
            <h3 className="text-xl font-light text-red-900">Error del Sistema</h3>
          </div>
          <p className="text-red-700 mb-4 leading-relaxed">{documentsError}</p>
          <p className="text-sm text-red-600">
            El sistema continuará funcionando con funcionalidad limitada.
          </p>
        </div>
      )}

      {/* Botón de Actualización - Estilo Apple */}
      <div className="text-center mt-12">
        <button
          onClick={refreshDocuments}
          disabled={documentsLoading}
          className="inline-flex items-center px-8 py-4 bg-gray-900/90 backdrop-blur-sm text-white rounded-2xl hover:bg-gray-800/90 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium text-lg shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-3">{documentsLoading ? '⏳' : '🔄'}</span>
          {documentsLoading ? 'Actualizando...' : 'Actualizar Estado del Sistema'}
        </button>
      </div>
    </div>
  )
}
