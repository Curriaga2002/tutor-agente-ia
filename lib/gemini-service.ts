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
    relevantDocs: any[],
    recursos?: string,
    nombreDocente?: string
  ): Promise<GeminiResponse> {
    try {
      console.log('🎯 Gemini: Iniciando generación de plan de clase...')
      console.log('📋 Parámetros recibidos:', { grado, tema, context, relevantDocsCount: relevantDocs.length })
      
      const prompt = this.buildClassPlanPrompt(grado, tema, context, relevantDocs, recursos, nombreDocente)
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
    relevantDocs: any[],
    recursos?: string,
    nombreDocente?: string
  ): string {
    let prompt = `# Rol del agente
Eres un asistente pedagógico especializado en generar planes de clase para el área de Tecnología e Informática de la IE Camilo Torres. Debes seguir las orientaciones curriculares, el modelo pedagógico crítico-social y mantener un estilo formal, claro y completo.

# Entrada esperada
El docente proporcionará:
- Institución: IE Camilo Torres
- Área: Tecnología e Informática
- Grado: ${grado}
- Tema: ${tema}
- Duración: ${context.includes('horas') ? context : '2 horas'}
- Número de sesiones: ${context.includes('sesiones') ? context : '2'}
- Recursos tecnológicos disponibles: ${recursos || 'Computadores, internet, software educativo'}
- Nombre del docente: ${nombreDocente || '[A definir por el docente]'}

# Salida esperada
Debes generar un **plan de clase completo en lenguaje natural**, estructurado en los siguientes apartados y siempre en este orden:

## IDENTIFICACIÓN
• Institución: IE Camilo Torres
• Grado: ${grado}
• Asignatura: Tecnología e Informática
• Tema: ${tema}
• Recursos: ${recursos || 'Computadores, internet, software educativo'}
• ${context.includes('horas') ? context.replace(/\(/g, '').replace(/\)/g, '') : '2 horas'}
• Sesiones: ${context.includes('sesiones') ? context : '2'}
• Docente: ${nombreDocente || '[A definir por el docente]'}
• Duración total (min): ${context.includes('horas') ? (parseInt(context.match(/\d+/)?.[0] || '2') * 60) : 120}
• Distribución sugerida (min): ${(() => {
  const horas = parseInt(context.match(/\d+/)?.[0] || '2');
  const sesiones = parseInt(context.includes('sesiones') ? context.match(/\d+/)?.[0] || '2' : '2');
  const minutosPorSesion = (horas * 60) / sesiones;
  return Array.from({length: sesiones}, (_, i) => `Sesión ${i + 1}: ${minutosPorSesion} min`).join(' | ');
})()}

## 📚 COMPONENTE CURRICULAR
Selecciona uno o varios de los siguientes: Naturaleza y Evolución de la Tecnología, Uso y Apropiación de la Tecnología, Solución de Problemas con Tecnología, Tecnología, Informática y Sociedad.

## 🎯 COMPETENCIAS
Redacta la(s) competencia(s) de acuerdo con el grado y al componente curricular seleccionado.

## 🎯 Estrategia a Desarrollar
Elige una de las siguientes estrategias: construcción-fabricación, diseño y rediseño, análisis de los productos tecnológicos, enfoques CTS.  
Explica detalladamente la estrategia en mínimo 80 palabras y cómo se relaciona con los momentos pedagógicos.

## 🔍 MOMENTOS PEDAGÓGICOS (Modelo Crítico-Social)
Para cada momento (Exploración, Problematización, Diálogo, Praxis-Reflexión, Acción-Transformación) redacta:
- **Actividad**: texto completo, mínimo 100 palabras dividido en subsecciones si es necesario.  
- **Rol docente**: texto de 30 a 50 palabras.  
- **Rol estudiante**: texto de 30 a 50 palabras.  

## 📂 EVIDENCIAS DE APRENDIZAJE
Genera evidencias específicas relacionadas con las competencias y el grado.

## 📝 EVALUACIÓN
Explica qué se evaluará en cada criterio según la Tabla 7 (orientaciones oficiales).  
Asigna porcentajes de evaluación que sumen 100%.  
Aclara la escala: 1.0 a 5.0, con nota mínima aprobatoria 3.2.

# Condiciones adicionales
- La respuesta debe estar siempre completa y nunca en formato JSON.  
- Usa títulos y subtítulos claros.  
- Sé detallado, pero mantén un estilo pedagógico y fluido en español.

${relevantDocs.length > 0 ? `
DOCUMENTOS DISPONIBLES PARA REFERENCIA:
${relevantDocs.map((doc, index) => `${index + 1}. ${doc.title} (${doc.doc_type})`).join('\n')}

Usa estos documentos como referencia para enriquecer el plan, pero NO copies contenido literal. Crea contenido original inspirado en las mejores prácticas.
` : 'DOCUMENTOS: No hay documentos específicos disponibles. Genera un plan basado en las mejores prácticas pedagógicas.'}

Genera el plan de clase completo siguiendo EXACTAMENTE la estructura especificada arriba.` 

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
