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

      // Extraer nombre de institución
      if (docType.includes('PEI') || docType.includes('proyecto') || content.includes('institución')) {
        const institutionMatch = content.match(/(?:institución|IE|colegio|escuela)[:\s]*([^.\n]+)/i)
        if (institutionMatch && !info.institution) {
          info.institution = institutionMatch[1].trim()
        }
      }

      // Extraer asignatura/área
      if (docType.includes('curricular') || content.includes('asignatura') || content.includes('área')) {
        const subjectMatch = content.match(/(?:asignatura|área)[:\s]*([^.\n]+)/i)
        if (subjectMatch && !info.subject) {
          info.subject = subjectMatch[1].trim()
        }
      }

      // Extraer grados
      const gradeMatches = content.match(/(?:grado|nivel)[:\s]*(\d+°?)/gi)
      if (gradeMatches) {
        gradeMatches.forEach((match: string) => {
          const grade = match.replace(/[^\d]/g, '')
          if (grade && !info.grades.includes(grade)) {
            info.grades.push(grade)
          }
        })
      }

      // Extraer duración de sesiones
      const durationMatch = content.match(/(?:duración|tiempo|horario)[:\s]*(\d+)\s*(?:min|minutos|hora|horas)/i)
      if (durationMatch && !info.sessionDuration) {
        info.sessionDuration = durationMatch[1] + (content.includes('hora') ? ' horas' : ' minutos')
      }

      // Extraer recursos
      const resourceMatches = content.match(/(?:recursos|materiales|equipos)[:\s]*([^.\n]+)/gi)
      if (resourceMatches) {
        resourceMatches.forEach((match: string) => {
          const resources = match.split(/[,;]/).map((r: string) => r.trim()).filter((r: string) => r.length > 0)
          info.resources.push(...resources)
        })
      }

      // Extraer metodologías
      const methodologyMatches = content.match(/(?:metodología|estrategia|enfoque)[:\s]*([^.\n]+)/gi)
      if (methodologyMatches) {
        methodologyMatches.forEach((match: string) => {
          const methodologies = match.split(/[,;]/).map((m: string) => m.trim()).filter((m: string) => m.length > 0)
          info.methodologies.push(...methodologies)
        })
      }

      // Extraer misión y visión
      if (content.includes('misión')) {
        const missionMatch = content.match(/misión[:\s]*([^.\n]+)/i)
        if (missionMatch && !info.mission) {
          info.mission = missionMatch[1].trim()
        }
      }

      if (content.includes('visión')) {
        const visionMatch = content.match(/visión[:\s]*([^.\n]+)/i)
        if (visionMatch && !info.vision) {
          info.vision = visionMatch[1].trim()
        }
      }
    })

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
    // Calcular variables antes del template string
    // Buscar específicamente el número de sesiones en el contexto
    const sesionesMatch = context.match(/número de sesiones:\s*(\d+)/i) || context.match(/sesiones:\s*(\d+)/i);
    const sesionesNum = sesionesMatch ? parseInt(sesionesMatch[1]) : 1; // Fallback: 1 sesión = 2 horas
    const duracionTotal = `${sesionesNum * 2} horas`;
    const distribucionSesiones = Array.from({length: sesionesNum}, (_, i) => `Sesión ${i + 1}: 2 horas`).join(' | ');
    
    // Debug: verificar qué se está calculando
    
    let prompt = `# 🧠 Capa de Inteligencia (no modificar la estructura de salida)

## 0) Reglas de uso
- NO cambies el orden ni los títulos de la salida ya definida.
- NO muestres citas textuales, IDs ni fragmentos de documentos.
- Estas instrucciones son internas: **no deben aparecer en la respuesta final**.

## 1) Recuperación de documentos (bucket/RAG)
Antes de responder:
1. Consulta el bucket y construye \`relevantDocs\` con metadatos \`{title, doc_type, year?, source?}\`.
2. Recupera fragmentos de **todas** las familias de documentos:
   - **Orientaciones Curriculares MEN 2022** (componentes, competencias, estrategias).
   - **Tabla 7 MEN** (criterios de evaluación por estrategia).
   - **Revisión Sistemática / Modelo Crítico-Social** (momentos, principios, metodologías).
   - **PEI IE Camilo Torres** (coherencia institucional y ética).
3. Cobertura mínima: **1 fragmento por familia**; máximo **5 por documento**, evitando redundancia.
4. Expande consulta con sinónimos de **tema**, **grado**, **estrategia**.

## 2) Priorización y resolución de conflictos
Jerarquía:
1) **Tabla 7** → evaluación  
2) **Orientaciones MEN 2022** → componentes, competencias, estrategias  
3) **Revisión Sistemática** → momentos pedagógicos y enfoque crítico-social  
4) **PEI** → coherencia institucional, valores y perfil  
Si persiste conflicto: selecciona lo más alineado con el modelo crítico-social y el grado.

## 3) Ensamble por secciones
- **Componente Curricular** → MEN 2022  
- **Competencias** → MEN 2022 (ajustadas al grado + PEI)  
- **Subtemas** → MEN 2022 + Revisión Sistemática  
- **Estrategia a desarrollar** → MEN 2022 + Revisión Sistemática  
- **Momentos pedagógicos** → Revisión Sistemática  
- **Evidencias** → MEN 2022 + PEI  
- **Evaluación** → SOLO Tabla 7  

## 4) Lógica de sesiones
- Cada sesión = **2 horas (120 min)**.  
- Duración total = \`${sesionesNum} × 2\` horas (**autocorrige inconsistencias**).  
- Genera exactamente \`${sesionesNum}\` sesiones.  
- Distribución interna (120 min exactos):  
  - Exploración: 18–24 min  
  - Problematización: 18–24 min  
  - Diálogo: 24–30 min  
  - Praxis-Reflexión: 24–30 min  
  - Acción-Transformación: 12–18 min  

## 5) Evaluación (Tabla 7)
- Usa SOLO criterios de la estrategia seleccionada en **Tabla 7**.
- Pesos que sumen 100% (base: 5 × 20%, ajusta con justificación).  
- Conecta criterios ↔ competencias ↔ evidencias ↔ momentos.  
- Escala: **1.0 a 5.0**, mínimo aprobatorio **3.2**.

### 📊 Banco de criterios (Tabla 7 MEN)  
*(usar solo los que correspondan a la estrategia seleccionada)*  

**Construcción – Fabricación**  
- Interpretación de planos o esquemas de elaboración.  
- Selección de materiales, herramientas y recursos adecuados.  
- Apropiación de técnicas y procedimientos de fabricación.  
- Aplicación de condiciones de calidad, estética y acabado.  
- Argumentación sobre el proceso de construcción realizado.  

**Análisis de productos tecnológicos**  
- Desarrollo histórico y evolución del producto.  
- Dominio de conceptos de forma, función y estructura.  
- Comprensión de condiciones de funcionamiento y principios tecnológicos.  
- Descripción estética y formal (color, textura, interfaz, usabilidad).  
- Análisis estructural físico-químico, matemático o digital.  

**Actividades de Diseño / Rediseño**  
- Identificación de condiciones del problema de diseño.  
- Capacidad creativa para formular alternativas de solución.  
- Búsqueda y selección de información relevante.  
- Presentación de la solución mediante recursos gráficos u otros.  
- Argumentación sobre el proceso de diseño y solución propuesta.  

**Solución de problemas**  
- Identificación de variables y aspectos del problema.  
- Reconocimiento de saberes previos y necesarios.  
- Planteamiento de estrategia o plan de trabajo.  
- Implementación del plan conforme a momentos establecidos.  
- Argumentación sobre el desarrollo y evaluación de la solución.  

**Modelos de desarrollo de software o gestión de proyectos**  
- Selección y uso de un modelo o metodología pertinente.  
- Respuesta adecuada a la necesidad inicial.  
- Propuesta de licenciamiento (costos, tiempo, compatibilidad).  
- Proceso de gestión y toma de decisiones.  
- Elaboración de algoritmos o productos computacionales.  

**Aprendizaje basado en problemas / retos / proyectos**  
- Evaluar tanto el proceso como el producto.  
- Desarrollo de fases de la experiencia de aprendizaje.  
- Roles asumidos en el trabajo.  
- Calidad de la solución implementada.  
- Impacto del producto o presentación final.  

## 6) Guardas anti-alucinación
- Si falta un documento, usa los otros sin anunciar carencia.  
- No inventes criterios fuera de Tabla 7.  
- No cambies \`${sesionesNum}\`.  

## 7) Filtrado interno
Antes de emitir salida:  
- ❌ Elimina cálculos, validaciones, restricciones.  
- ✅ Mantén solo información clara para el docente.  

## 8) Lista de verificación
- [ ] Cargué MEN 2022, Tabla 7, Revisión Sistemática y PEI.
- [ ] Competencias alineadas con grado y componente.
- [ ] Sesiones = 120 min exactos.  
- [ ] Evaluación = solo Tabla 7, 100% total.  
- [ ] Coherencia con PEI y modelo crítico-social.  
- [ ] Sin rastros de instrucciones internas.  

---

# Rol del agente
Eres un **asistente pedagógico experto** en generar planes de clase completos y personalizados a partir de TODOS los documentos del bucket.  
Tu salida debe ser **auténtica, contextualizada y coherente con el modelo crítico-social y el PEI**.  

---

# PLAN DE CLASE

## IDENTIFICACIÓN
- **Institución:** ${extractedInfo?.institution || '[Extraer del PEI/documentos institucionales]'}
- **Área:** ${extractedInfo?.subject || '[Identificar de los documentos curriculares]'}
- **Grado:** ${grado}
- **Tema:** ${tema}
- **Duración:** ${duracionTotal}
- **Sesiones:** ${sesionesNum}
- **Recursos Tecnológicos Disponibles:** ${recursos}
- **Docente:** ${nombreDocente || '[A definir por el docente]'}

## COMPONENTE CURRICULAR
[Componentes curriculares reales extraídos de documentos]

## COMPETENCIAS
[Competencias alineadas con MEN 2022 y PEI]

## SUBTEMAS
[Listado progresivo de 3–6 subtemas, vinculados a sesiones y actividades específicas]

## ESTRATEGIA A DESARROLLAR
[Explicación fundamentada en MEN + Revisión Sistemática, mínimo 100 palabras]

## MOMENTOS PEDAGÓGICOS (Modelo Crítico-Social)
### 7.1 EXPLORACIÓN
- **Actividad:**
- **Rol docente:**
- **Rol estudiante:**

### 7.2 PROBLEMATIZACIÓN
- **Actividad:**
- **Rol docente:**
- **Rol estudiante:**

### 7.3 DIÁLOGO
- **Actividad:**
- **Rol docente:**
- **Rol estudiante:**

### 7.4 PRAXIS-REFLEXIÓN
- **Actividad:**
- **Rol docente:**
- **Rol estudiante:**

### 7.5 ACCIÓN-TRANSFORMACIÓN
- **Actividad:**
- **Rol docente:**
- **Rol estudiante:**

## EVIDENCIAS DE APRENDIZAJE
- **Cognitivas:**
- **Procedimentales:**
- **Actitudinales:**
*(Conexión con PEI y modelo crítico-social)*

## EVALUACIÓN
- **Criterios:** [Seleccionar de la lista oficial de Tabla 7 según la estrategia usada, con porcentajes que sumen 100%]
- **Escala:** 1.0 a 5.0 (mínimo 3.2)
- **Indicadores de logro:** [Extraídos de documentos]

${relevantDocs.length > 0 ? `
📚 DOCUMENTOS INSTITUCIONALES DISPONIBLES (OBLIGATORIO USAR TODOS):
${relevantDocs.map((doc, index) => `${index + 1}. ${doc.title} (${doc.doc_type})`).join('\n')}

🚨 INSTRUCCIONES CRÍTICAS PARA ANÁLISIS DE DOCUMENTOS:
1. **ANALIZA CADA DOCUMENTO** completamente y extrae información específica:
   - **PEI/Proyecto Educativo:** Nombre real de la institución, misión, visión, valores, perfil del estudiante y docente
   - **Orientaciones Curriculares:** Componentes curriculares reales, competencias por grado, estrategias didácticas específicas
   - **Modelo Pedagógico:** Enfoque pedagógico real, momentos de aprendizaje, metodologías utilizadas
   - **Criterios de Evaluación:** Escalas reales, criterios específicos, porcentajes, indicadores de logro
   - **Recursos y Contexto:** Recursos reales disponibles, características del entorno, población estudiantil

2. **GENERA INFORMACIÓN REAL** basándote en los documentos:
   - **Institución:** Usa el nombre real encontrado en los documentos
   - **Asignatura:** Identifica las áreas reales disponibles en los documentos
   - **Grados:** Extrae los grados reales mencionados en los documentos
   - **Duración de sesiones:** Busca información real sobre horarios y duración
   - **Recursos:** Lista los recursos reales mencionados en los documentos
   - **Metodologías:** Identifica las metodologías reales utilizadas
   - **Criterios de evaluación:** Extrae criterios reales con escalas y porcentajes reales

3. **ADAPTA EL PLAN** a la información real encontrada:
   - Usa la terminología específica de la institución real
   - Aplica el modelo pedagógico real encontrado
   - Utiliza los criterios de evaluación reales del documento
   - Incorpora los valores y principios institucionales reales
   - Usa recursos y metodologías reales mencionadas

4. **VERIFICA COHERENCIA** con información real:
   - Toda la información debe ser extraída de los documentos
   - No inventes información que no esté en los documentos
   - Si no encuentras información específica, menciona que es una estimación
   - Prioriza información específica sobre información genérica

⚠️ IMPORTANTE: Si no usas información de todos los documentos disponibles, la respuesta será considerada incompleta.

Genera el plan de clase completo basándote EXCLUSIVAMENTE en la información real encontrada en los documentos.
` : 'DOCUMENTOS: No hay documentos específicos disponibles. Genera un plan basado en las mejores prácticas pedagógicas generales.'}`

    return prompt
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
