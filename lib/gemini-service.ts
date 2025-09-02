// Servicio para interactuar con Gemini AI
import { GoogleGenerativeAI } from '@google/generative-ai'

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
      console.log('🔧 Inicializando Gemini Service...')
      console.log('🔑 API Key disponible:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY)
      console.log('🔑 API Key valor:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Configurada' : 'NO CONFIGURADA')
      console.log('🔑 API Key longitud:', process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length || 0)
      
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('API Key de Gemini no está configurada')
      }
      
      console.log('🚀 Creando modelo Gemini...')
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      console.log('✅ Modelo creado:', !!this.model)
      
      console.log('💬 Iniciando chat...')
      this.chat = this.model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })
      console.log('✅ Chat iniciado:', !!this.chat)
      
      console.log('✅ Gemini Service inicializado exitosamente')
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

  // Generar respuesta simple
  async generateResponse(prompt: string): Promise<GeminiResponse> {
    try {
      console.log('🔍 Gemini generateResponse: Verificando estado...')
      console.log('📱 Modelo disponible:', !!this.model)
      console.log('🔑 API Key en uso:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY)
      console.log('🔑 API Key valor:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Configurada' : 'NO CONFIGURADA')
      
      if (!this.model) {
        throw new Error('Gemini no está inicializado')
      }

      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('API Key de Gemini no está configurada en generateResponse')
      }

      console.log('🤖 Gemini generando respuesta para:', prompt.substring(0, 100) + '...')
      console.log('📏 Longitud del prompt:', prompt.length)
      
      console.log('🚀 Llamando a model.generateContent...')
      const result = await this.model.generateContent(prompt)
      console.log('📨 Resultado recibido:', !!result)
      
      console.log('🔄 Procesando response...')
      const response = await result.response
      console.log('📝 Response procesado:', !!response)
      
      console.log('📖 Extrayendo texto...')
      const text = response.text()
      console.log('✅ Texto extraído, longitud:', text.length)
      console.log('📄 Primeros 200 caracteres:', text.substring(0, 200))
      
      return {
        text,
        success: true
      }
    } catch (error) {
      console.error('❌ Error generando respuesta con Gemini:', error)
      console.error('🔍 Detalles del error:', error)
      console.error('🔍 Tipo de error:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('🔍 Mensaje del error:', error instanceof Error ? error.message : String(error))
      
      if (error instanceof Error && error.stack) {
        console.error('🔍 Stack trace:', error.stack)
      }
      
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en generateResponse'
      }
    }
  }

  // Chat conversacional
  async chatResponse(message: string): Promise<GeminiResponse> {
    try {
      if (!this.chat) {
        throw new Error('Chat de Gemini no está inicializado')
      }

      console.log('💬 Gemini procesando mensaje de chat...')
      
      const result = await this.chat.sendMessage(message)
      const response = await result.response
      const text = response.text()
      
      console.log('✅ Gemini chat response generado')
      
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
    relevantDocs: any[]
  ): Promise<GeminiResponse> {
    try {
      console.log('🎯 Gemini: Iniciando generación de plan de clase...')
      console.log('📋 Parámetros recibidos:', { grado, tema, context, relevantDocsCount: relevantDocs.length })
      
      const prompt = this.buildClassPlanPrompt(grado, tema, context, relevantDocs)
      console.log('📝 Prompt construido:', prompt.substring(0, 200) + '...')
      
      console.log('🚀 Llamando a generateResponse...')
      const response = await this.generateResponse(prompt)
      
      console.log('📨 Respuesta recibida de generateResponse:', {
        success: response.success,
        textLength: response.text?.length || 0,
        error: response.error
      })
      
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

  // Construir prompt para plan de clase
  private buildClassPlanPrompt(
    grado: string, 
    tema: string, 
    context: string,
    relevantDocs: any[]
  ): string {
    let prompt = `Eres un asistente pedagógico experto especializado en la creación de planes de clase personalizados.

Tu misión es generar planes de clase completos y adaptados que integren:
• Modelos pedagógicos modernos y adaptativos
• Orientaciones curriculares actualizadas
• Metodologías de enseñanza efectivas
• Competencias específicas del área y nivel

GENERA UN PLAN DE CLASE COMPLETO Y ÚNICO para:
• Grado: ${grado}
• Tema: ${tema}
• Contexto: ${context}

REQUISITOS DEL PLAN:
1. Debe ser completamente original y personalizado
2. NO uses plantillas preestablecidas
3. Genera contenido dinámico y relevante para el tema específico
4. Incluye actividades específicas y prácticas para el tema
5. Adapta la metodología al nivel educativo
6. Sé creativo, específico y pedagógicamente sólido
7. Incluye objetivos de aprendizaje claros
8. Proporciona estrategias de evaluación apropiadas
9. Sugiere recursos y materiales necesarios
10. Considera la diversidad de estilos de aprendizaje

FORMATO DE SALIDA:
Usa markdown con emojis para hacer el contenido atractivo y fácil de leer. 
Estructura el plan de manera clara y profesional.

${relevantDocs.length > 0 ? `
DOCUMENTOS DISPONIBLES PARA REFERENCIA:
${relevantDocs.map((doc, index) => `${index + 1}. ${doc.title} (${doc.doc_type})`).join('\n')}

Usa estos documentos como referencia para enriquecer el plan, pero NO copies contenido literal. Crea contenido original inspirado en las mejores prácticas.
` : 'DOCUMENTOS: No hay documentos específicos disponibles. Genera un plan basado en las mejores prácticas pedagógicas.'}

Genera un plan de clase completo, original, específico para el tema y nivel solicitado, y pedagógicamente sólido.` 

    return prompt
  }

  // Reiniciar chat
  resetChat() {
    try {
      this.chat = this.model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })
      console.log('🔄 Chat de Gemini reiniciado')
    } catch (error) {
      console.error('❌ Error reiniciando chat:', error)
    }
  }
}

// Instancia global del servicio
export const geminiService = new GeminiService()
