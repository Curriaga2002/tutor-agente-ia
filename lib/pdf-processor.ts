// Servicio de procesamiento de PDFs para el sistema de planeación didáctica
import { PDFDocument, PDFPage } from 'pdf-lib'

export interface PDFChunk {
  content: string
  metadata: {
    page: number
    chunkIndex: number
    startToken: number
    endToken: number
  }
}

export interface ProcessedPDF {
  title: string
  totalPages: number
  totalChunks: number
  chunks: PDFChunk[]
  metadata: {
    fileSize: number
    processingTime: number
    chunkSize: number
    overlap: number
  }
}

/**
 * Procesa un PDF y lo divide en chunks para indexación
 */
export async function processPDF(
  file: File,
  chunkSize: number = 800,
  overlap: number = 150
): Promise<ProcessedPDF> {
  const startTime = Date.now()
  
  try {
    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Cargar el PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    let allText = ''
    const chunks: PDFChunk[] = []
    
    // Extraer texto de cada página (simulado ya que pdf-lib no extrae texto)
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      // Como pdf-lib no extrae texto, simulamos el contenido
      const pageText = `Página ${i + 1} del documento PDF. Contenido educativo relacionado con planeación didáctica.`
      allText += pageText + '\n'
    }
    
    // Crear chunks del texto
    const textChunks = createChunks(allText, chunkSize, overlap)
    
    // Convertir chunks a formato PDFChunk
    textChunks.forEach((chunk, index) => {
      chunks.push({
        content: chunk,
        metadata: {
          page: Math.floor(index / 2) + 1, // Simulado
          chunkIndex: index,
          startToken: index * chunkSize,
          endToken: (index + 1) * chunkSize
        }
      })
    })
    
    const processingTime = Date.now() - startTime
    
    return {
      title: file.name,
      totalPages: pages.length,
      totalChunks: chunks.length,
      chunks,
      metadata: {
        fileSize: file.size,
        processingTime,
        chunkSize,
        overlap
      }
    }
    
  } catch (error) {
    console.error('Error procesando PDF:', error)
    throw new Error(`Error procesando PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Extrae texto de un PDF (simulado para navegador)
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Como estamos en el navegador, simulamos la extracción de texto
    // En una implementación real, usarías pdf.js o similar
    return `Contenido extraído del PDF: ${file.name}. 
    
Este es un documento educativo que contiene información sobre planeación didáctica, 
estrategias pedagógicas, y orientaciones curriculares para diferentes grados y áreas.

El contenido incluye:
- Objetivos de aprendizaje
- Competencias específicas
- Momentos pedagógicos
- Estrategias didácticas
- Criterios de evaluación
- Recursos y materiales

Este texto simulado permite probar el sistema de indexación y búsqueda vectorial
mientras se desarrolla la funcionalidad completa de extracción de PDFs.`
    
  } catch (error) {
    console.error('Error extrayendo texto del PDF:', error)
    throw new Error(`Error extrayendo texto del PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Divide el texto en chunks con overlap
 */
function createChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  const words = text.split(/\s+/)
  
  let currentChunk: string[] = []
  let currentSize = 0
  
  for (const word of words) {
    if (currentSize + word.length > chunkSize && currentChunk.length > 0) {
      // Guardar chunk actual
      chunks.push(currentChunk.join(' '))
      
      // Crear nuevo chunk con overlap
      const overlapWords = currentChunk.slice(-Math.floor(overlap / 10)) // Aproximación
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

/**
 * Calcula el tamaño óptimo de chunk basado en el texto
 */
export function calculateOptimalChunkSize(text: string): number {
  const wordCount = text.split(/\s+/).length
  
  if (wordCount < 500) return 400
  if (wordCount < 1000) return 600
  if (wordCount < 2000) return 800
  return 1000
}

/**
 * Limpia y normaliza el texto para mejor procesamiento
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Múltiples espacios a uno
    .replace(/\n+/g, '\n') // Múltiples saltos de línea a uno
    .trim()
}
