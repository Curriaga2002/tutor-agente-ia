"use client"

import { useState, useRef, useCallback } from 'react'
import { indexBatchDocuments, IndexingProgress, IndexingResult } from '../lib/document-indexer'
import { DocumentMetadata } from '../lib/document-indexer'

interface DocumentIndexerProps {
  onIndexingComplete?: (results: IndexingResult[]) => void
}

export default function DocumentIndexer({ onIndexingComplete }: DocumentIndexerProps) {
  const [isIndexing, setIsIndexing] = useState(false)
  const [progress, setProgress] = useState<IndexingProgress | null>(null)
  const [results, setResults] = useState<IndexingResult[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    doc_type: 'plan',
    grado: '',
    componente: '',
    estrategia: '',
    tema: '',
    duracion: '',
    sesiones: 1,
    fecha_creacion: new Date().toISOString().split('T')[0],
    autor: '',
    institucion: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Configurar callback de progreso
  const handleProgress = useCallback((progress: IndexingProgress) => {
    setProgress(progress)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const pdfFiles = files.filter(file => file.type === 'application/pdf')
    
    if (pdfFiles.length !== files.length) {
      alert('⚠️ Solo se permiten archivos PDF')
    }
    
    setSelectedFiles(pdfFiles)
  }

  const handleMetadataChange = (field: keyof DocumentMetadata, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateMetadata = (): boolean => {
    if (!metadata.tema || metadata.tema.trim() === '') {
      alert('⚠️ El tema es obligatorio')
      return false
    }
    
    if (!metadata.doc_type) {
      alert('⚠️ El tipo de documento es obligatorio')
      return false
    }
    
    return true
  }

  const startIndexing = async () => {
    if (selectedFiles.length === 0) {
      alert('⚠️ Selecciona al menos un archivo PDF')
      return
    }

    if (!validateMetadata()) {
      return
    }

    setIsIndexing(true)
    setProgress(null)
    setResults([])

    try {
      // Usar la función directa de indexación
      const indexingResults = await indexBatchDocuments(
        selectedFiles,
        metadata,
        handleProgress
      )
      
      setResults(indexingResults)
      
      if (onIndexingComplete) {
        onIndexingComplete(indexingResults)
      }
      
      // Limpiar archivos seleccionados
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      console.error('Error durante la indexación:', error)
      alert(`❌ Error durante la indexación: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsIndexing(false)
      setProgress(null)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setSelectedFiles([])
    setMetadata({
      doc_type: 'plan',
      grado: '',
      componente: '',
      estrategia: '',
      tema: '',
      duracion: '',
      sesiones: 1,
      fecha_creacion: new Date().toISOString().split('T')[0],
      autor: '',
      institucion: ''
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getProgressColor = (stage: string) => {
    switch (stage) {
      case 'uploading': return 'bg-blue-500'
      case 'processing': return 'bg-yellow-500'
      case 'chunking': return 'bg-purple-500'
      case 'embedding': return 'bg-green-500'
      case 'saving': return 'bg-indigo-500'
      case 'complete': return 'bg-green-600'
      default: return 'bg-gray-500'
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'uploading': return '📤'
      case 'processing': return '⚙️'
      case 'chunking': return '✂️'
      case 'embedding': return '🧠'
      case 'saving': return '💾'
      case 'complete': return '✅'
      default: return '🔄'
    }
  }

  return (
    <div className="space-y-6">
      {/* Selección de archivos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📁 <span>Seleccionar Archivos PDF</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivos PDF
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Selecciona uno o más archivos PDF para indexar
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivos seleccionados ({selectedFiles.length})
              </label>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">📄</span>
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Eliminar archivo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadatos del documento */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📝 <span>Metadatos del Documento</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento *
            </label>
            <select
              value={metadata.doc_type}
              onChange={(e) => handleMetadataChange('doc_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="plan">Plan de Clase</option>
              <option value="revision">Revisión</option>
              <option value="orientaciones">Orientaciones</option>
              <option value="pei">PEI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema *
            </label>
            <input
              type="text"
              value={metadata.tema}
              onChange={(e) => handleMetadataChange('tema', e.target.value)}
              placeholder="Ej: Robótica con Arduino"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grado
            </label>
            <input
              type="text"
              value={metadata.grado}
              onChange={(e) => handleMetadataChange('grado', e.target.value)}
              placeholder="Ej: 8°"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Componente
            </label>
            <input
              type="text"
              value={metadata.componente}
              onChange={(e) => handleMetadataChange('componente', e.target.value)}
              placeholder="Ej: Tecnología e Informática"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estrategia
            </label>
            <input
              type="text"
              value={metadata.estrategia}
              onChange={(e) => handleMetadataChange('estrategia', e.target.value)}
              placeholder="Ej: Aprendizaje basado en proyectos"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración
            </label>
            <input
              type="text"
              value={metadata.duracion}
              onChange={(e) => handleMetadataChange('duracion', e.target.value)}
              placeholder="Ej: 2 horas"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Sesiones
            </label>
            <input
              type="number"
              value={metadata.sesiones}
              onChange={(e) => handleMetadataChange('sesiones', parseInt(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Creación
            </label>
            <input
              type="date"
              value={metadata.fecha_creacion}
              onChange={(e) => handleMetadataChange('fecha_creacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Autor
            </label>
            <input
              type="text"
              value={metadata.autor}
              onChange={(e) => handleMetadataChange('autor', e.target.value)}
              placeholder="Ej: Profesor Juan Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institución
            </label>
            <input
              type="text"
              value={metadata.institucion}
              onChange={(e) => handleMetadataChange('institucion', e.target.value)}
              placeholder="Ej: IE Camilo Torres"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Controles de indexación */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={startIndexing}
            disabled={isIndexing || selectedFiles.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isIndexing ? '🔄 Indexando...' : '🚀 Iniciar Indexación'}
          </button>

          <button
            onClick={clearAll}
            disabled={isIndexing}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            🗑️ Limpiar Todo
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      {progress && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            {getStageIcon(progress.stage)} <span>Progreso de Indexación</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Etapa: {progress.stage}</span>
              <span>{progress.progress.toFixed(1)}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(progress.stage)}`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-700">{progress.message}</p>
            
            {progress.currentFile && (
              <p className="text-xs text-gray-500">
                Archivo actual: {progress.currentFile}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📊 <span>Resultados de Indexación</span>
          </h3>
          
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.success ? '✅' : '❌'}
                    </span>
                    <span className="font-medium text-gray-800">
                      {result.success ? 'Indexado exitosamente' : 'Error en indexación'}
                    </span>
                  </div>
                  
                  {result.success && result.documentId && (
                    <span className="text-sm text-gray-500 font-mono">
                      ID: {result.documentId}
                    </span>
                  )}
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <p>Chunks procesados: {result.chunksProcessed}</p>
                  <p>Embeddings generados: {result.embeddingsGenerated}</p>
                  <p>Tiempo de procesamiento: {result.processingTime}ms</p>
                  
                  {result.error && (
                    <p className="text-red-600 mt-1">Error: {result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">📈 Resumen</h4>
            <div className="text-sm text-blue-700">
              <p>Total de documentos: {results.length}</p>
              <p>Exitosos: {results.filter(r => r.success).length}</p>
              <p>Fallidos: {results.filter(r => !r.success).length}</p>
              <p>Tiempo total: {results.reduce((sum, r) => sum + r.processingTime, 0)}ms</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
