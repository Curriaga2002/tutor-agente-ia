'use client'

import { useState, useEffect } from 'react'
import { useDocuments } from '@/contexts/DocumentContext'

interface ChunkInfo {
  documentTitle: string
  docType: string
  totalChunks: number
  chunks: Array<{
    index: number
    content: string
    length: number
    preview: string
  }>
}

export default function ChunkViewer() {
  const { documents, isLoading, error } = useDocuments()
  const [chunks, setChunks] = useState<ChunkInfo[]>([])
  const [selectedDoc, setSelectedDoc] = useState<string>('')
  const [selectedChunk, setSelectedChunk] = useState<number>(-1)
  const [chunkSize, setChunkSize] = useState<number>(800)
  const [overlap, setOverlap] = useState<number>(150)

  // Función para dividir texto en chunks
  const createChunks = (text: string, chunkSize: number, overlap: number) => {
    const chunks: string[] = []
    const words = text.split(/\s+/)
    
    let currentChunk: string[] = []
    let currentSize = 0
    
    for (const word of words) {
      if (currentSize + word.length > chunkSize && currentChunk.length > 0) {
        // Guardar chunk actual
        chunks.push(currentChunk.join(' '))
        
        // Crear nuevo chunk con overlap
        const overlapWords = currentChunk.slice(-Math.floor(overlap / 10))
        currentChunk = [...overlapWords, word]
        currentSize = overlapWords.reduce((sum, w) => sum + w.length, 0) + word.length + 1
      } else {
        currentChunk.push(word)
        currentSize += word.length + 1
      }
    }
    
    // Agregar el último chunk si tiene contenido
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))
    }
    
    return chunks
  }

  // Procesar documentos y generar chunks
  useEffect(() => {
    if (documents.length > 0) {
      const processedChunks: ChunkInfo[] = documents.map(doc => {
        const textChunks = createChunks(doc.content, chunkSize, overlap)
        
        return {
          documentTitle: doc.title,
          docType: doc.doc_type,
          totalChunks: textChunks.length,
          chunks: textChunks.map((chunk, index) => ({
            index,
            content: chunk,
            length: chunk.length,
            preview: chunk.substring(0, 100) + (chunk.length > 100 ? '...' : '')
          }))
        }
      })
      
      setChunks(processedChunks)
    }
  }, [documents, chunkSize, overlap])

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <p>🔄 Cargando documentos y generando chunks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">❌ Error: {error}</p>
      </div>
    )
  }

  const selectedDocument = chunks.find(doc => doc.documentTitle === selectedDoc)

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔍 Visor de Chunks del Bucket</h2>
      
      {/* Configuración de chunks */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">⚙️ Configuración de Chunks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tamaño de Chunk (caracteres)</label>
            <input
              type="number"
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="100"
              max="2000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Overlap (caracteres)</label>
            <input
              type="number"
              value={overlap}
              onChange={(e) => setOverlap(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              max="500"
            />
          </div>
        </div>
      </div>

      {/* Resumen de documentos */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📚 Documentos en el Bucket ({chunks.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chunks.map((doc, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedDoc === doc.documentTitle
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedDoc(doc.documentTitle)}
            >
              <h4 className="font-medium text-sm mb-2">{doc.documentTitle}</h4>
              <p className="text-xs text-gray-600 mb-2">Tipo: {doc.docType}</p>
              <p className="text-xs text-blue-600">Chunks: {doc.totalChunks}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle de chunks del documento seleccionado */}
      {selectedDocument && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            📄 Chunks de: {selectedDocument.documentTitle}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDocument.chunks.map((chunk, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedChunk === index
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedChunk(index)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-600">Chunk {index + 1}</span>
                  <span className="text-xs text-gray-500">{chunk.length} chars</span>
                </div>
                <p className="text-sm text-gray-700">{chunk.preview}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido completo del chunk seleccionado */}
      {selectedDocument && selectedChunk >= 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">
            📝 Contenido Completo del Chunk {selectedChunk + 1}
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">
                {selectedDocument.chunks[selectedChunk].length} caracteres
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(selectedDocument.chunks[selectedChunk].content)}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Copiar
              </button>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {selectedDocument.chunks[selectedChunk].content}
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">📊 Estadísticas de Chunks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Documentos:</span>
            <br />
            {chunks.length}
          </div>
          <div>
            <span className="font-medium">Total Chunks:</span>
            <br />
            {chunks.reduce((sum, doc) => sum + doc.totalChunks, 0)}
          </div>
          <div>
            <span className="font-medium">Tamaño Promedio:</span>
            <br />
            {chunks.length > 0 
              ? Math.round(
                  chunks.reduce((sum, doc) => 
                    sum + doc.chunks.reduce((chunkSum, chunk) => chunkSum + chunk.length, 0), 0
                  ) / chunks.reduce((sum, doc) => sum + doc.totalChunks, 0)
                )
              : 0
            } chars
          </div>
          <div>
            <span className="font-medium">Configuración:</span>
            <br />
            {chunkSize}/{overlap}
          </div>
        </div>
      </div>
    </div>
  )
}
