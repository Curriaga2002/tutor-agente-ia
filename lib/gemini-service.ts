// Servicio para interactuar con Gemini AI
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildClassPlanPrompt } from './class-plan-prompt'

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

export interface GeminiResponse {
  text: string
  success: boolean
  error?: string
}

export interface ChatMessage {
  role: 'user' | 'model'
  parts: string
}

export class GeminiService {
  private model: any
  private chat: any

  constructor() {
    try {
      
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('API Key de Gemini no está configurada')
      }
      
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      this.chat = this.model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
        },
      })
      
    } catch (error) {
      console.error('❌ Error inicializando Gemini:', error)
      console.error('🔍 Detalles del error:', error)
      console.error('🔍 Tipo de error:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('🔍 Mensaje del error:', error instanceof Error ? error.message : String(error))
      
      if (error instanceof Error && error.stack) {
        console.error('🔍 Stack trace:', error.stack)
      }
      
      throw error
    }
  }

  // Generar respuesta simple con reintentos
  async generateResponse(prompt: string, maxRetries: number = 3): Promise<GeminiResponse> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      
      if (!this.model) {
        throw new Error('Gemini no está inicializado')
      }

      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('API Key de Gemini no está configurada en generateResponse')
      }

      
      const result = await this.model.generateContent(prompt)
      
      const response = await result.response
      
      const text = response.text()
      
      return {
        text,
        success: true
      }
    } catch (error) {
        console.error(`❌ Error en intento ${attempt}/${maxRetries}:`, error)
        
        // Verificar si es un error de cuota
        if (error instanceof Error && error.message.includes('quota')) {
          console.warn('⚠️ Error de cuota detectado. Esperando antes del siguiente intento...')
          
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000 // Backoff exponencial: 2s, 4s, 8s
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
        }
        
        // Si es el último intento o no es error de cuota, devolver error
        if (attempt === maxRetries) {
          console.error('❌ Todos los intentos fallaron')
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en generateResponse'
          }
        }
      }
    }
    
    return {
      text: '',
      success: false,
      error: 'Error inesperado: se agotaron todos los intentos'
    }
  }

  // Chat conversacional
  async chatResponse(message: string): Promise<GeminiResponse> {
    try {
      if (!this.chat) {
        throw new Error('Chat de Gemini no está inicializado')
      }

      
      const result = await this.chat.sendMessage(message)
      const response = await result.response
      const text = response.text()
      
      
      return {
        text,
        success: true
      }
    } catch (error) {
      console.error('❌ Error en chat de Gemini:', error)
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  // Generar plan de clase personalizado
    async generateClassPlan(
    grado: string, 
    tema: string, 
    context: string,
    relevantDocs: any[],
    recursos?: string,
    nombreDocente?: string
  ): Promise<GeminiResponse> {
    try {
      
      // Analizar documentos para extraer información real
      const extractedInfo = this.extractInstitutionalInfo(relevantDocs)
      
      const prompt = this.buildClassPlanPrompt(grado, tema, context, relevantDocs, recursos, nombreDocente, extractedInfo)
      
      const response = await this.generateResponse(prompt)
      
      
      return response
    } catch (error) {
      console.error('❌ Error generando plan de clase en Gemini:', error)
      console.error('🔍 Stack trace completo:', error)
      
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en generateClassPlan'
      }
    }
  }

  // Extraer información institucional de los documentos
  private extractInstitutionalInfo(relevantDocs: any[]): any {
    const info = {
      institution: null as string | null,
      subject: null as string | null,
      grades: [] as string[],
      sessionDuration: null as string | null,
      resources: [] as string[],
      methodologies: [] as string[],
      evaluationCriteria: [] as string[],
      pedagogicalModel: null as string | null,
      mission: null as string | null,
      vision: null as string | null,
      values: [] as string[]
    }

    // Analizar cada documento para extraer información
    relevantDocs.forEach(doc => {
      const content = doc.content || doc.text || ''
      const title = doc.title || ''
      const docType = doc.doc_type || ''

      // Extraer nombre de institución (mejorado)
      if (docType.includes('PEI') || docType.includes('proyecto') || content.includes('institución') || content.includes('IE')) {
        const institutionPatterns = [
          /(?:institución|IE|colegio|escuela)[:\s]*([^.\n]+)/i,
          /(?:nombre de la institución|institución educativa)[:\s]*([^.\n]+)/i,
          /IE\s+([^.\n]+)/i,
          /(?:colegio|escuela)\s+([^.\n]+)/i
        ]
        
        for (const pattern of institutionPatterns) {
          const match = content.match(pattern)
          if (match && !info.institution) {
            info.institution = match[1].trim()
            break
          }
        }
      }

      // Extraer asignatura/área (mejorado)
      if (docType.includes('curricular') || content.includes('asignatura') || content.includes('área') || content.includes('tecnología')) {
        const subjectPatterns = [
          /(?:asignatura|área|materia)[:\s]*([^.\n]+)/i,
          /(?:tecnología e informática|informática|tecnología)[:\s]*([^.\n]+)/i,
          /(?:área de|asignatura de)[:\s]*([^.\n]+)/i
        ]
        
        for (const pattern of subjectPatterns) {
          const match = content.match(pattern)
          if (match && !info.subject) {
            info.subject = match[1].trim()
            break
          }
        }
      }

      // Extraer grados (mejorado)
      const gradePatterns = [
        /(?:grado|nivel)[:\s]*(\d+°?)/gi,
        /(\d+°\s*(?:básica|media)?)/gi,
        /(?:primero|segundo|tercero|cuarto|quinto|sexto|séptimo|octavo|noveno|décimo|undécimo)[:\s]*(\d+°?)/gi
      ]
      
      gradePatterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          matches.forEach((match: string) => {
            const grade = match.replace(/[^\d]/g, '')
            if (grade && !info.grades.includes(grade)) {
              info.grades.push(grade)
            }
          })
        }
      })

      // Extraer duración de sesiones (mejorado)
      const durationPatterns = [
        /(?:duración|tiempo|horario)[:\s]*(\d+)\s*(?:min|minutos|hora|horas)/i,
        /(?:sesión|clase)[:\s]*(\d+)\s*(?:min|minutos|hora|horas)/i,
        /(\d+)\s*(?:min|minutos|hora|horas)\s*(?:por sesión|por clase)/i
      ]
      
      for (const pattern of durationPatterns) {
        const match = content.match(pattern)
        if (match && !info.sessionDuration) {
          const unit = content.includes('hora') ? ' horas' : ' minutos'
          info.sessionDuration = match[1] + unit
          break
        }
      }

      // Extraer recursos (mejorado)
      const resourcePatterns = [
        /(?:recursos|materiales|equipos)[:\s]*([^.\n]+)/gi,
        /(?:disponibles|utilizados)[:\s]*([^.\n]+)/gi,
        /(?:computadores|computadoras|tablets|laptops|proyectores)/gi
      ]
      
      resourcePatterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          matches.forEach((match: string) => {
            const resources = match.split(/[,;]/).map((r: string) => r.trim()).filter((r: string) => r.length > 0)
            info.resources.push(...resources)
          })
        }
      })

      // Extraer metodologías (mejorado)
      const methodologyPatterns = [
        /(?:metodología|estrategia|enfoque)[:\s]*([^.\n]+)/gi,
        /(?:ABP|aprendizaje basado en proyectos|modelo crítico-social|CTS)/gi,
        /(?:construcción-fabricación|diseño-rediseño|análisis de productos)/gi
      ]
      
      methodologyPatterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          matches.forEach((match: string) => {
            const methodologies = match.split(/[,;]/).map((m: string) => m.trim()).filter((m: string) => m.length > 0)
            info.methodologies.push(...methodologies)
          })
        }
      })

      // Extraer modelo pedagógico
      if (content.includes('modelo') && content.includes('pedagógico')) {
        const modelMatch = content.match(/(?:modelo pedagógico|enfoque pedagógico)[:\s]*([^.\n]+)/i)
        if (modelMatch && !info.pedagogicalModel) {
          info.pedagogicalModel = modelMatch[1].trim()
        }
      }

      // Extraer criterios de evaluación
      if (content.includes('evaluación') || content.includes('criterios')) {
        const criteriaPatterns = [
          /(?:criterio|criterios)[:\s]*([^.\n]+)/gi,
          /(?:tabla 7|evaluación)[:\s]*([^.\n]+)/gi
        ]
        
        criteriaPatterns.forEach(pattern => {
          const matches = content.match(pattern)
          if (matches) {
            matches.forEach((match: string) => {
              const criteria = match.split(/[,;]/).map((c: string) => c.trim()).filter((c: string) => c.length > 0)
              info.evaluationCriteria.push(...criteria)
            })
          }
        })
      }

      // Extraer misión y visión (mejorado)
      const missionPatterns = [
        /misión[:\s]*([^.\n]+)/i,
        /(?:nuestra misión|la misión)[:\s]*([^.\n]+)/i
      ]
      
      for (const pattern of missionPatterns) {
        const match = content.match(pattern)
        if (match && !info.mission) {
          info.mission = match[1].trim()
          break
        }
      }

      const visionPatterns = [
        /visión[:\s]*([^.\n]+)/i,
        /(?:nuestra visión|la visión)[:\s]*([^.\n]+)/i
      ]
      
      for (const pattern of visionPatterns) {
        const match = content.match(pattern)
        if (match && !info.vision) {
          info.vision = match[1].trim()
          break
        }
      }

      // Extraer valores
      if (content.includes('valores')) {
        const valuesMatch = content.match(/valores[:\s]*([^.\n]+)/i)
        if (valuesMatch) {
          const values = valuesMatch[1].split(/[,;]/).map((v: string) => v.trim()).filter((v: string) => v.length > 0)
          info.values.push(...values)
        }
      }
    })

    // Limpiar y deduplicar arrays
    info.grades = Array.from(new Set(info.grades))
    info.resources = Array.from(new Set(info.resources))
    info.methodologies = Array.from(new Set(info.methodologies))
    info.evaluationCriteria = Array.from(new Set(info.evaluationCriteria))
    info.values = Array.from(new Set(info.values))

    return info
  }

  // Construir prompt para plan de clase
  private buildClassPlanPrompt(
    grado: string, 
    tema: string, 
    context: string,
    relevantDocs: any[],
    recursos?: string,
    nombreDocente?: string,
    extractedInfo?: any
  ): string {
    return buildClassPlanPrompt(grado, tema, context, relevantDocs, recursos, nombreDocente, extractedInfo)
  }

  // Reiniciar chat
  resetChat() {
    try {
      this.chat = this.model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
        },
      })
    } catch (error) {
      console.error('❌ Error reiniciando chat:', error)
    }
  }

  // Calcular año lectivo dinámicamente según calendario académico colombiano
  calculateAcademicYear(): string {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() retorna 0-11, sumamos 1 para 1-12
    
    // Calendario académico colombiano típico:
    // Año lectivo va de febrero a noviembre
    // Período I: Febrero - Junio
    // Período II: Agosto - Noviembre
    // Vacaciones: Diciembre - Enero
    
    let academicYear: number
    let period: string
    
    if (currentMonth >= 2 && currentMonth <= 6) {
      // Febrero a Junio: Período I del año actual
      academicYear = currentYear
      period = 'Período académico I'
    } else if (currentMonth >= 8 && currentMonth <= 11) {
      // Agosto a Noviembre: Período II del año actual
      academicYear = currentYear
      period = 'Período académico II'
    } else if (currentMonth === 12 || currentMonth === 1) {
      // Diciembre y Enero: Vacaciones, usar año del período anterior
      if (currentMonth === 12) {
        academicYear = currentYear
        period = 'Vacaciones (Período II finalizado)'
      } else {
        academicYear = currentYear - 1
        period = 'Vacaciones (Período II finalizado)'
      }
    } else {
      // Julio: Vacaciones entre períodos
      academicYear = currentYear
      period = 'Vacaciones (Entre períodos)'
    }
    
    const result = `${academicYear} – ${period}`
    return result
  }

  // Mostrar información sobre cuotas
  showQuotaInfo() {
  }
}

// Instancia global del servicio
export const geminiService = new GeminiService()
