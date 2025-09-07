// Servicio de embeddings usando Google Gemini para el sistema de planeación didáctica
export interface GeminiEmbeddingRequest {
  text: string
  model?: string
  taskType?: string
}

export interface GeminiEmbeddingResponse {
  embedding: number[]
  tokenCount: number
  model: string
}

export interface BatchEmbeddingRequest {
  texts: string[]
  batchSize?: number
  model?: string
}

export interface BatchEmbeddingResponse {
  embeddings: number[][]
  tokenCounts: number[]
  model: string
  totalTokens: number
}

export class GeminiEmbeddingService {
  private apiKey: string
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models'
  private defaultModel: string = 'embedding-001' // Modelo de embeddings de Gemini
  private maxBatchSize: number = 100 // Tamaño máximo del batch para evitar rate limits

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY no configurada. Los embeddings no funcionarán.')
    }
  }

  /**
   * Genera un embedding para un texto individual
   */
  async generateEmbedding(request: GeminiEmbeddingRequest): Promise<GeminiEmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY no configurada')
    }

    try {
      const model = request.model || this.defaultModel
      const url = `${this.baseUrl}/${model}:embedContent?key=${this.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          content: {
            parts: [{
              text: request.text
            }]
          },
          taskType: request.taskType || 'RETRIEVAL_DOCUMENT'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error de Gemini API: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      // Verificar que la respuesta tenga el formato esperado
      if (!data.embedding || !data.embedding.values) {
        throw new Error('Respuesta de Gemini no tiene el formato esperado')
      }

      return {
        embedding: data.embedding.values,
        tokenCount: data.embedding.tokenCount || 0,
        model: model
      }

    } catch (error) {
      console.error('❌ Error generando embedding con Gemini:', error)
      throw error
    }
  }

  /**
   * Genera embeddings para múltiples textos en batch
   */
  async generateBatchEmbeddings(request: BatchEmbeddingRequest): Promise<BatchEmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY no configurada')
    }

    const batchSize = request.batchSize || this.maxBatchSize
    const model = request.model || this.defaultModel
    const texts = request.texts
    const allEmbeddings: number[][] = []
    const allTokenCounts: number[] = []
    let totalTokens = 0

    try {
      // Procesar en batches para evitar rate limits
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize)
        
        // Procesar batch en paralelo
        const batchPromises = batch.map(text => 
          this.generateEmbedding({ text, model })
        )
        
        const batchResults = await Promise.all(batchPromises)
        
        // Agregar resultados del batch
        for (const result of batchResults) {
          allEmbeddings.push(result.embedding)
          allTokenCounts.push(result.tokenCount)
          totalTokens += result.tokenCount
        }
        
        // Pequeña pausa entre batches para evitar rate limits
        if (i + batchSize < texts.length) {
          await this.delay(100)
        }
      }

      return {
        embeddings: allEmbeddings,
        tokenCounts: allTokenCounts,
        model: model,
        totalTokens: totalTokens
      }

    } catch (error) {
      console.error('❌ Error en batch embeddings:', error)
      throw error
    }
  }

  /**
   * Genera embeddings específicos para chunks de documentos educativos
   */
  async generateEducationalEmbeddings(chunks: string[]): Promise<number[][]> {
    try {
      
      const response = await this.generateBatchEmbeddings({
        texts: chunks,
        batchSize: 50, // Batch más pequeño para chunks educativos
        model: this.defaultModel
      })
      
      
      return response.embeddings
      
    } catch (error) {
      console.error('❌ Error generando embeddings educativos:', error)
      throw error
    }
  }

  /**
   * Verifica la calidad de un embedding
   */
  validateEmbedding(embedding: number[]): boolean {
    // Verificar que tenga 1536 dimensiones
    if (embedding.length !== 1536) {
      console.warn(`⚠️ Embedding tiene ${embedding.length} dimensiones, esperaba 1536`)
      return false
    }
    
    // Verificar que no sea todo ceros
    const sum = embedding.reduce((acc, val) => acc + Math.abs(val), 0)
    if (sum === 0) {
      console.warn('⚠️ Embedding es todo ceros')
      return false
    }
    
    // Verificar que tenga valores razonables
    const maxVal = Math.max(...embedding.map(Math.abs))
    if (maxVal > 10) {
      console.warn(`⚠️ Embedding tiene valores muy grandes: ${maxVal}`)
      return false
    }
    
    return true
  }

  /**
   * Calcula la similitud de coseno entre dos embeddings
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Los embeddings deben tener la misma dimensión')
    }
    
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }
    
    norm1 = Math.sqrt(norm1)
    norm2 = Math.sqrt(norm2)
    
    if (norm1 === 0 || norm2 === 0) {
      return 0
    }
    
    return dotProduct / (norm1 * norm2)
  }

  /**
   * Encuentra los embeddings más similares
   */
  findMostSimilar(
    queryEmbedding: number[], 
    candidateEmbeddings: number[][], 
    topK: number = 5
  ): Array<{ index: number; similarity: number }> {
    const similarities = candidateEmbeddings.map((embedding, index) => ({
      index,
      similarity: this.calculateCosineSimilarity(queryEmbedding, embedding)
    }))
    
    // Ordenar por similitud descendente
    similarities.sort((a, b) => b.similarity - a.similarity)
    
    return similarities.slice(0, topK)
  }

  /**
   * Obtiene estadísticas de uso de la API
   */
  async getAPIStats(): Promise<any> {
    if (!this.apiKey) {
      return { error: 'API key no configurada' }
    }

    try {
      const url = `${this.baseUrl}/${this.defaultModel}?key=${this.apiKey}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        return {
          model: data.name,
          description: data.description,
          supportedGenerationMethods: data.supportedGenerationMethods,
          supportedEmbeddingMethods: data.supportedEmbeddingMethods
        }
      } else {
        return { error: `Error ${response.status}: ${response.statusText}` }
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  /**
   * Configura la API key
   */
  setAPIKey(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Verifica si la API key está configurada
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Delay helper para evitar rate limits
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Instancia singleton del servicio
export const geminiEmbeddingService = new GeminiEmbeddingService()
