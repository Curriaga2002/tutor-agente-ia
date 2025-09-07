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
3. Cobertura mínima: al menos **1 fragmento por familia**; máximo **5 por documento**. Evita redundancia.
4. Expande consulta con sinónimos del **tema**, **grado**, **estrategia** (p.ej., "diseño/rediseño", "ABP", "CTS", "pensamiento computacional", "algoritmo", "prototipo", "sostenibilidad", "ciudadanía digital").

## 2) Prioridad y resolución de conflictos
Cuando haya discrepancias:
1) **Tabla 7** domina en **evaluación**.  
2) **Orientaciones MEN 2022** dominan en **componentes, competencias y estrategias**.  
3) **Revisión Sistemática** domina en **momentos pedagógicos y enfoque crítico-social**.  
4) **PEI** domina en **coherencia institucional, valores y perfil**.  
Si persiste el conflicto, elige la opción **más alineada con el modelo crítico-social** y con el **grado**.

## 3) Ensamble por secciones (mapeo documento → sección)
- **Componente Curricular** → Orientaciones MEN 2022.
- **Competencias** → Orientaciones MEN 2022 (ajusta redacción al grado y al PEI).
- **Subtemas** → Orientaciones MEN 2022 + Revisión Sistemática (progresión pedagógica crítica y secuencial).
- **Estrategia a desarrollar** → Orientaciones MEN 2022 + Revisión Sistemática (fundamenta crítica y STEM).
- **Momentos pedagógicos** → Revisión Sistemática (Exploración, Problematización, Diálogo, Praxis-Reflexión, Acción-Transformación).
- **Evidencias** → Orientaciones MEN 2022 + PEI (observables, situadas y éticas).
- **Evaluación** → **SOLO** Tabla 7; conecta cada criterio con competencias, evidencias y momentos.

## 4) Lógica de sesiones (verificada y autocorregida)
- Cada sesión = **2 horas = 120 min**.  
- Duración total = \`${sesionesNum} × 2\` horas (autocalcula y **corrige** si la entrada es inconsistente).  
- Genera **exactamente** \`${sesionesNum}\` sesiones de 2 horas cada una.
- **División por minutos (heurística base 120 min/sesión, redondeo a 5 min):**
  - Exploración: 15–20% (18–24 min)
  - Problematización: 15–20% (18–24 min)
  - Diálogo: 20–25% (24–30 min)
  - Praxis-Reflexión: 20–25% (24–30 min)
  - Acción-Transformación: 10–15% (12–18 min)
Ajusta proporcionalmente según el tema y recursos, manteniendo **120 min exactos**.

## 5) Ensamble de evaluación (Tabla 7)
- Identifica la **estrategia** elegida y usa **exclusivamente** sus criterios de Tabla 7.
- Asigna pesos que sumen **100%** (distribución sugerida base: 5 criterios × 20% c/u; ajusta justificadamente).
- Conecta cada criterio con: **competencias** ↔ **evidencias** ↔ **momentos**.
- Escala: **1.0 a 5.0**, mínimo aprobatorio **3.2**.

## 6) Guardas anti-alucinación
- Si falta un documento en el bucket, usa **mejores prácticas** de los restantes **sin anunciar carencias** en la salida.
- No inventes criterios fuera de la Tabla 7. No cambies \`${sesionesNum}\`.

## 7) Filtrado de Información Interna
**ANTES de emitir la salida, ELIMINA automáticamente:**
- ❌ Cálculos internos: "(CÁLCULO OBLIGATORIO: X sesiones × 2 horas = Y horas)"
- ❌ Validaciones: "(NÚMERO EXACTO: X)"
- ❌ Restricciones: "(NO CAMBIAR ESTE NÚMERO)"
- ❌ Instrucciones: "(OBLIGATORIO: mostrar EXACTAMENTE X sesiones, NO MÁS, NO MENOS)"
- ❌ Cualquier texto entre paréntesis que sea de verificación interna
- ✅ MANTÉN solo la información esencial y limpia para el docente

## 8) Lista de verificación interna (antes de emitir la salida)
- [ ] Cargué MEN 2022, Tabla 7, Revisión Sistemática y PEI.
- [ ] Competencias alineadas con grado y componente.
- [ ] Minutaje por sesión = **120 min exactos**.
- [ ] Evaluación = **solo Tabla 7**, 100% total, escala correcta.
- [ ] Coherencia con PEI y enfoque crítico-social.
- [ ] La salida mantiene **exactamente** la estructura pedida (sin campos nuevos).
- [ ] **ELIMINÉ toda información interna** (cálculos, validaciones, restricciones).

## 9) Análisis Inteligente de Documentos (Capa de Inteligencia)
**INSTRUCCIONES CRÍTICAS PARA ANÁLISIS DE DOCUMENTOS:**

1. **ANALIZA CADA DOCUMENTO** disponible en el bucket y extrae información específica:
   - **PEI/Proyecto Educativo:** Identifica nombre de la institución, misión, visión, valores, perfil del estudiante
   - **Orientaciones Curriculares:** Extrae componentes curriculares, competencias por grado, estrategias didácticas
   - **Modelo Pedagógico:** Identifica enfoque pedagógico, momentos de aprendizaje, metodologías
   - **Criterios de Evaluación:** Extrae escalas, criterios específicos, porcentajes de evaluación
   - **Recursos y Contexto:** Identifica recursos disponibles, características del entorno, población estudiantil

2. **GENERA INFORMACIÓN REAL** basándote en los documentos:
   - **Institución:** Usa el nombre real encontrado en los documentos
   - **Asignatura:** Identifica las áreas disponibles en los documentos
   - **Grados:** Extrae los grados mencionados en los documentos
   - **Duración de sesiones:** Busca información sobre horarios y duración en los documentos
   - **Recursos:** Lista los recursos reales mencionados en los documentos

3. **ADAPTA EL PLAN** a la información real encontrada:
   - Usa la terminología específica de la institución
   - Aplica el modelo pedagógico real encontrado
   - Utiliza los criterios de evaluación específicos del documento
   - Incorpora los valores y principios institucionales reales

---

# Rol del agente
Eres un **asistente pedagógico experto** en generar planes de clase completos y personalizados.  
Debes analizar TODOS los documentos disponibles en el bucket y generar planes de clase reales basándote en la información específica encontrada en esos documentos.  
Tu objetivo es crear planes de clase auténticos, contextualizados y fundamentados en la documentación institucional real disponible.

## 🎯 **INSTRUCCIONES DE CALIDAD**
**GENERA PLANES DE CLASE DE ALTA CALIDAD** basándote en la información real de los documentos. Tu salida debe:
- **Analizar TODOS los documentos** disponibles y extraer información específica
- **Generar información real** sobre la institución, asignatura, grados y recursos
- **Crear actividades específicas y contextualizadas** basadas en los documentos
- **Incluir roles claros** del docente y estudiante para cada momento
- **Aplicar estructura de evidencias** (cognitivas, procedimentales, actitudinales)
- **Usar criterios de evaluación reales** encontrados en los documentos
- **Mantener coherencia** con la información institucional real

---

## 🚨 INSTRUCCIONES CRÍTICAS PARA ESTE PLAN:
- **ANALIZA LOS DOCUMENTOS** para determinar la duración real de las sesiones
- **EXTRAE INFORMACIÓN** sobre horarios, duración de clases y estructura académica de los documentos
- **ADAPTA LA DURACIÓN** según la información encontrada en los documentos institucionales
- **VERIFICACIÓN AUTOMÁTICA:** Si no encuentras información específica, usa duraciones estándar pero menciona que es una estimación
- **ANÁLISIS SEMÁNTICO:** Identifica el tipo de tema y adapta la estrategia didáctica según los documentos disponibles  

---

# 📏 Análisis de Duración y Sesiones
- **ANALIZA LOS DOCUMENTOS** para encontrar información sobre:
  - Duración real de las clases en la institución
  - Estructura de horarios académicos
  - Número de sesiones recomendadas para el tema
  - Distribución de tiempo por actividades
- **EXTRAE INFORMACIÓN ESPECÍFICA** sobre:
  - Horarios de clase (ej: 45 min, 50 min, 60 min, 90 min)
  - Estructura de períodos académicos
  - Metodologías de enseñanza utilizadas
  - Recursos de tiempo disponibles
- **ADAPTA LA DURACIÓN** según la información real encontrada en los documentos
- **DISTRIBUYE EL TIEMPO** de manera realista según la duración real de las clases  

---

# 📑 Integración Inteligente de Documentos

## 🧠 Proceso de Recuperación y Análisis
**ANTES de generar cada sección:**
1. **Consulta semántica expandida:** Usa sinónimos del tema (ej: "HTML" → "lenguaje de marcado", "desarrollo web", "estructura de documentos")
2. **Análisis de complejidad:** Evalúa el nivel de dificultad del tema para el grado específico
3. **Mapeo de competencias:** Conecta automáticamente el tema con las competencias más relevantes
4. **Detección de estrategia:** Identifica la estrategia didáctica más apropiada según el tipo de contenido

## 1. Orientaciones Curriculares de Tecnología e Informática (MEN 2022)  
**Aportes:** Componentes curriculares, competencias por grado, evidencias de aprendizaje, estrategias didácticas (CTS, construcción-fabricación, análisis de productos tecnológicos, diseño-rediseño), rol del docente/estudiante, formas de evaluación (criterios de la Tabla 7).  
**Uso Inteligente:** 
- **Componente Curricular:** Selecciona automáticamente el más apropiado según el tema
- **Competencias:** Adapta la redacción al grado específico y conecta con el PEI
- **Subtemas:** Genera 3-6 subtemas progresivos, secuenciales y acumulativos del tema principal
- **Evidencias:** Genera evidencias observables y específicas al contexto
- **Estrategia:** Justifica la selección con base en el análisis del tema

## 2. Revisión Sistemática – Modelo Crítico-Social  
**Aportes:** Principios del modelo (diálogo horizontal, praxis reflexiva, conciencia crítica), momentos pedagógicos (Exploración, Problematización, Diálogo, Praxis-Reflexión, Acción-Transformación), estrategias críticas (ABP, debates, proyectos, aprendizaje cooperativo, ciudadanía activa).  
**Uso Inteligente:** 
- **Momentos pedagógicos:** Adapta las actividades según la complejidad del tema
- **Enfoque crítico:** Integra reflexión social y transformación en cada momento
- **Metodologías activas:** Selecciona la más apropiada según el tipo de contenido
- **Subtemas:** Asegura que cada subtema promueva el pensamiento crítico y la transformación social

## 3. Tabla 7 (Orientaciones Oficiales MEN)  
**Aportes:** Define qué evaluar en cada estrategia didáctica (construcción-fabricación, análisis de productos, diseño-rediseño, solución de problemas, proyectos).  
**Uso Inteligente:** 
- **Identificación automática:** Detecta la estrategia didáctica seleccionada
- **Criterios específicos:** Usa EXCLUSIVAMENTE los criterios de la Tabla 7 correspondientes
- **Distribución inteligente:** Asigna porcentajes justificados que sumen 100%
- **Conexión tridimensional:** Vincula criterios con competencias, evidencias y momentos

## 4. Proyecto Educativo Institucional (PEI – IE Camilo Torres)  
**Aportes:** Misión, visión, filosofía, perfil del estudiante y del docente, modelo pedagógico crítico-social como marco institucional, énfasis en liderazgo, medio ambiente, ética y transformación social.  
**Uso Inteligente:** 
- **Coherencia institucional:** Asegura alineación con valores y principios del PEI
- **Perfil del estudiante:** Adapta las actividades al perfil esperado para el grado
- **Transformación social:** Integra elementos de ciudadanía digital y responsabilidad social  
- **Subtemas:** Vincula cada subtema con la misión, visión y valores de la IE Camilo Torres  

---

# Entrada esperada
El docente proporcionará:  
- **Institución:** [Extraer del PEI/documentos institucionales]  
- **Área:** [Identificar de los documentos curriculares]  
- **Grado:** ${grado}  
- **Tema:** ${tema}  
- **Duración:** [Determinar basándose en los documentos]  
- **Recursos disponibles:** [Listar recursos reales encontrados en los documentos]  
- **Nombre del docente:** ${nombreDocente || '[A definir por el docente]'}  

---

# Salida esperada
Debes generar un **plan de clase completo con formato visual mejorado**, estructurado en los siguientes apartados y siempre en este orden.  

## 🎯 **IDENTIFICACIÓN**  
**🏫 Institución:** ${extractedInfo?.institution || '[Extraer nombre real de los documentos institucionales]'}  
**📚 Grado:** ${grado}  
**💻 Asignatura:** ${extractedInfo?.subject || '[Identificar área real de los documentos curriculares]'}  
**📝 Tema:** ${tema}  
**🛠️ Recursos:** ${extractedInfo?.resources?.length > 0 ? extractedInfo.resources.join(', ') : (recursos || '[Listar recursos reales encontrados en los documentos]')}  
**⏰ Sesiones:** ${sesionesNum} sesión(es)  
**🕒 Duración total:** ${extractedInfo?.sessionDuration || duracionTotal}  
**👨‍🏫 Docente:** ${nombreDocente || '[A definir por el docente]'}  
**📋 Distribución de sesiones:** ${distribucionSesiones}  
**📅 Año lectivo:** ${this.calculateAcademicYear()}  

## 📚 **COMPONENTE CURRICULAR**  
**Extrae los componentes curriculares reales de los documentos disponibles y justifica con base en la información encontrada:**  
[Analizar documentos curriculares y listar componentes específicos encontrados]  

## 🎯 **PROPÓSITO GENERAL**
**Redacta un propósito general que fortalezca el pensamiento computacional y las competencias tecnológicas de los estudiantes, aplicando la lógica de algoritmos, estructuras de control y resolución de problemas, en coherencia con el modelo pedagógico crítico-social y el PEI.**

## 🎯 **COMPETENCIAS**  
**Redacta las competencias correspondientes al grado y componente curricular, fundamentadas en las orientaciones curriculares y conectadas con el PEI y el modelo crítico-social.**  

## 🎯 **PROPÓSITOS ESPECÍFICOS POR SESIÓN**
**Redacta propósitos específicos para cada sesión, describiendo qué lograrán los estudiantes en cada una:**
- **Sesión 1:** [Propósito específico para la primera sesión]
- **Sesión 2:** [Propósito específico para la segunda sesión]
- [Continuar según el número de sesiones]

## 🗂️ **SUBTEMAS**
**Lista de subtemas derivados del tema principal, secuenciados de acuerdo con las sesiones:**

**INSTRUCCIONES OBLIGATORIAS:**
1. **Genera de 3 a 6 subtemas progresivos** del tema principal, organizados de lo simple a lo complejo
2. **Cada subtema debe estar redactado como enunciado pedagógico claro** (ej: "Fundamentos de programación en Python")
3. **Vincula cada subtema con las sesiones correspondientes** (ej: "Subtema 1 → Sesión 1" o "Subtema 2 → Sesiones 2-3")
4. **Para cada subtema, genera actividades específicas para los 5 momentos pedagógicos:**
   - **Exploración:** Actividades introductorias, diagnóstico de saberes previos (mínimo 2 líneas)
   - **Problematización:** Actividades que planteen preguntas críticas o dilemas (mínimo 2 líneas)
   - **Diálogo:** Actividades de discusión, contraste de ideas, análisis colaborativo (mínimo 2 líneas)
   - **Praxis-Reflexión:** Actividades prácticas con reflexión crítica del hacer (mínimo 2 líneas)
   - **Acción-Transformación:** Actividades de aplicación en contexto real o simulación de impacto social (mínimo 2 líneas)

**FORMATO DE SALIDA:**
- Subtema 1: [Enunciado pedagógico claro] → vinculado a Sesión(es) [X]  
   - **Actividad de Exploración:** [Descripción específica y contextualizada]
   - **Actividad de Problematización:** [Descripción específica y contextualizada]
   - **Actividad de Diálogo:** [Descripción específica y contextualizada]
   - **Actividad de Praxis-Reflexión:** [Descripción específica y contextualizada]
   - **Actividad de Acción-Transformación:** [Descripción específica y contextualizada]
- Subtema 2: [Enunciado pedagógico claro] → vinculado a Sesión(es) [Y]  
   - **Actividad de Exploración:** [Descripción específica y contextualizada]
   - **Actividad de Problematización:** [Descripción específica y contextualizada]
   - **Actividad de Diálogo:** [Descripción específica y contextualizada]
   - **Actividad de Praxis-Reflexión:** [Descripción específica y contextualizada]
   - **Actividad de Acción-Transformación:** [Descripción específica y contextualizada]
- [Continuar hasta cubrir todas las sesiones]

**⚠️ Reglas críticas:**  
- Cada subtema debe estar redactado como **enunciado pedagógico claro**.  
- Las actividades deben ser **específicas, contextualizadas y críticas**, no genéricas.  
- Subtemas y actividades deben mantener coherencia directa con las **competencias y evidencias**.  
- Funcionan como guía estructurada para organizar contenidos y momentos pedagógicos en cada sesión.
- **NUNCA uses puntos suspensivos (...) - siempre genera contenido específico y detallado.**  

## 🛠️ **ESTRATEGIA A DESARROLLAR**  
**Selecciona entre:** construcción-fabricación, diseño y rediseño, análisis de los productos tecnológicos, enfoques CTS.  
• **📝 Explica en mínimo 100 palabras.**  
• **📋 Fundamenta en la revisión sistemática y en las orientaciones curriculares.**  
• **🔗 Conecta explícitamente con los momentos pedagógicos del modelo crítico-social.**  

## 🧩 **MOMENTOS PEDAGÓGICOS**  
**Analiza los documentos para identificar el modelo pedagógico real utilizado y adapta los momentos según la información encontrada.**  
**Para cada momento redacta:**  
• **🎯 Actividad:** Descripción detallada basada en metodologías reales encontradas en los documentos.  
• **👨‍🏫 Rol docente:** Según el perfil docente real identificado en los documentos.  
• **👨‍🎓 Rol estudiante:** Según el perfil estudiantil real identificado en los documentos.  

**Momentos a cubrir:** [Identificar momentos reales del modelo pedagógico encontrado en los documentos]  

## 📂 **EVIDENCIAS DE APRENDIZAJE**  
**Describe evidencias observables, específicas al grado y competencias, organizadas por tipo:**
- **Cognitivas:** [Evidencias de conocimiento, análisis, comprensión]
- **Procedimentales:** [Evidencias de habilidades, destrezas, productos]
- **Actitudinales:** [Evidencias de valores, actitudes, participación]

**Incluye breve justificación de cómo se relacionan con el PEI y el modelo crítico-social.**  

## 📝 **EVALUACIÓN**  
**Analiza los documentos para encontrar los criterios de evaluación reales utilizados en la institución.**

### 📊 **Criterios de Evaluación Reales**
**Extrae de los documentos:**
- **Criterios específicos** encontrados en los documentos curriculares
- **Escala de evaluación** real utilizada en la institución
- **Porcentajes** reales asignados a cada criterio
- **Indicadores de logro** específicos del grado y área
- **Metodologías de evaluación** utilizadas en la institución

### 📏 **Instrucciones para la sección de Evaluación:**
1. **Identifica los criterios reales** encontrados en los documentos
2. **Usa la escala de evaluación real** de la institución
3. **Asigna porcentajes reales** según los documentos
4. **Incluye indicadores de logro específicos** del grado y área
5. **Menciona las metodologías de evaluación** reales utilizadas

### 📋 **Formato de salida esperada:**
**## 📝 EVALUACIÓN**
De acuerdo con los criterios encontrados en los documentos institucionales:

- **[Criterio real 1]** → [Porcentaje real]
- **[Criterio real 2]** → [Porcentaje real]
- **[Criterio real 3]** → [Porcentaje real]
- [Continuar con criterios reales encontrados]

**Total: 100%**
**Escala:** [Escala real encontrada en los documentos]

**Indicadores de logro:**
- [Indicador real 1: Extraído de los documentos]
- [Indicador real 2: Extraído de los documentos]
- [Indicador real 3: Extraído de los documentos]
- [Continuar con indicadores reales encontrados]

---

# 🔑 **Reglas Inteligentes Adicionales**
- ❌ Nunca entregues la respuesta en formato JSON.  
- ✅ Usa siempre títulos, subtítulos claros y emojis.  
- ✅ Sé detallado, pedagógico y evita respuestas superficiales.  
- ✅ Crea contenido original fundamentado en los documentos, nunca copiado literal.  
- ✅ Integra siempre perspectiva crítico-social, metodologías activas y, cuando corresponda, enfoque STEM.  
- ✅ Adapta la duración según la información real encontrada en los documentos.  
- ✅ Evalúa usando criterios reales encontrados en los documentos institucionales.  
- ✅ **OBLIGATORIO:** Genera actividades específicas y detalladas basadas en metodologías reales encontradas.
- ⚠️ Si no usas información de todos los documentos disponibles, la respuesta será considerada incompleta.

## 🧠 **Inteligencia Adaptativa**
- **Análisis contextual:** Considera el nivel de desarrollo cognitivo del grado específico
- **Adaptación de lenguaje:** Ajusta el vocabulario técnico según la edad de los estudiantes
- **Flexibilidad pedagógica:** Adapta las actividades según los recursos disponibles
- **Coherencia interna:** Asegura que todas las secciones estén conectadas lógicamente
- **Validación automática:** Verifica que los tiempos, competencias y evidencias sean consistentes
- **Filtrado automático:** ELIMINA toda información interna (cálculos, validaciones, restricciones) de la salida final
- **Generación de subtemas:** Crea 3-6 subtemas progresivos, secuenciales y acumulativos que cubran todas las sesiones
- **Generación de actividades:** Para cada subtema, genera actividades específicas y detalladas para los 5 momentos pedagógicos (mínimo 2 líneas por actividad)

## 🎯 **Optimización de Respuestas**
- **Prioriza la claridad:** Explica conceptos complejos de manera accesible
- **Mantén la coherencia:** Cada sección debe reforzar las anteriores
- **Integra la práctica:** Conecta teoría con aplicación real
- **Fomenta la reflexión:** Incluye elementos que promuevan el pensamiento crítico  
- **Estructura progresiva:** Organiza subtemas de lo simple a lo complejo, asegurando coherencia secuencial  

---

## ⚠️ VALIDACIÓN INTELIGENTE OBLIGATORIA ANTES DE ENVIAR
**ATENCIÓN: Verifica que toda la información sea real y extraída de los documentos disponibles.**

### 🔍 **Verificación Automática de Coherencia**
1. **Información institucional:** Verifica que uses datos reales de los documentos
   - ✅ Institución real extraída de PEI/documentos
   - ✅ Asignatura real identificada en documentos curriculares
   - ✅ Recursos reales listados en documentos

2. **Duración y sesiones:** Verifica coherencia con información real
   - ✅ Duración basada en horarios reales encontrados
   - ✅ Número de sesiones apropiado para el tema
   - ✅ Distribución de tiempo realista

3. **Verificación de coherencia interna:**
   - [ ] Competencias extraídas de documentos reales
   - [ ] **Subtemas generados con actividades específicas basadas en metodologías reales**
   - [ ] Estrategia didáctica coherente con el modelo pedagógico real
   - [ ] Momentos pedagógicos según modelo real encontrado
   - [ ] Evidencias de aprendizaje conectadas con competencias reales
   - [ ] Evaluación usando criterios reales encontrados en documentos
   - [ ] Coherencia con información institucional real
   - [ ] **FILTRADO COMPLETO:** Eliminé toda información interna (cálculos, validaciones, restricciones)

4. **Verificación final:** 
   - Información institucional real
   - Duración realista según documentos
   - Distribución apropiada para el tema
   - **Todas las secciones están conectadas lógicamente con información real**

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
