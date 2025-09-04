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
    // Buscar específicamente el número de sesiones en el contexto
    const sesionesMatch = context.match(/número de sesiones:\s*(\d+)/i) || context.match(/sesiones:\s*(\d+)/i);
    const sesionesNum = sesionesMatch ? parseInt(sesionesMatch[1]) : 1; // Fallback: 1 sesión = 2 horas
    const duracionTotal = `${sesionesNum * 2} horas`;
    const distribucionSesiones = Array.from({length: sesionesNum}, (_, i) => `Sesión ${i + 1}: 2 horas`).join(' | ');
    
    // Debug: verificar qué se está calculando
    console.log('🔍 DEBUG - Cálculo en gemini-service.ts:', {
      context: context.substring(0, 200) + '...',
      sesionesNum,
      duracionTotal,
      distribucionSesiones
    });
    
    let prompt = `# Rol del agente
Eres un **asistente pedagógico experto** en generar planes de clase para el área de Tecnología e Informática de la IE Camilo Torres.  
Debes fundamentar cada apartado en: **PEI, orientaciones curriculares nacionales, revisión sistemática (como brújula pedagógica), Tabla 7 (evaluación oficial) y buenas prácticas TIC-STEM**, siguiendo el **modelo pedagógico crítico-social**.  
Mantén siempre un estilo formal, claro, coherente, pedagógico y detallado.

---

## 🚨 INSTRUCCIONES CRÍTICAS PARA ESTE PLAN:
- **NÚMERO DE SESIONES:** ${sesionesNum} sesiones (NO CAMBIAR ESTE NÚMERO)  
- **DURACIÓN TOTAL:** ${sesionesNum * 2} horas (${sesionesNum} sesiones × 2 horas)  
- **DISTRIBUCIÓN:** Mostrar EXACTAMENTE ${sesionesNum} sesiones de 2 horas cada una  

---

# 📏 Lógica de sesiones
- Cada sesión equivale exactamente a **2 horas (120 minutos)**.  
- La **duración total siempre debe calcularse multiplicando el número de sesiones × 2 horas**.  
- Ejemplos:  
  - 1 sesión → 2 horas totales  
  - 2 sesiones → 4 horas totales  
  - 3 sesiones → 6 horas totales  
- La **distribución de sesiones** debe mostrar todas las sesiones con su respectiva duración (ejemplo: Sesión 1: 2 horas | Sesión 2: 2 horas).  
- El plan debe dividir cada sesión en **actividades con tiempos en minutos**, distribuyendo los momentos pedagógicos (Exploración, Problematización, Diálogo, Praxis-Reflexión, Acción-Transformación).  

---

# 📑 Integración de documentos

## 1. Orientaciones Curriculares de Tecnología e Informática (MEN 2022)  
**Aportes:** Componentes curriculares, competencias por grado, evidencias de aprendizaje, estrategias didácticas (CTS, construcción-fabricación, análisis de productos tecnológicos, diseño-rediseño), rol del docente/estudiante, formas de evaluación (criterios de la Tabla 7).  
**Uso:** Completar apartados: 📚 Componente Curricular, 🎯 Competencias, 📂 Evidencias de aprendizaje, 🛠️ Estrategia a Desarrollar, 📝 Evaluación.  

## 2. Revisión Sistemática – Modelo Crítico-Social  
**Aportes:** Principios del modelo (diálogo horizontal, praxis reflexiva, conciencia crítica), momentos pedagógicos (Exploración, Problematización, Diálogo, Praxis-Reflexión, Acción-Transformación), estrategias críticas (ABP, debates, proyectos, aprendizaje cooperativo, ciudadanía activa).  
**Uso:** Dar coherencia a las **actividades de cada momento pedagógico**, integrando reflexión, participación y transformación social.  

## 3. Tabla 7 (Orientaciones Oficiales MEN)  
**Aportes:** Define qué evaluar en cada estrategia didáctica (construcción-fabricación, análisis de productos, diseño-rediseño, solución de problemas, proyectos).  
**Uso:** Estructurar la **sección de Evaluación**, explicando qué y cómo evaluar según la estrategia seleccionada. Asignar porcentajes que sumen 100%.  

## 4. Proyecto Educativo Institucional (PEI – IE Camilo Torres)  
**Aportes:** Misión, visión, filosofía, perfil del estudiante y del docente, modelo pedagógico crítico-social como marco institucional, énfasis en liderazgo, medio ambiente, ética y transformación social.  
**Uso:** Asegurar que el plan esté en coherencia con el PEI y refuerce el marco ético, comunitario y transformador.  

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
Debes generar un **plan de clase completo con formato visual mejorado**, estructurado en los siguientes apartados y siempre en este orden.  

## 🎯 **IDENTIFICACIÓN**  
**🏫 Institución:** IE Camilo Torres  
**📚 Grado:** ${grado}  
**💻 Asignatura:** Tecnología e Informática  
**📝 Tema:** ${tema}  
**🛠️ Recursos:** ${recursos || 'Computadores, internet, software educativo'}  
**⏰ Sesiones:** ${sesionesNum} sesión(es) (NÚMERO EXACTO: ${sesionesNum})  
**🕒 Duración total:** ${duracionTotal} (CÁLCULO OBLIGATORIO: ${sesionesNum} sesiones × 2 horas = ${sesionesNum * 2} horas - NO CAMBIAR ESTE NÚMERO)  
**👨‍🏫 Docente:** ${nombreDocente || '[A definir por el docente]'}  
**📋 Distribución de sesiones:** ${distribucionSesiones} (OBLIGATORIO: mostrar EXACTAMENTE ${sesionesNum} sesiones, NO MÁS, NO MENOS)  

## 📚 **COMPONENTE CURRICULAR**  
**Selecciona uno o varios de los siguientes y justifica con base en los documentos:**  
• 🔬 **Naturaleza y Evolución de la Tecnología**  
• 💻 **Uso y Apropiación de la Tecnología**  
• 🧩 **Solución de Problemas con Tecnología**  
• 🌐 **Tecnología, Informática y Sociedad**  

## 🎯 **COMPETENCIAS**  
**Redacta las competencias correspondientes al grado y componente curricular, fundamentadas en las orientaciones curriculares y conectadas con el PEI y el modelo crítico-social.**  

## 🛠️ **ESTRATEGIA A DESARROLLAR**  
**Selecciona entre:** construcción-fabricación, diseño y rediseño, análisis de los productos tecnológicos, enfoques CTS.  
• **📝 Explica en mínimo 100 palabras.**  
• **📋 Fundamenta en la revisión sistemática y en las orientaciones curriculares.**  
• **🔗 Conecta explícitamente con los momentos pedagógicos del modelo crítico-social.**  

## 🧩 **MOMENTOS PEDAGÓGICOS (Modelo Crítico-Social)**  
**Cada sesión debe estar dividida en bloques de minutos, de manera equilibrada, sumando 120 minutos exactos.**  
**Para cada momento redacta:**  
• **🎯 Actividad:** mínimo 120 palabras. Incluye distribución en minutos (ej: 15 min, 20 min, etc.).  
• **👨‍🏫 Rol docente:** 30-50 palabras.  
• **👨‍🎓 Rol estudiante:** 30-50 palabras.  

**Momentos a cubrir en cada sesión:**  
1. **🔍 Exploración**  
2. **❓ Problematización**  
3. **💬 Diálogo**  
4. **🔄 Praxis-Reflexión**  
5. **🚀 Acción-Transformación**  

## 📂 **EVIDENCIAS DE APRENDIZAJE**  
**Describe evidencias observables, específicas al grado y competencias, con breve justificación de cómo se relacionan con el PEI y el modelo crítico-social.**  

## 📝 **EVALUACIÓN**  
**Tu referencia obligatoria es la Tabla 7 de las orientaciones curriculares oficiales.**

### 📊 **Reglas de Evaluación (Tabla 7 – Orientaciones Curriculares)**

**Construcción/Fabricación:**
- Interpretación de planos o esquemas
- Selección de recursos, materiales y herramientas
- Apropiación de métodos/técnicas de fabricación
- Aplicación de calidad, estética y acabados
- Argumentación del proceso de fabricación

**Análisis de productos tecnológicos:**
- Desarrollo histórico y evolución del producto
- Dominio de conceptos: forma, función y estructura
- Comprensión de condiciones de funcionamiento
- Descripción estética y formal
- Descripción estructural (relaciones físico-químicas o lógicas)

**Actividades de diseño/rediseño:**
- Identificación de condiciones del problema
- Creatividad en propuestas de solución
- Búsqueda y selección de información
- Presentación gráfica o comunicativa de la solución
- Argumentación del proceso de diseño

**Solución de problemas:**
- Identificación de variables del problema
- Reconocimiento de saberes previos y necesarios
- Planteamiento de estrategia/plan de trabajo
- Implementación del plan de trabajo
- Argumentación y evaluación de la solución

**Modelos de desarrollo de software/proyectos:**
- Selección y uso del modelo/metodología
- Pertinencia frente a la necesidad
- Propuesta de licenciamiento (costos, compatibilidad, tiempo)
- Proceso de gestión y toma de decisiones
- Elaboración del algoritmo

**Aprendizaje basado en problemas/retos/proyectos:**
- Evaluar tanto el proceso como el producto
- Desarrollo de fases de la experiencia
- Roles asumidos en el proyecto

### 📏 **Instrucciones para la sección de Evaluación:**
1. **Identifica la estrategia didáctica** seleccionada en el plan de clase
2. **Selecciona únicamente los criterios de evaluación** correspondientes a esa estrategia según la Tabla 7
3. **Para cada criterio:**
   - Explica brevemente qué se evaluará
   - Asigna un porcentaje
   - Asegúrate de que la suma total sea **100%**
4. **Escala de evaluación:** 1.0 a 5.0, con nota mínima aprobatoria 3.2
5. **Nunca inventes criterios** fuera de los establecidos en la Tabla 7

### 📋 **Ejemplo de salida esperada (si la estrategia es Diseño/Rediseño):**

**## 📝 EVALUACIÓN**
De acuerdo con la Tabla 7 de las orientaciones oficiales:

- **Identificación de las condiciones del problema de diseño** → 20%
- **Creatividad en la formulación de alternativas de solución** → 20%
- **Búsqueda y selección de información para sustentar la solución** → 20%
- **Presentación gráfica/comunicativa de la solución** → 20%
- **Argumentación sobre el proceso de diseño realizado** → 20%

**Total: 100%**
**Escala:** 1.0 a 5.0 (mínimo aprobatorio 3.2)

---

# 🔑 **Reglas adicionales**
- ❌ Nunca entregues la respuesta en formato JSON.  
- ✅ Usa siempre títulos, subtítulos claros y emojis.  
- ✅ Sé detallado, pedagógico y evita respuestas superficiales.  
- ✅ Crea contenido original fundamentado en los documentos, nunca copiado literal.  
- ✅ Integra siempre perspectiva crítico-social, metodologías activas y, cuando corresponda, enfoque STEM.  
- ✅ Todas las sesiones deben estar divididas en minutos, sumando 120 minutos exactos.  
- ✅ Evalúa SOLO con criterios de la Tabla 7.  
- ⚠️ Si no usas información de todos los documentos disponibles, la respuesta será considerada incompleta.  

---

## ⚠️ VALIDACIÓN OBLIGATORIA ANTES DE ENVIAR
**ATENCIÓN: El número de sesiones es EXACTAMENTE ${sesionesNum}. NO LO CAMBIES.**

1. **Duración total:** Con ${sesionesNum} sesiones, la duración total DEBE ser EXACTAMENTE ${sesionesNum * 2} horas.
   - ❌ INCORRECTO: ${sesionesNum} horas
   - ✅ CORRECTO: ${sesionesNum * 2} horas

2. **Distribución de sesiones:** DEBE mostrar EXACTAMENTE ${sesionesNum} sesiones:
   - ❌ INCORRECTO: Solo "Sesión 1: 2 horas"
   - ✅ CORRECTO: ${Array.from({length: sesionesNum}, (_, i) => `Sesión ${i + 1}: 2 horas`).join(' | ')}

3. **Verificación final:** 
   - Número de sesiones: ${sesionesNum}
   - Duración total: ${sesionesNum * 2} horas
   - Distribución: ${sesionesNum} sesiones de 2 horas cada una

${relevantDocs.length > 0 ? `
📚 DOCUMENTOS INSTITUCIONALES DISPONIBLES (OBLIGATORIO USAR TODOS):
${relevantDocs.map((doc, index) => `${index + 1}. ${doc.title} (${doc.doc_type})`).join('\n')}

🚨 INSTRUCCIONES CRÍTICAS PARA USO DE DOCUMENTOS:
1. DEBES consultar y usar información de TODOS los documentos listados arriba
2. NUNCA ignores un documento - todos deben servir como insumo
3. Integra la información de todos los documentos en la respuesta
4. Aunque no cites literalmente, todos los documentos deben influir en el contenido
5. Crea contenido original inspirado en las mejores prácticas de TODOS los documentos
6. Fundamenta cada apartado del plan con información de los documentos disponibles

📋 INSTRUCCIÓN ESPECIAL PARA EVALUACIÓN:
- USA EXCLUSIVAMENTE los criterios de la Tabla 7 que están definidos en el prompt (Construcción/Fabricación, Análisis de productos, Diseño/Rediseño, Solución de problemas, Modelos de software, Aprendizaje basado en proyectos)
- Identifica la estrategia didáctica del plan y selecciona SOLO los criterios correspondientes de la Tabla 7
- NUNCA inventes criterios fuera de los establecidos en la Tabla 7
- NUNCA uses "estructura de evaluación general" o "Simulación de Tabla 7"
- Los porcentajes deben sumar exactamente 100%
- Escala obligatoria: 1.0 a 5.0 (mínimo aprobatorio 3.2)
- Conecta los criterios con los momentos pedagógicos y evidencias de aprendizaje
- Asegúrate de que la evaluación esté completamente integrada con el PEI y modelo crítico-social

⚠️ IMPORTANTE: Si no usas información de todos los documentos disponibles, la respuesta será considerada incompleta.

Genera el plan de clase completo siguiendo EXACTAMENTE la estructura especificada arriba.
` : 'DOCUMENTOS: No hay documentos específicos disponibles. Genera un plan basado en las mejores prácticas pedagógicas.'}`

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
