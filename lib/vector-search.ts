// Servicio de búsqueda vectorial para el sistema de planeación didáctica
import { createClient } from '@supabase/supabase-js'

export interface SearchResult {
  chunk_id: number
  document_id: string
  title: string
  doc_type: string
  content: string
  metadata: any
  text_score: number
  vector_score: number
  combined_score: number
}

export interface SearchParams {
  query: string
  grado?: string
  doc_type?: string
  match_threshold?: number
  max_results?: number
}

export interface DocumentInsertParams {
  title: string
  doc_type: 'plan' | 'revision' | 'orientaciones' | 'pei'
  url?: string
  grado?: string
  tema?: string
  duracion?: string
  sesiones?: number
  content: string
}

export class VectorSearchService {
  private supabase: any
  private openaiApiKey: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
  }

  /**
   * Genera embeddings usando OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key no configurada')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small', // 1536 dimensiones
        }),
      })

      if (!response.ok) {
        throw new Error(`Error de OpenAI: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('Error generando embedding:', error)
      throw error
    }
  }

  /**
   * Divide el contenido en chunks para procesamiento
   */
  private chunkContent(content: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length)
      let chunk = content.substring(start, end)

      // Ajustar el final del chunk para no cortar palabras
      if (end < content.length) {
        const lastSpace = chunk.lastIndexOf(' ')
        if (lastSpace > chunkSize * 0.8) {
          chunk = chunk.substring(0, lastSpace)
          start = start + lastSpace + 1
        } else {
          start = end
        }
      } else {
        start = end
      }

      chunks.push(chunk.trim())
      
      // Aplicar overlap
      if (start < content.length) {
        start = Math.max(0, start - overlap)
      }
    }

    return chunks.filter(chunk => chunk.length > 50) // Filtrar chunks muy pequeños
  }

  /**
   * Búsqueda híbrida principal
   */
  async searchEducationalContent(params: SearchParams): Promise<SearchResult[]> {
    try {
      // Generar embedding de la consulta
      const queryEmbedding = await this.generateEmbedding(params.query)

      // Realizar búsqueda híbrida
      const { data, error } = await this.supabase.rpc('search_educational_content', {
        query_text: params.query,
        query_embedding: queryEmbedding,
        grado_filter: params.grado || null,
        doc_type_filter: params.doc_type || null,
        match_threshold: params.match_threshold || 0.7,
        max_results: params.max_results || 10
      })

      if (error) {
        console.error('Error en búsqueda híbrida:', error)
        // Fallback a búsqueda de texto
        return this.searchByTextOnly(params)
      }

      return data || []
    } catch (error) {
      console.error('Error en búsqueda vectorial:', error)
      // Fallback a búsqueda de texto
      return this.searchByTextOnly(params)
    }
  }

  /**
   * Búsqueda solo por texto (fallback)
   */
  async searchByTextOnly(params: SearchParams): Promise<SearchResult[]> {
    try {
      const { data, error } = await this.supabase.rpc('search_by_text_only', {
        query_text: params.query,
        grado_filter: params.grado || null,
        doc_type_filter: params.doc_type || null,
        max_results: params.max_results || 10
      })

      if (error) {
        console.error('Error en búsqueda de texto:', error)
        return []
      }

      // Convertir a formato SearchResult
      return (data || []).map((item: any) => ({
        ...item,
        vector_score: 0,
        combined_score: item.text_score
      }))
    } catch (error) {
      console.error('Error en búsqueda de texto:', error)
      return []
    }
  }

  /**
   * Insertar documento educativo con chunks y embeddings
   */
  async insertEducationalDocument(params: DocumentInsertParams): Promise<string> {
    try {
      // Dividir contenido en chunks
      const chunks = this.chunkContent(params.content)
      
      // Generar embeddings para cada chunk
      const embeddings: number[][] = []
      for (const chunk of chunks) {
        const embedding = await this.generateEmbedding(chunk)
        embeddings.push(embedding)
      }

      // Insertar usando la función SQL
      const { data, error } = await this.supabase.rpc('insert_educational_document', {
        p_title: params.title,
        p_doc_type: params.doc_type,
        p_url: params.url || null,
        p_grado: params.grado || null,
        p_tema: params.tema || null,
        p_duracion: params.duracion || null,
        p_sesiones: params.sesiones || null,
        p_chunks: chunks,
        p_embeddings: embeddings
      })

      if (error) {
        throw new Error(`Error insertando documento: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error insertando documento educativo:', error)
      throw error
    }
  }

  /**
   * Buscar planeaciones específicas por grado y tema
   */
  async searchPlans(grado: string, tema: string, maxResults: number = 5): Promise<SearchResult[]> {
    const query = `plan de clase ${grado} sobre ${tema}`
    
    return this.searchEducationalContent({
      query,
      grado,
      doc_type: 'plan',
      max_results: maxResults
    })
  }

  /**
   * Obtener estadísticas del sistema de búsqueda
   */
  async getSearchStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc('get_search_stats')
      
      if (error) {
        console.error('Error obteniendo estadísticas:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return null
    }
  }

  /**
   * Búsqueda inteligente para el chat assistant
   */
  async searchForChat(query: string, context: any): Promise<SearchResult[]> {
    // Extraer información del contexto
    const grado = context.grado
    const tema = context.tema
    
    // Construir consulta mejorada
    let enhancedQuery = query
    
    if (grado && tema) {
      enhancedQuery = `${query} para grado ${grado} sobre ${tema}`
    } else if (grado) {
      enhancedQuery = `${query} para grado ${grado}`
    } else if (tema) {
      enhancedQuery = `${query} sobre ${tema}`
    }

    return this.searchEducationalContent({
      query: enhancedQuery,
      grado,
      doc_type: 'plan',
      max_results: 5,
      match_threshold: 0.6
    })
  }
}

// Instancia singleton del servicio
export const vectorSearchService = new VectorSearchService()
