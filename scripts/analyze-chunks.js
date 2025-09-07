#!/usr/bin/env node

// Script para analizar chunks del bucket desde la terminal
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Función para dividir texto en chunks
function createChunks(text, chunkSize = 800, overlap = 150) {
  const chunks = []
  const words = text.split(/\s+/)
  
  let currentChunk = []
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

// Función para detectar tipo de documento
function detectDocumentType(fileName, content) {
  const name = fileName.toLowerCase()
  const text = content.toLowerCase()
  
  if (name.includes('pei') || name.includes('proyecto educativo') || text.includes('proyecto educativo institucional')) {
    return 'PEI'
  } else if (name.includes('orientaciones') || name.includes('curricular') || text.includes('orientaciones curriculares')) {
    return 'Orientaciones Curriculares'
  } else if (name.includes('modelo') || name.includes('pedagógico') || text.includes('modelo pedagógico')) {
    return 'Modelo Pedagógico'
  } else if (name.includes('tabla') || name.includes('evaluación') || text.includes('tabla 7') || text.includes('criterios de evaluación')) {
    return 'Criterios de Evaluación'
  } else if (name.includes('revisión') || name.includes('sistemática') || text.includes('revisión sistemática')) {
    return 'Revisión Sistemática'
  }
  
  return 'Desconocido'
}

// Función para extraer texto de PDF (simulada)
async function extractTextFromPDF(fileName) {
  try {
    const { data, error } = await supabase.storage
      .from('educacion')
      .download(fileName)
    
    if (error) {
      console.error(`❌ Error descargando ${fileName}:`, error)
      return null
    }
    
    // Simular extracción de texto (en un caso real usarías pdf-parse)
    return `Contenido simulado del archivo ${fileName}. Este es un ejemplo de texto extraído del documento PDF. Contiene información educativa relevante para la planeación didáctica.`
  } catch (error) {
    console.error(`❌ Error procesando ${fileName}:`, error)
    return null
  }
}

async function analyzeChunks() {
  
  try {
    // Listar archivos del bucket
    const { data: files, error: listError } = await supabase.storage
      .from('educacion')
      .list('', {
        limit: 1000,
        offset: 0
      })
    
    if (listError) {
      console.error('❌ Error listando archivos:', listError)
      return
    }
    
    if (!files || files.length === 0) {
      return
    }
    
    
    // Filtrar archivos válidos
    const validFiles = files.filter(file => {
      const systemFiles = ['.emptyFolderPlaceholder', '.DS_Store', 'Thumbs.db', '.gitkeep', '.gitignore']
      const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
      
      if (systemFiles.includes(file.name)) return false
      if (file.name.startsWith('.')) return false
      
      return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    })
    
    
    // Procesar cada archivo
    const results = []
    
    for (const file of validFiles) {
      
      // Extraer texto (simulado)
      const content = await extractTextFromPDF(file.name)
      if (!content) continue
      
      // Detectar tipo de documento
      const docType = detectDocumentType(file.name, content)
      
      // Generar chunks
      const chunks = createChunks(content, 800, 150)
      
      const result = {
        fileName: file.name,
        docType,
        contentLength: content.length,
        totalChunks: chunks.length,
        chunks: chunks.map((chunk, index) => ({
          index,
          content: chunk,
          length: chunk.length,
          preview: chunk.substring(0, 100) + (chunk.length > 100 ? '...' : '')
        }))
      }
      
      results.push(result)
      
    }
    
    // Mostrar resumen
      results.reduce((sum, doc) => 
        sum + doc.chunks.reduce((chunkSum, chunk) => chunkSum + chunk.length, 0), 0
      ) / results.reduce((sum, doc) => sum + doc.totalChunks, 0)
    )} caracteres`)
    
    // Mostrar por tipo de documento
    const typeGroups = results.reduce((groups, doc) => {
      if (!groups[doc.docType]) groups[doc.docType] = []
      groups[doc.docType].push(doc)
      return groups
    }, {})
    
    Object.entries(typeGroups).forEach(([type, docs]) => {
      docs.forEach(doc => {
      })
    })
    
    // Guardar resultados en archivo
    const outputFile = path.join(__dirname, 'chunks-analysis.json')
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
    
  } catch (error) {
    console.error('❌ Error en análisis:', error)
  }
}

// Ejecutar análisis
analyzeChunks()
