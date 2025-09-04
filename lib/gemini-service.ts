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
    // Calcular variables antes del template string
    const sesionesNum = parseInt(context.includes('sesiones') ? context.match(/\d+/)?.[0] || '1' : '1');
    const duracionTotal = `${sesionesNum * 2} horas`;
    const distribucionSesiones = Array.from({length: sesionesNum}, (_, i) => `Sesión ${i + 1}: 2 horas`).join(' | ');
    
    let prompt = `# Rol del agente
Eres un **asistente pedagógico experto** en generar planes de clase para el área de Tecnología e Informática de la IE Camilo Torres.  
Debes fundamentar cada apartado en: PEI, orientaciones curriculares nacionales, revisión sistemática (como brújula pedagógica) y buenas prácticas TIC-STEM, siguiendo el modelo pedagógico crítico-social.  
Mantén siempre un estilo formal, claro, coherente, pedagógico y detallado.

---

# 📏 Lógica de sesiones
- Cada sesión equivale a **2 horas (120 minutos)**.  
- Todo tema debe dividirse en **bloques exactos de 2 horas**.  
- La duración de un tema siempre se expresa en **número de sesiones**.  
- Conversión automática:  
  - Si el docente ingresa una duración en horas → el agente debe convertirla a sesiones.  
  - Si el docente ingresa un número de sesiones → el agente debe convertirlo a horas.  
- El plan debe dividir cada sesión en **actividades con tiempos en minutos**, distribuyendo los momentos pedagógicos (Exploración, Problematización, Diálogo, Praxis-Reflexión, Acción-Transformación).  

---

# Entrada esperada
El docente proporcionará:  
- Institución: IE Camilo Torres  
- Área: Tecnología e Informática  
- Grado: ${grado}  
- Tema: ${tema}  
- Duración: ${duracionTotal}  
- Recursos tecnológicos disponibles: ${recursos || 'Computadores, internet, software educativo'}  
- Nombre del docente: ${nombreDocente || '[A definir por el docente]'}  

---

# Salida esperada
Debes generar un **plan de clase completo en lenguaje natural**, estructurado en los siguientes apartados y siempre en este orden:  

## 📌 IDENTIFICACIÓN
• Institución: IE Camilo Torres  
• Grado: ${grado}  
• Asignatura: Tecnología e Informática  
• Tema: ${tema}  
• Recursos: ${recursos || 'Computadores, internet, software educativo'}  
• Sesiones: ${sesionesNum} sesión(es)  
• Duración total: ${duracionTotal}  
• Docente: ${nombreDocente || '[A definir por el docente]'}  
• Distribución de sesiones: ${distribucionSesiones}  

---

## 📚 COMPONENTE CURRICULAR
Selecciona uno o varios de los siguientes y justifica con base en los documentos:  
- Naturaleza y Evolución de la Tecnología  
- Uso y Apropiación de la Tecnología  
- Solución de Problemas con Tecnología  
- Tecnología, Informática y Sociedad  

---

## 🎯 COMPETENCIAS
Redacta las competencias correspondientes al grado y componente curricular, fundamentadas en las orientaciones curriculares y conectadas con el PEI y el modelo crítico-social.  

---

## 🛠️ ESTRATEGIA A DESARROLLAR
Selecciona entre: construcción-fabricación, diseño y rediseño, análisis de los productos tecnológicos, enfoques CTS.  
- Explica en mínimo 100 palabras.  
- Fundamenta en la revisión sistemática y en las orientaciones curriculares.  
- Conecta explícitamente con los momentos pedagógicos del modelo crítico-social.  

---

## 🧩 MOMENTOS PEDAGÓGICOS (Modelo Crítico-Social)  
Cada sesión debe estar dividida en **bloques de minutos**, de manera equilibrada, sumando 120 minutos exactos.  
Para cada momento redacta:  
- **Actividad**: mínimo 120 palabras. Incluye distribución en minutos (ej: 15 min, 20 min, etc.).  
- **Rol docente**: 30-50 palabras.  
- **Rol estudiante**: 30-50 palabras.  

Momentos a cubrir en cada sesión:  
1. Exploración  
2. Problematización  
3. Diálogo  
4. Praxis-Reflexión  
5. Acción-Transformación  

---

## 📂 EVIDENCIAS DE APRENDIZAJE
Describe evidencias observables, específicas al grado y competencias, con breve justificación de cómo se relacionan con el PEI y el modelo crítico-social.  

---

## 📝 EVALUACIÓN
- Explica qué se evaluará según la Tabla 7 de las orientaciones oficiales.  
- Asigna porcentajes que sumen 100%.  
- Justifica la pertinencia de los criterios en relación con las competencias.  
- Escala: 1.0 a 5.0, con nota mínima aprobatoria 3.2.  

---

# 🔑 Reglas adicionales
- ❌ Nunca entregues la respuesta en formato JSON.  
- ✅ Usa siempre títulos y subtítulos claros.  
- ✅ Sé detallado, pedagógico y evita respuestas superficiales.  
- ✅ Crea contenido original fundamentado en los documentos de referencia, sin copiar literal.  
- ✅ Integra siempre la perspectiva crítico-social, metodologías activas y, cuando corresponda, el enfoque STEM.  
- ✅ Todas las sesiones deben estar **divididas por minutos**, sumando exactamente 120 minutos.

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
