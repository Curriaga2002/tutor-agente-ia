"use client"

import { useBucketDocuments } from '../hooks/useBucketDocuments'
import { useState } from 'react'

export default function BucketStatus() {
  const { documents, isLoading, error, refreshDocuments, documentCount, lastUpdated } = useBucketDocuments()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshDocuments()
    setIsRefreshing(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">🔄 Cargando documentos del bucket...</h3>
            <p className="text-xs text-blue-600">Conectando con Supabase Storage</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="text-red-600 text-xl">❌</div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error al cargar documentos</h3>
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50"
            >
              {isRefreshing ? '🔄' : '🔄'} Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-green-600 text-xl">✅</div>
          <div>
            <h3 className="text-sm font-medium text-green-800">
              Sistema de documentos conectado
            </h3>
            <p className="text-xs text-green-600">
              {documentCount} documentos disponibles
            </p>
            {lastUpdated && (
              <p className="text-xs text-green-500">
                Última actualización: {formatTime(lastUpdated)}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 disabled:opacity-50 flex items-center gap-1"
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
              Actualizando...
            </>
          ) : (
            <>
              🔄 Actualizar
            </>
          )}
        </button>
      </div>

      {/* Lista de documentos */}
      {documents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <h4 className="text-xs font-medium text-green-700 mb-2">📚 Documentos disponibles:</h4>
          <div className="space-y-1">
            {documents.slice(0, 3).map((doc, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-green-600">
                <span className="w-4 h-4 bg-green-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {index + 1}
                </span>
                <span className="truncate">{doc.title}</span>
                <span className="text-green-500 text-[10px]">
                  ({doc.doc_type})
                </span>
              </div>
            ))}
            {documents.length > 3 && (
              <div className="text-xs text-green-500 text-center">
                ... y {documents.length - 3} más
              </div>
            )}
          </div>
        </div>
      )}

      {/* Indicador de tiempo real */}
      <div className="mt-2 pt-2 border-t border-green-200">
        <div className="flex items-center gap-2 text-xs text-green-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Monitoreo en tiempo real activo</span>
        </div>
      </div>
    </div>
  )
}
