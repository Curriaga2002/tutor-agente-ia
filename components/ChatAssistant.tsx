"use client"

import { useState, useEffect, useRef } from 'react'
import { vectorSearchService, SearchResult } from '../lib/vector-search'
import { createClient } from '@supabase/supabase-js'
import { 
  getAllEducationalContent, 
  EducationalDocument, 
  PlanStructure 
} from '../lib/educational-content-service'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { 
  PDFContent, 
  searchInPDFs 
} from '../lib/pdf-content-processor'
import { useBucketDocuments } from '../hooks/useBucketDocuments'
import { geminiService } from '../lib/gemini-service'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isFormatted?: boolean
}

interface ChatAssistantProps {
  onChatUpdate?: (messages: Message[]) => void
  currentPlanningData?: any
  setCurrentPlanningData?: (data: any) => void
}

interface PlanningConfig {
    grado: string
  asignatura: string
    tema: string
  horas: string
    sesiones: string
  recursos: string
  nombreDocente: string
  // Campos para consulta automática de documentos institucionales
  consultarPEI: boolean
  consultarModeloPedagogico: boolean
  filtrosInstitucionales: string[]
}

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Componente del formulario de configuración inicial - MOVIDO FUERA
const ConfigurationForm = ({ 
  planningConfig, 
  setPlanningConfig, 
  onSubmit 
}: {
  planningConfig: PlanningConfig
  setPlanningConfig: React.Dispatch<React.SetStateAction<PlanningConfig>>
  onSubmit: () => void
}) => {
  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const horasNum = Number(planningConfig.horas)
    const sesionesNum = Number(planningConfig.sesiones)
    const horasValid = Number.isFinite(horasNum) && horasNum >= 1 && horasNum <= 2
    const sesionesValid = Number.isFinite(sesionesNum) && sesionesNum >= 1 && sesionesNum <= 2
    if (
      planningConfig.grado &&
      planningConfig.asignatura &&
      planningConfig.tema &&
      horasValid &&
      sesionesValid &&
      planningConfig.recursos &&
      planningConfig.nombreDocente
    ) {
      onSubmit()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'horas' || field === 'sesiones') {
      // Mantener solo dígitos pero NO forzar rangos aquí para evitar saltos/duplicaciones visuales
      const digitsOnly = value.replace(/[^0-9]/g, '')
      setPlanningConfig((prev: PlanningConfig) => ({ ...prev, [field]: digitsOnly }))
      return
    }
    setPlanningConfig((prev: PlanningConfig) => ({ ...prev, [field]: value }))
  }

  const normalizeNumericField = (field: 'horas' | 'sesiones') => {
    let num = Number(planningConfig[field])
    if (!Number.isFinite(num) || num === 0) num = 1
    if (field === 'horas') {
      if (num < 1) num = 1
      if (num > 2) num = 2
    } else {
      if (num < 1) num = 1
      if (num > 2) num = 2
    }
    setPlanningConfig((prev: PlanningConfig) => ({ ...prev, [field]: String(num) }))
  }

           return (
           <div className="bg-white/85 backdrop-blur-xl border border-white/40 rounded-3xl p-12 mb-8 shadow-xl shadow-black/10">
             <div className="text-center mb-12">
               <h3 className="text-3xl font-light text-gray-900 mb-4 tracking-tight">Configuración Inicial</h3>
               <p className="text-xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
                 Configura los parámetros básicos de tu planeación para personalizar la experiencia
               </p>
             </div>
      
                   <form onSubmit={handleConfigSubmit} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Grado *
                   </label>
                   <select
                     value={planningConfig.grado}
                     onChange={(e) => handleInputChange('grado', e.target.value)}
                     className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500"
                     required
                   >
                     <option value="">Selecciona el grado</option>
                     <option value="1°">1° Primaria</option>
                     <option value="2°">2° Primaria</option>
                     <option value="3°">3° Primaria</option>
                     <option value="4°">4° Primaria</option>
                     <option value="5°">5° Primaria</option>
                     <option value="6°">6° Primaria</option>
                     <option value="7°">7° Secundaria</option>
                     <option value="8°">8° Secundaria</option>
                     <option value="9°">9° Secundaria</option>
                     <option value="10°">10° Secundaria</option>
                     <option value="11°">11° Secundaria</option>
                   </select>
                 </div>
                 
                 <div className="space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Asignatura *
                   </label>
                   <input
                     type="text"
                     value={planningConfig.asignatura}
                     onChange={(e) => handleInputChange('asignatura', e.target.value)}
                     placeholder="Ej: Matemáticas, Ciencias, Español..."
                     className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500"
                     required
                   />
                 </div>
                 
                 <div className="space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Tema Específico *
                   </label>
                   <input
                     type="text"
                     value={planningConfig.tema}
                     onChange={(e) => handleInputChange('tema', e.target.value)}
                     placeholder="Ej: Suma y resta, Ecosistemas, Poesía..."
                     className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500"
                     required
                   />
                 </div>
                 
                 <div className="space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Duración Total (horas) *
                   </label>
                   <select
                     value={planningConfig.horas}
                     onChange={(e) => handleInputChange('horas', e.target.value)}
                     className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500"
                     required
                  >
                    <option value="">Selecciona horas</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                 </div>
                 
                 <div className="space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Número de Sesiones *
                   </label>
                   <select
                     value={planningConfig.sesiones}
                     onChange={(e) => handleInputChange('sesiones', e.target.value)}
                     className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500"
                     required
                  >
                    <option value="">Selecciona sesiones</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                 </div>
                 
                 <div className="space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Recursos Disponibles *
                   </label>
                   <input
                     type="text"
                     value={planningConfig.recursos}
                     onChange={(e) => handleInputChange('recursos', e.target.value)}
                     placeholder="Ej: Computadores, internet, software educativo..."
                     className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500"
                     required
                   />
                 </div>
                 
                 <div className="md:col-span-2 space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Nombre del Docente *
                   </label>
                   <input
                     type="text"
                     value={planningConfig.nombreDocente}
                     onChange={(e) => handleInputChange('nombreDocente', e.target.value)}
                     placeholder="Ej: María González, Juan Pérez..."
                     className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500"
                     required
                   />
                 </div>
          
               </div>
               
               <div className="text-center pt-8">
                 <button
                   type="submit"
                   className="inline-flex items-center px-12 py-5 bg-gray-900/90 backdrop-blur-sm text-white rounded-2xl hover:bg-gray-800/90 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium text-xl shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transform hover:-translate-y-0.5"
                 >
                   <span className="mr-3">✅</span>
                   Aceptar y Continuar
                 </button>
               </div>
      </form>
    </div>
  )
}

export default function ChatAssistant({ 
  onChatUpdate, 
  currentPlanningData, 
  setCurrentPlanningData 
}: ChatAssistantProps) {
  // Hook para documentos del bucket en tiempo real
  const { documents: bucketDocuments, isLoading: documentsLoading, error: documentsError, documentCount } = useBucketDocuments()
  
  // Estado para controlar la configuración inicial
  const [isConfigured, setIsConfigured] = useState(false)
  const [planningConfig, setPlanningConfig] = useState<PlanningConfig>({
    grado: '',
    asignatura: '',
    tema: '',
    horas: '',
    sesiones: '',
    recursos: '',
    nombreDocente: '',
    // Campos para consulta automática de documentos institucionales
    consultarPEI: true,
    consultarModeloPedagogico: true,
    filtrosInstitucionales: ['Orientaciones Curriculares', 'Estructuras de Planes de Clase', 'Proyectos Educativos', 'Modelos Pedagógicos']
  })
  
  const [messages, setMessages] = useState<Message[]>([])
  const [initialMessage, setInitialMessage] = useState<Message>({
    id: "initial",
      text: `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.

**Mi misión es ayudarte a planificar clases completas** usando documentos oficiales del sistema educativo:
• Orientaciones curriculares oficiales
• Estructuras de planes de clase
• Proyectos educativos institucionales
• Modelos pedagógicos validados

**¿Qué plan de clase necesitas generar?** 
Ejemplos: 
• "Plan de clase para 5° sobre ecosistemas"
• "Plan de clase para 9° sobre ecuaciones cuadráticas"
• "Plan de clase para 11° sobre literatura latinoamericana"

`,
      isUser: false,
      timestamp: new Date(),
      isFormatted: true,
  })
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const configShownRef = useRef<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [pendingInputs, setPendingInputs] = useState<string[]>([])
  const [sessionRestored, setSessionRestored] = useState(false)
  const [consultedDocuments, setConsultedDocuments] = useState<{
    pei: PDFContent[]
    modeloPedagogico: PDFContent[]
    orientacionesCurriculares: PDFContent[]
    relevantDocs: PDFContent[]
  }>({
    pei: [],
    modeloPedagogico: [],
    orientacionesCurriculares: [],
    relevantDocs: []
  })

  // Actualizar mensaje inicial cuando cambie el estado de los documentos
  useEffect(() => {
      if (documentsLoading) {
      setInitialMessage(prev => ({
        ...prev,
        text: `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.

**Mi misión es ayudarte a planificar clases completas** usando documentos oficiales del sistema educativo:
• Orientaciones curriculares oficiales
• Estructuras de planes de clase
• Proyectos educativos institucionales
• Modelos pedagógicos validados

**Estado del sistema:** 🔄 Inicializando...

**¿Qué plan de clase necesitas generar?** 
Ejemplos: 
• "Plan de clase para 5° sobre ecosistemas"
• "Plan de clase para 9° sobre ecuaciones cuadráticas"
• "Plan de clase para 11° sobre literatura latinoamericana"

`
      }))
      } else if (documentsError) {
      setInitialMessage(prev => ({
        ...prev,
        text: `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.

**Mi misión es ayudarte a planificar clases completas** usando documentos oficiales del sistema educativo:
• Orientaciones curriculares oficiales
• Estructuras de planes de clase
• Proyectos educativos institucionales
• Modelos pedagógicos validados

**Estado del sistema:** ⚠️ Verificando conexión...

**¿Qué plan de clase necesitas generar?** 
Ejemplos: 
• "Plan de clase para 5° sobre ecosistemas"
• "Plan de clase para 9° sobre ecuaciones cuadráticas"
• "Plan de clase para 11° sobre literatura latinoamericana"

`
      }))
      } else if (bucketDocuments.length > 0) {
      setInitialMessage(prev => ({
        ...prev,
        text: `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

¡Hola! Soy tu asistente pedagógico especializado en la creación de planes de clase personalizados.

**Mi misión es ayudarte a planificar clases completas** usando documentos oficiales del sistema educativo:
• Orientaciones curriculares oficiales
• Estructuras de planes de clase
• Proyectos educativos institucionales
• Modelos pedagógicos validados

**Estado del sistema:** ✅ Sistema listo

**¿Qué plan de clase necesitas generar?** 
Ejemplos: 
• "Plan de clase para 5° sobre ecosistemas"
• "Plan de clase para 9° sobre ecuaciones cuadráticas"
• "Plan de clase para 11° sobre literatura latinoamericana"

`
      }))
    }
  }, [documentsLoading, documentsError, bucketDocuments, documentCount])

  // Persistencia de sesión (rehidratación y guardado)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chatSession')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.planningConfig) setPlanningConfig(parsed.planningConfig)
        if (Array.isArray(parsed.messages)) {
          // Filtrar mensajes que no deberían estar en el array de mensajes
          const filteredMessages = parsed.messages
            .filter((m: any) => 
              m.id !== "initial" && 
              !m.text.includes('ASISTENTE PEDAGÓGICO INTELIGENTE') &&
              !m.text.includes('CONFIGURACIÓN COMPLETADA EXITOSAMENTE')
            )
            .map((m: any) => ({...m, timestamp: new Date(m.timestamp)}))
          
          // Si se encontró un mensaje no deseado en el array, limpiar localStorage
          if (parsed.messages.some((m: any) => 
            m.id === "initial" || 
            m.text.includes('ASISTENTE PEDAGÓGICO INTELIGENTE') ||
            m.text.includes('CONFIGURACIÓN COMPLETADA EXITOSAMENTE')
          )) {
            console.log('🧹 Limpiando localStorage - mensajes no deseados encontrados en array')
            localStorage.removeItem('chatSession')
          }
          
          setMessages(filteredMessages)
        }
        if (typeof parsed.isConfigured === 'boolean') {
          setIsConfigured(parsed.isConfigured)
          // Si ya está configurado, marcar que el mensaje de configuración ya se mostró
          if (parsed.isConfigured) {
            configShownRef.current = true
          }
        }
      }
    } catch {}
    setSessionRestored(true)
  }, [])

  useEffect(() => {
    if (!sessionRestored) return
    try {
      // Filtrar mensajes de configuración completada antes de guardar
      const filteredMessages = messages.filter(m => 
        !m.text.includes('CONFIGURACIÓN COMPLETADA EXITOSAMENTE')
      )
      localStorage.setItem('chatSession', JSON.stringify({ planningConfig, messages: filteredMessages, isConfigured }))
    } catch {}
  }, [planningConfig, messages, isConfigured, sessionRestored])

  // Función para buscar documentos relevantes
  const searchRelevantDocuments = async (query: string): Promise<PDFContent[]> => {
    try {
      if (bucketDocuments.length === 0) {
        return []
      }
      
      // Buscar documentos que contengan la consulta
      const relevantDocs = bucketDocuments.filter(doc => {
        const titleMatch = doc.title.toLowerCase().includes(query.toLowerCase())
        const contentMatch = doc.content.toLowerCase().includes(query.toLowerCase())
        const typeMatch = doc.doc_type.toLowerCase().includes(query.toLowerCase())
        
        if (titleMatch || contentMatch || typeMatch) {
          return true
        }
        return false
      })
      
      // Re-ranking básico: ponderar coincidencias en título sobre contenido, y doc_type específico
      const scored = relevantDocs.map(doc => {
        const titleScore = doc.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 0
        const typeScore = doc.doc_type.toLowerCase().includes('curricular') ? 1 : 0
        const contentScore = doc.content.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
        return { doc, score: titleScore + typeScore + contentScore }
      })
      scored.sort((a, b) => b.score - a.score)
      return scored.map(s => s.doc)
      
    } catch (error) {
      console.error('❌ Error buscando documentos:', error)
      return []
    }
  }

  // Función para generar respuesta pedagógica usando Gemini
  const generatePedagogicalResponse = async (userInput: string, relevantDocs: PDFContent[]): Promise<string> => {
    try {
      // Analizar entrada del usuario
      const analysis = analyzeUserInput(userInput)
      
      // CONSULTA AUTOMÁTICA DE DOCUMENTOS INSTITUCIONALES
      const documentosInstitucionales = await consultarDocumentosInstitucionales()
      
      // Actualizar estado de documentos consultados
      setConsultedDocuments({
        pei: documentosInstitucionales.pei,
        modeloPedagogico: documentosInstitucionales.modeloPedagogico,
        orientacionesCurriculares: documentosInstitucionales.orientacionesCurriculares,
        relevantDocs: relevantDocs
      })
      
      // Combinar documentos relevantes de la consulta con documentos institucionales
      let relevantFiles = [...relevantDocs]
      
      // Agregar PEI si está habilitado
      if (planningConfig.consultarPEI && documentosInstitucionales.pei.length > 0) {
        relevantFiles.push(...documentosInstitucionales.pei)
      }
      
      // Agregar Modelo Pedagógico si está habilitado
      if (planningConfig.consultarModeloPedagogico && documentosInstitucionales.modeloPedagogico.length > 0) {
        relevantFiles.push(...documentosInstitucionales.modeloPedagogico)
      }
      
      // Agregar Orientaciones Curriculares
      if (documentosInstitucionales.orientacionesCurriculares.length > 0) {
        relevantFiles.push(...documentosInstitucionales.orientacionesCurriculares)
      }
      
      // Buscar documentos adicionales si no hay suficientes
      if (relevantFiles.length === 0) {
        const docsAdicionales = await searchRelevantDocuments(userInput)
        relevantFiles.push(...docsAdicionales)
      }
      
      // Filtrar por asignatura (evitar mezclar áreas ajenas)
      const asignaturaLc = (planningConfig.asignatura || '').toLowerCase()
      const temaLc = (planningConfig.tema || '').toLowerCase()
      const filteredBySubject = relevantFiles.filter(doc => {
        const t = (doc.title || '').toLowerCase()
        const c = (doc.content || '').toLowerCase()
        const dt = (doc.doc_type || '').toLowerCase()
        const matchesAsignatura = asignaturaLc
          ? t.includes(asignaturaLc) || c.includes(asignaturaLc) || dt.includes(asignaturaLc)
          : true
        const matchesTema = temaLc ? t.includes(temaLc) || c.includes(temaLc) : true
        const isTech = t.includes('tecnolog') || c.includes('tecnolog') || dt.includes('tecnolog') || dt.includes('informát') || dt.includes('informat')
        const asignaturaEsTec = asignaturaLc.includes('tecnolog') || asignaturaLc.includes('informát') || asignaturaLc.includes('informat')
        if (isTech && !asignaturaEsTec) return false
        return matchesAsignatura && matchesTema
      })
      
      // Eliminar duplicados basados en ID
      const uniqueDocs = filteredBySubject.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      )
      
      // Construir contexto enriquecido con configuración inicial + historial reciente del chat
      // Normalizar horas y sesiones como números válidos dentro de rango
      const horasNum = Math.min(2, Math.max(1, Number(planningConfig.horas || '1') || 1))
      const sesionesNum = Math.min(2, Math.max(1, Number(planningConfig.sesiones || '1') || 1))

      const totalMinutes = horasNum * 60
      const minutesPerSessionBase = Math.floor(totalMinutes / sesionesNum)
      const minutesRemainder = totalMinutes - (minutesPerSessionBase * sesionesNum)
      const distributionPreview = Array.from({ length: sesionesNum }, (_, i) => {
        const extra = i === (sesionesNum - 1) ? minutesRemainder : 0
        return `Sesión ${i + 1}: ${minutesPerSessionBase + extra} min`
      }).join(' | ')

      const configContext = `Configuración inicial proporcionada por el docente:\n` +
        `• Grado: ${planningConfig.grado || 'No especificado'}\n` +
        `• Asignatura: ${planningConfig.asignatura || 'No especificada'}\n` +
        `• Tema: ${planningConfig.tema || 'No especificado'}\n` +
        `• Duración: ${horasNum} horas\n` +
        `• Sesiones: ${sesionesNum}\n` +
        `• Docente: ${planningConfig.nombreDocente || 'No especificado'}\n` +
        `• Recursos disponibles: ${planningConfig.recursos || 'No especificados'}\n` +
        `• Duración total (min): ${totalMinutes}\n` +
        `• Distribución sugerida (min): ${distributionPreview}`

      const recentMessages = messages.slice(-10)
      const conversationTranscript = recentMessages
        .map(m => `${m.isUser ? 'Docente' : 'Asistente'}: ${m.text}`)
        .join('\n\n')

      const combinedContext = `${configContext}\n\nREGLAS ESTRICTAS PARA LA RESPUESTA (OBLIGATORIAS):\n` +
        `1) Usa EXACTAMENTE la duración total: ${horasNum} horas. No la modifiques ni la derives.\n` +
        `2) Usa EXACTAMENTE el número de sesiones: ${sesionesNum}. No lo modifiques.\n` +
        `3) Distribuye el tiempo en ${sesionesNum} sesiones; la suma total debe ser ${horasNum} horas.\n` +
        `4) Trabaja únicamente en minutos en toda la respuesta. No uses horas ni decimales.\n` +
        `5) No agregues sesiones extra; si necesitas más tiempo, prioriza y sintetiza.\n` +
        `6) Incluye una sección de "Distribución temporal (minutos)" con ${sesionesNum} líneas que sumen ${totalMinutes} min.\n` +
        `7) Añade una línea de verificación: "Verificación: suma de sesiones = ${totalMinutes} min".\n` +
        `8) No incluyas "Institución" ni "Área". Mantente en la asignatura: ${planningConfig.asignatura}.\n` +
        `9) Mantén la sección de duración total (min) y sesiones al inicio exactamente con estos valores.\n\n` +
        `Historial reciente del chat (usar como guía contextual, no repetir literalmente):\n${conversationTranscript}`

      // Usar Gemini para generar el plan de clase con el contexto combinado
      const geminiResponse = await geminiService.generateClassPlan(
        analysis.grado,
        analysis.tema,
        combinedContext,
        uniqueDocs,
        planningConfig.recursos,
        planningConfig.nombreDocente
      )
      
      if (geminiResponse.success) {
        // Post-procesar para asegurar consistencia de horas y sesiones y añadir distribución temporal
        let text = geminiResponse.text
        try {
          const horasNum = Math.min(2, Math.max(1, Number(planningConfig.horas || '1') || 1))
          const sesionesNum = Math.min(2, Math.max(1, Number(planningConfig.sesiones || '1') || 1))
          const totalMinutes = horasNum * 60
          const base = Math.floor(totalMinutes / sesionesNum)
          const remainder = totalMinutes - (base * sesionesNum)
          // Normalizar encabezados
          text = text
            .replace(/Duración:\s*\d+\s*horas/gi, `Duración: ${horasNum} horas`)
            .replace(/•\s*Duración:\s*\d+\s*horas/gi, `• Duración: ${horasNum} horas`)
            .replace(/Sesiones:\s*\d+/gi, `Sesiones: ${sesionesNum}`)
            .replace(/•\s*Sesiones:\s*\d+/gi, `• Sesiones: ${sesionesNum}`)
            .replace(/•\s*Área:\s*[^\n]+/gi, `• Área: ${planningConfig.asignatura || 'No especificada'}`)
            .replace(/•\s*Asignatura:\s*[^\n]+/gi, `• Asignatura: ${planningConfig.asignatura || 'No especificada'}`)
            .replace(/Duración total \(min\):\s*\d+/gi, `Duración total (min): ${totalMinutes}`)
            .replace(/•\s*Duración total \(min\):\s*\d+/gi, `• Duración total (min): ${totalMinutes}`)
          // Eliminar bloque/lineas de identificación redundante o errónea
          text = text
            .replace(/^\s*IDENTIFICACI[ÓO]N\s*$/gim, '')
            .replace(/^•\s*Instituci[óo]n:[^\n]*\n?/gim, '')
            .replace(/^•\s*Área:[^\n]*\n?/gim, '')
            .replace(/^•\s*Duraci[óo]n:\s*\n?/gim, '')
            .replace(/\n{3,}/g, '\n\n')
          // Inyectar bloque de distribución temporal al inicio si no existe
          if (!/Distribuci[óo]n temporal/gi.test(text)) {
            const bloque = `\n\n**🕒 Distribución temporal (minutos):**\n` +
              Array.from({ length: sesionesNum }, (_, i) => {
                const extra = i === (sesionesNum - 1) ? remainder : 0
                return `• Sesión ${i + 1}: ${base + extra} min`
              }).join('\n') + `\n• Verificación: suma de sesiones = ${totalMinutes} min`
            text = text.replace(/(\*\*Informaci[óo]n de la Planeaci[óo]n:\*\*[\s\S]*?\n)/, `$1${bloque}\n`)
          }

          // Eliminar cualquier bloque IDENTIFICACIÓN (incluyendo variantes entre paréntesis)
          text = text
            .replace(/^\s*IDENTIFICACI[ÓO]N\s*$(?:[\s\S]*?)(?=\n\n|\n\*\*|$)/gim, '')
            .replace(/\(\s*•\s*(Instituci[óo]n|Área|Duraci[óo]n)[\s\S]*?\)/gim, '')
            .replace(/^•\s*Instituci[óo]n:[^\n]*\n?/gim, '')
            .replace(/^•\s*Área:[^\n]*\n?/gim, '')
            .replace(/^•\s*Duraci[óo]n:\s*Configuraci[óo]n inicial proporcionada por el docente:?\s*\n?/gim, '')
            .replace(/^•\s*Grado:[^\n]*\n?/gim, '')
            .replace(/^•\s*Asignatura:[^\n]*\n?/gim, '')
            .replace(/^•\s*Tema:[^\n]*\n?/gim, '')
            .replace(/^•\s*Sesiones:[^\n]*\n?/gim, '')
            .replace(/^•\s*Docente:[^\n]*\n?/gim, '')
            .replace(/^•\s*Recursos disponibles:[^\n]*\n?/gim, '')

          // Eliminar sección COMPONENTE CURRICULAR
          text = text
            .replace(/📚\s*COMPONENTE\s*CURRICULAR\s*(?:[\s\S]*?)(?=\n\n|\n\*\*|\n[🎯🔍📝✅📂🕒]|$)/gim, '')
            .replace(/^\s*COMPONENTE\s*CURRICULAR\s*(?:[\s\S]*?)(?=\n\n|\n\*\*|\n[🎯🔍📝✅📂🕒]|$)/gim, '')
            .replace(/^📚\s*COMPONENTE\s*CURRICULAR\s*$/gim, '')
            .replace(/^COMPONENTE\s*CURRICULAR\s*$/gim, '')

          // Limpieza de saltos repetidos
          text = text.replace(/\n{3,}/g, '\n\n')
        } catch {}
        return text
        } else {
        // Verificar si es error de cuota excedida
        if (geminiResponse.error && (geminiResponse.error.includes('quota') || geminiResponse.error.includes('429'))) {
          return await generateFallbackResponse(userInput, relevantDocs)
        }
        
        // Respuesta de error dinámica sin formato preestablecido
        return `❌ **Error en la generación del plan de clase**

**Detalles técnicos:**
• Grado solicitado: ${analysis.grado}
• Tema solicitado: ${analysis.tema}
• Asignatura: ${analysis.asignatura}
• Documentos específicos encontrados: ${uniqueDocs.length}
• Total de documentos disponibles: ${bucketDocuments.length}
• PEI incluido: ${planningConfig.consultarPEI ? 'Sí' : 'No'}
• Modelo Pedagógico incluido: ${planningConfig.consultarModeloPedagogico ? 'Sí' : 'No'}
• Error de IA: ${geminiResponse.error}

**Solución:** Por favor, verifica la consola del navegador para más detalles y contacta al administrador si el problema persiste.`
      }
      
    } catch (error) {
      console.error('❌ **ERROR GENERAL EN GENERACIÓN:**', error)
      
      // Respuesta de error completamente dinámica
      const errorType = error instanceof Error ? error.constructor.name : typeof error
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      return `❌ **Error inesperado en la generación del plan de clase**

**Información del error:**
• Tipo: ${errorType}
• Mensaje: ${errorMessage}
• Documentos disponibles: ${bucketDocuments.length}

**Acción requerida:** Por favor, verifica la consola del navegador para más detalles.`
    }
  }

  // Función de fallback cuando Gemini excede la cuota
  const generateFallbackResponse = async (userInput: string, relevantDocs: PDFContent[]): Promise<string> => {
    try {
      // Analizar entrada del usuario
      const analysis = analyzeUserInput(userInput)
      
      // Consultar documentos institucionales
      const documentosInstitucionales = await consultarDocumentosInstitucionales()
      
      // Actualizar estado de documentos consultados
      setConsultedDocuments({
        pei: documentosInstitucionales.pei,
        modeloPedagogico: documentosInstitucionales.modeloPedagogico,
        orientacionesCurriculares: documentosInstitucionales.orientacionesCurriculares,
        relevantDocs: relevantDocs
      })
      
      // Combinar todos los documentos relevantes
      let allDocs = [...relevantDocs]
      if (planningConfig.consultarPEI && documentosInstitucionales.pei.length > 0) {
        allDocs.push(...documentosInstitucionales.pei)
      }
      if (planningConfig.consultarModeloPedagogico && documentosInstitucionales.modeloPedagogico.length > 0) {
        allDocs.push(...documentosInstitucionales.modeloPedagogico)
      }
      if (documentosInstitucionales.orientacionesCurriculares.length > 0) {
        allDocs.push(...documentosInstitucionales.orientacionesCurriculares)
      }
      
      // Eliminar duplicados
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      )
      
      // Generar respuesta estructurada basada en los documentos disponibles e integrando la configuración inicial
      // Normalizar horas/sesiones también en fallback
      const horasNum = Math.min(2, Math.max(1, Number(planningConfig.horas) || Number(analysis.horas) || 1))
      const sesionesNum = Math.min(2, Math.max(1, Number(planningConfig.sesiones) || Number(analysis.sesiones) || 1))

      let response = `🎓 **PLAN DE CLASE GENERADO (Sistema de Fallback)**

**Información de la Planeación:**
• **Grado:** ${planningConfig.grado || analysis.grado}
• **Asignatura:** ${planningConfig.asignatura || analysis.asignatura}
• **Tema:** ${planningConfig.tema || analysis.tema}
• **Duración:** ${horasNum} horas
• **Sesiones:** ${sesionesNum}
• **Duración total (min):** ${horasNum * 60}
• **Docente:** ${planningConfig.nombreDocente || 'No especificado'}
• **Recursos disponibles:** ${planningConfig.recursos || 'No especificados'}

**📋 Contexto Institucional Disponible:**
${documentosInstitucionales.pei.length > 0 ? `• **PEI:** ${documentosInstitucionales.pei.map(d => d.title).join(', ')}\n` : ''}
${documentosInstitucionales.modeloPedagogico.length > 0 ? `• **Modelo Pedagógico:** ${documentosInstitucionales.modeloPedagogico.map(d => d.title).join(', ')}\n` : ''}
${documentosInstitucionales.orientacionesCurriculares.length > 0 ? `• **Orientaciones Curriculares:** ${documentosInstitucionales.orientacionesCurriculares.map(d => d.title).join(', ')}\n` : ''}

**📖 Documentos Específicos del Tema:**
${uniqueDocs.length > 0 ? uniqueDocs.map((doc, index) => `• **${index + 1}.** ${doc.title} (${doc.doc_type})`).join('\n') : '• No se encontraron documentos específicos para este tema'}

**⚠️ Nota:** Esta respuesta fue generada por el sistema de fallback debido a que Gemini API excedió su cuota diaria. Para respuestas más detalladas, espera 55 segundos o contacta al administrador para verificar el estado de la API.

**🎯 Estructura Sugerida del Plan de Clase:**

**1. INTRODUCCIÓN Y CONTEXTUALIZACIÓN**
   • Conectar con el PEI institucional
   • Aplicar el modelo pedagógico establecido
   • Alinear con las orientaciones curriculares

**2. OBJETIVOS DE APRENDIZAJE**
   • Basados en el grado y asignatura
   • Alineados con el tema específico
   • Conectados con las competencias institucionales

**3. METODOLOGÍA**
   • Seguir el modelo pedagógico institucional
   • Aplicar estrategias validadas
   • Usar recursos disponibles (${planningConfig.recursos || 'no especificados'})

**4. EVALUACIÓN**
   • Criterios alineados con el PEI
   • Instrumentos del modelo pedagógico
   • Estándares curriculares oficiales

**🕒 Distribución temporal (minutos):**
${Array.from({ length: sesionesNum }, (_, i) => `• Sesión ${i + 1}: ${i === sesionesNum - 1 ? Math.floor((horasNum * 60) / sesionesNum) + ((horasNum * 60) - (Math.floor((horasNum * 60) / sesionesNum) * sesionesNum)) : Math.floor((horasNum * 60) / sesionesNum)} min`).join('\n')}
• Verificación: suma de sesiones = ${horasNum * 60} min

**💡 Recomendación:** Revisa los documentos específicos listados arriba para obtener detalles más precisos sobre la implementación de este plan de clase.`

      // Asegurar consistencia en fallback también
      response = response
        .replace(/Duración:\s*\d+\s*horas/gi, `Duración: ${horasNum} horas`)
        .replace(/•\s*Duración:\s*\d+\s*horas/gi, `• Duración: ${horasNum} horas`)
        .replace(/Sesiones:\s*\d+/gi, `Sesiones: ${sesionesNum}`)
        .replace(/•\s*Sesiones:\s*\d+/gi, `• Sesiones: ${sesionesNum}`)
        .replace(/Duración total \(min\):\s*\d+/gi, `Duración total (min): ${horasNum * 60}`)
        .replace(/•\s*Duración total \(min\):\s*\d+/gi, `• Duración total (min): ${horasNum * 60}`)
        .replace(/^\s*IDENTIFICACI[ÓO]N\s*$/gim, '')
        .replace(/^•\s*Instituci[óo]n:[^\n]*\n?/gim, '')
        .replace(/^•\s*Área:[^\n]*\n?/gim, '')
        .replace(/^•\s*Duraci[óo]n:\s*\n?/gim, '')
        .replace(/\n{3,}/g, '\n\n')

      // Eliminar cualquier bloque IDENTIFICACIÓN del fallback
      response = response
        .replace(/^\s*IDENTIFICACI[ÓO]N\s*$(?:[\s\S]*?)(?=\n\n|\n\*\*|$)/gim, '')
        .replace(/^•\s*Grado:[^\n]*\n?/gim, '')
        .replace(/^•\s*Asignatura:[^\n]*\n?/gim, '')
        .replace(/^•\s*Tema:[^\n]*\n?/gim, '')
        .replace(/^•\s*Duraci[óo]n:[^\n]*\n?/gim, '')
        .replace(/^•\s*Sesiones:[^\n]*\n?/gim, '')
        .replace(/^•\s*Docente:[^\n]*\n?/gim, '')
        .replace(/^•\s*Recursos disponibles:[^\n]*\n?/gim, '')

      // Eliminar sección COMPONENTE CURRICULAR del fallback
      response = response
        .replace(/📚\s*COMPONENTE\s*CURRICULAR\s*(?:[\s\S]*?)(?=\n\n|\n\*\*|\n[🎯🔍📝✅📂🕒]|$)/gim, '')
        .replace(/^\s*COMPONENTE\s*CURRICULAR\s*(?:[\s\S]*?)(?=\n\n|\n\*\*|\n[🎯🔍📝✅📂🕒]|$)/gim, '')
        .replace(/^📚\s*COMPONENTE\s*CURRICULAR\s*$/gim, '')
        .replace(/^COMPONENTE\s*CURRICULAR\s*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')

      return response
      
    } catch (error) {
      console.error('❌ Error en fallback:', error)
      return `❌ **Error en el sistema de fallback**

**Información básica:**
• Error: ${error instanceof Error ? error.message : 'Error desconocido'}

**Solución:** Contacta al administrador para resolver el problema.`
    }
  }

  // Función para consultar documentos institucionales automáticamente
  const consultarDocumentosInstitucionales = async (): Promise<{
    pei: PDFContent[]
    modeloPedagogico: PDFContent[]
    orientacionesCurriculares: PDFContent[]
  }> => {
    try {
      if (bucketDocuments.length === 0) {
        return { pei: [], modeloPedagogico: [], orientacionesCurriculares: [] }
      }
      
      // Buscar PEI (Proyecto Educativo Institucional)
      const peiDocs = bucketDocuments.filter(doc => 
        doc.title.toLowerCase().includes('pei') ||
        doc.title.toLowerCase().includes('proyecto educativo') ||
        doc.title.toLowerCase().includes('proyecto institucional') ||
        doc.content.toLowerCase().includes('proyecto educativo institucional') ||
        doc.doc_type.toLowerCase().includes('pei')
      )
      
      // Buscar Modelo Pedagógico
      const modeloPedagogicoDocs = bucketDocuments.filter(doc => 
        doc.title.toLowerCase().includes('modelo pedagógico') ||
        doc.title.toLowerCase().includes('enfoque pedagógico') ||
        doc.title.toLowerCase().includes('metodología') ||
        doc.content.toLowerCase().includes('modelo pedagógico') ||
        doc.doc_type.toLowerCase().includes('pedagógico')
      )
      
      // Buscar Orientaciones Curriculares
      const orientacionesCurricularesDocs = bucketDocuments.filter(doc => 
        doc.title.toLowerCase().includes('orientaciones') ||
        doc.title.toLowerCase().includes('curricular') ||
        doc.title.toLowerCase().includes('curriculum') ||
        doc.content.toLowerCase().includes('orientaciones curriculares') ||
        doc.doc_type.toLowerCase().includes('curricular')
      )
      
      return {
        pei: peiDocs,
        modeloPedagogico: modeloPedagogicoDocs,
        orientacionesCurriculares: orientacionesCurricularesDocs
      }
      
    } catch (error) {
      console.error('❌ Error consultando documentos institucionales:', error)
      return { pei: [], modeloPedagogico: [], orientacionesCurriculares: [] }
    }
  }

  // Función para analizar la entrada del usuario usando la configuración inicial
  const analyzeUserInput = (input: string) => {
    // Usar la configuración inicial en lugar de extraer del texto
    const grado = planningConfig.grado || "No especificado"
    const tema = planningConfig.tema || "Tema general"
    const asignatura = planningConfig.asignatura || "Asignatura general"
    const horas = planningConfig.horas || "Variable"
    const sesiones = planningConfig.sesiones || "Por definir"
    
    // Determinar contexto dinámicamente
    const context = `Educación para ${grado !== "No especificado" ? grado : "nivel educativo"} en ${asignatura}`
    
    // Determinar complejidad dinámicamente
    let complexity = "Intermedio"
    if (grado.includes('1') || grado.includes('2') || grado.includes('3')) complexity = "Básico"
    else if (grado.includes('10') || grado.includes('11')) complexity = "Avanzado"
    
    // Enfoque pedagógico dinámico
    const pedagogicalFocus = "Modelo pedagógico adaptativo"
    
    return { 
      grado, 
      tema, 
      asignatura,
      horas,
      sesiones,
      context, 
      complexity, 
      pedagogicalFocus 
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    if (isLoading) {
      // Encolar si hay generación en curso
      setPendingInputs(prev => [...prev, inputText])
      setInputText('')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    // Cancel controller
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort() } catch {}
    }
    abortControllerRef.current = new AbortController()

    try {
      // Buscar documentos relevantes usando el sistema vectorial
      console.time('docs:search')
      const relevantDocs = await searchRelevantDocuments(inputText)
      console.timeEnd('docs:search')
      
      // Generar respuesta pedagógica
      console.time('ai:generate')
      const aiResponse = await generatePedagogicalResponse(inputText, relevantDocs)
      console.timeEnd('ai:generate')
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        isFormatted: true,
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Notificar actualización del chat (solo mensajes reales, no el mensaje inicial)
      if (onChatUpdate) {
        onChatUpdate([...messages, userMessage, assistantMessage])
      }
      
    } catch (error) {
      console.error('❌ Error en el chat:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `❌ **Error generando respuesta:** ${error instanceof Error ? error.message : 'Error desconocido'}\n\nPor favor, intenta nuevamente.`,
        isUser: false,
        timestamp: new Date(),
        isFormatted: true,
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Procesar cola
      if (pendingInputs.length > 0) {
        const next = pendingInputs[0]
        setPendingInputs(prev => prev.slice(1))
        setInputText(next)
        // Auto-disparar envío del siguiente
        setTimeout(() => {
          const form = document.querySelector('form') as HTMLFormElement | null
          form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
        }, 0)
      }
    }
  }

  // Función para guardar el chat en la base de datos
  const saveChatToDatabase = async () => {
    if (messages.length <= 1) {
      alert('No hay planeación para guardar')
      return
    }

    if (!isConfigured) {
      alert('Debes completar la configuración inicial antes de guardar')
      return
    }

    setIsSaving(true)
    try {
      // Usar la configuración inicial directamente
      const grado = planningConfig.grado
      const tema = planningConfig.tema
      const asignatura = planningConfig.asignatura
      const duracion = `${planningConfig.horas} horas`
      const sesiones = planningConfig.sesiones

      // Preparar datos para guardar
      const chatData = {
        grado,
        tema,
        duracion,
        sesiones,
        contenido: messages.map(m => `${m.isUser ? 'Usuario' : 'Asistente'}: ${m.text}`).join('\n\n'),
        chat_history: messages, // Solo mensajes reales del chat, no el mensaje inicial
        user_id: null // Se asignará automáticamente por RLS
      }

      // Guardar en la base de datos
      const { data, error } = await supabase
        .from('planeaciones')
        .insert([chatData])
        .select()
       
      if (error) {
        console.error('❌ Error guardando planeación:', error)
        alert(`❌ Error al guardar: ${error.message}`)
      } else {
        alert('✅ Planeación guardada exitosamente en la base de datos')
        
        // Actualizar datos de planeación actual
        if (setCurrentPlanningData && data && data[0]) {
          setCurrentPlanningData(data[0])
        }
      }
    } catch (error) {
      console.error('❌ Error general guardando planeación:', error)
      alert(`❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Función para exportar el chat como Word
  const exportToWord = async () => {
    if (messages.length <= 1) {
      alert('No hay planeación para exportar')
      return
    }

    if (!isConfigured) {
      alert('Debes completar la configuración inicial antes de exportar')
      return
    }

    try {
      // Crear párrafos del documento
      const paragraphs: Paragraph[] = []

      // Header del documento
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "📚 Planeación Didáctica - Conversación Completa",
              bold: true,
              size: 32,
              color: "2c3e50"
            })
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      )

      // Información de fecha y generador
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}`,
              size: 22,
              color: "7f8c8d"
            })
          ],
          spacing: { after: 200 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `🤖 Generado por: Asistente Pedagógico IA`,
              size: 22,
              color: "7f8c8d"
            })
          ],
          spacing: { after: 400 }
        })
      )

      // Información de la planeación
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "📋 Configuración de la Planeación",
              bold: true,
              size: 28,
              color: "3498db"
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 }
        })
      )

      // Datos de la planeación
      const planData = [
        { icon: "🎓", label: "Grado", value: planningConfig.grado },
        { icon: "📖", label: "Asignatura", value: planningConfig.asignatura },
        { icon: "📝", label: "Tema", value: planningConfig.tema },
        { icon: "⏰", label: "Duración", value: `${planningConfig.horas} horas` },
        { icon: "📚", label: "Sesiones", value: planningConfig.sesiones },
        { icon: "💻", label: "Recursos", value: planningConfig.recursos },
        { icon: "👤", label: "Docente", value: planningConfig.nombreDocente }
      ]

      planData.forEach(data => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.icon} ${data.label}: `,
                bold: true,
                size: 24,
                color: "2c3e50"
              }),
              new TextRun({
                text: data.value,
                size: 24,
                color: "2c3e50"
              })
            ],
            spacing: { after: 200 }
          })
        )
      })

      // Espacio antes de la conversación
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 600 }
        })
      )

      // Título de la conversación
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "💬 Conversación Completa",
              bold: true,
              size: 28,
              color: "27ae60"
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        })
      )

      // Agregar cada mensaje del chat
      messages.forEach((message, index) => {
        if (index === 0) return // Saltar mensaje inicial
        
        const sender = message.isUser ? '👤 Docente' : '🤖 Asistente IA'
        const timestamp = message.timestamp.toLocaleString('es-ES')
        const senderColor = message.isUser ? "e74c3c" : "27ae60"
        
        // Nombre del emisor
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sender,
                bold: true,
                size: 24,
                color: senderColor
              })
            ],
            spacing: { after: 100 }
          })
        )

        // Timestamp
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `📅 ${timestamp}`,
                size: 18,
                color: "7f8c8d",
                italics: true
              })
            ],
            spacing: { after: 200 }
          })
        )

        // Contenido del mensaje
        let cleanText = message.text
          .replace(/\*\*(.*?)\*\*/g, '$1') // Limpiar negritas
          .replace(/\*(.*?)\*/g, '$1') // Limpiar cursivas
          .replace(/^### (.*$)/gim, '$1') // Títulos como texto normal
          .replace(/^## (.*$)/gim, '$1') // Títulos como texto normal
          .replace(/^# (.*$)/gim, '$1') // Títulos como texto normal
          .replace(/^\- (.*$)/gim, '• $1') // Listas con viñetas
          .replace(/^\d+\. (.*$)/gim, '• $1') // Listas numeradas como viñetas

        // Dividir el texto en párrafos
        const textParagraphs = cleanText.split('\n').filter(p => p.trim() !== '')
        
        textParagraphs.forEach(textPara => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: textPara,
                  size: 22,
                  color: "2c3e50"
                })
              ],
              spacing: { after: 200 }
            })
          )
        })

        // Espacio entre mensajes
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: { after: 400 }
          })
        )
      })

      // Footer
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 600 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "✨ Fin del documento",
              bold: true,
              size: 24,
              color: "2c3e50"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `🤖 Generado automáticamente por el Asistente Pedagógico IA`,
              size: 18,
              color: "7f8c8d"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📅 ${new Date().toLocaleString('es-ES')}`,
              size: 18,
              color: "7f8c8d"
            })
          ],
          alignment: AlignmentType.CENTER
        })
      )

      // Crear el documento
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      })

      // Generar y descargar el archivo
      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      })
      
      const fileName = `plan-clase-${planningConfig.tema.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`
      saveAs(blob, fileName)

      alert('✅ Chat exportado exitosamente como Word')
    } catch (error) {
      console.error('❌ Error exportando chat:', error)
      alert('❌ Error al exportar el chat')
    }
  }

  // Función para limpiar el chat
  const clearChat = () => {
    if (messages.length <= 1) {
      alert('La conversación ya está limpia')
      return
    }

    if (confirm('¿Estás seguro de que quieres limpiar toda la conversación? Esta acción no se puede deshacer.')) {
      setMessages([]) // Limpiar todos los mensajes
      setIsConfigured(false) // Reiniciar configuración
      setPlanningConfig({ // Limpiar configuración
        grado: '',
        asignatura: '',
        tema: '',
        horas: '',
        sesiones: '',
        recursos: '',
        nombreDocente: '',
        // Campos para consulta automática de documentos institucionales
        consultarPEI: true,
        consultarModeloPedagogico: true,
        filtrosInstitucionales: ['Orientaciones Curriculares', 'Estructuras de Planes de Clase', 'Proyectos Educativos', 'Modelos Pedagógicos']
      })
      geminiService.resetChat() // Reiniciar chat de Gemini
      alert('✅ Conversación y configuración limpiadas exitosamente')
    }
  }

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header del Chat - Estilo Apple */}
      <div className="bg-white border-b border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">💬 Asistente Pedagógico IA</h2>
            <p className="text-lg text-gray-500 font-light">
              Sistema de planeación inteligente con inteligencia artificial
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={clearChat}
              disabled={isLoading || isSaving}
              className="px-6 py-3 text-sm bg-gray-100/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-gray-200/80 disabled:opacity-50 transition-all duration-300 font-medium shadow-md shadow-gray-200/50 hover:shadow-lg hover:shadow-gray-200/60"
              title="Limpiar conversación"
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={exportToWord}
              disabled={isLoading || isSaving || !isConfigured}
              className="px-6 py-3 text-sm bg-blue-100/80 backdrop-blur-sm text-blue-700 rounded-2xl hover:bg-blue-200/80 disabled:opacity-50 transition-all duration-300 font-medium shadow-md shadow-blue-200/50 hover:shadow-lg hover:shadow-blue-200/60"
              title="Exportar chat completo como Word"
            >
              📄 Exportar Word
            </button>
                <button
              onClick={saveChatToDatabase}
              disabled={isLoading || isSaving || !isConfigured}
              className="px-6 py-3 text-sm bg-green-100/80 backdrop-blur-sm text-green-700 rounded-2xl hover:bg-green-200/80 disabled:opacity-50 transition-all duration-300 font-medium shadow-md shadow-green-200/50 hover:shadow-lg hover:shadow-green-200/60"
              title="Guardar planeación"
            >
              💾 Guardar
                </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Formulario de Configuración Inicial */}
        {!isConfigured && sessionRestored && (
          <ConfigurationForm 
            planningConfig={planningConfig} 
            setPlanningConfig={setPlanningConfig} 
            onSubmit={() => {
              setIsConfigured(true)
              if (configShownRef.current) {
                return
              }
              const configMessage: Message = {
                id: Date.now().toString(),
                text: `✅ **CONFIGURACIÓN COMPLETADA EXITOSAMENTE**

**🎯 Detalles de tu planeación:**
• **Grado:** ${planningConfig.grado}
• **Asignatura:** ${planningConfig.asignatura}
• **Tema:** ${planningConfig.tema}
• **Duración:** ${planningConfig.horas} horas
• **Sesiones:** ${planningConfig.sesiones}

**🔍 Consulta automática de documentos institucionales:**
• **PEI:** ${planningConfig.consultarPEI ? '✅ Habilitado' : '❌ Deshabilitado'}
• **Modelo Pedagógico:** ${planningConfig.consultarModeloPedagogico ? '✅ Habilitado' : '❌ Deshabilitado'}

**🚀 ¡Sistema listo!** 
El chat ya está habilitado y puedes comenzar a escribir tu consulta específica.

**💡 Próximo paso:** Escribe tu consulta en el campo de texto de abajo para generar el plan de clase personalizado.`,
                isUser: false,
                timestamp: new Date(),
                isFormatted: true,
              }
              setMessages(prev => [...prev, configMessage])
              configShownRef.current = true
            }}
          />
        )}
        
        {/* Documentos consultados en tiempo real */}
        {isConfigured && (consultedDocuments.pei.length > 0 || consultedDocuments.modeloPedagogico.length > 0 || consultedDocuments.orientacionesCurriculares.length > 0 || consultedDocuments.relevantDocs.length > 0) && (
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 shadow-lg shadow-blue-200/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-blue-900">Documentos Consultados en Tiempo Real</h3>
            </div>
            
            <div className="space-y-4">
              {/* PEI */}
              {consultedDocuments.pei.length > 0 && (
                <div className="bg-white/60 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span className="font-medium text-gray-800">PEI (Proyecto Educativo Institucional)</span>
                    <span className="text-sm text-gray-500">({consultedDocuments.pei.length} documento{consultedDocuments.pei.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="space-y-1">
                    {consultedDocuments.pei.map((doc, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-white/40 rounded-lg p-2">
                        📄 {doc.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Modelo Pedagógico */}
              {consultedDocuments.modeloPedagogico.length > 0 && (
                <div className="bg-white/60 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span className="font-medium text-gray-800">Modelo Pedagógico</span>
                    <span className="text-sm text-gray-500">({consultedDocuments.modeloPedagogico.length} documento{consultedDocuments.modeloPedagogico.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="space-y-1">
                    {consultedDocuments.modeloPedagogico.map((doc, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-white/40 rounded-lg p-2">
                        📄 {doc.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Orientaciones Curriculares */}
              {consultedDocuments.orientacionesCurriculares.length > 0 && (
                <div className="bg-white/60 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span className="font-medium text-gray-800">Orientaciones Curriculares</span>
                    <span className="text-sm text-gray-500">({consultedDocuments.orientacionesCurriculares.length} documento{consultedDocuments.orientacionesCurriculares.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="space-y-1">
                    {consultedDocuments.orientacionesCurriculares.map((doc, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-white/40 rounded-lg p-2">
                        📄 {doc.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Documentos Relevantes por Consulta */}
              {consultedDocuments.relevantDocs.length > 0 && (
                <div className="bg-white/60 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600 font-bold">🔍</span>
                    <span className="font-medium text-gray-800">Documentos Relevantes por Consulta</span>
                    <span className="text-sm text-gray-500">({consultedDocuments.relevantDocs.length} documento{consultedDocuments.relevantDocs.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="space-y-1">
                    {consultedDocuments.relevantDocs.map((doc, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-white/40 rounded-lg p-2">
                        📄 {doc.title} <span className="text-xs text-gray-500">({doc.doc_type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mensaje inicial del asistente */}
        {!isConfigured && sessionRestored && (
        <div className="space-y-4">
          <div className="flex justify-start">
            <div className="max-w-3xl px-4 py-3 rounded-lg backdrop-blur-sm bg-white/80 border border-white/50 shadow-lg shadow-gray-200/60">
              {initialMessage.isFormatted ? (
                <div 
                  className="prose prose-sm max-w-none"
                  style={{
                    lineHeight: '1.7',
                    fontSize: '16px'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: `
                      <style>
                        .prose li { margin-bottom: 8px; }
                        .prose h1, .prose h2, .prose h3 { color: #1f2937; }
                        .prose strong { color: #1f2937; font-weight: 600; }
                        .prose code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
                        .prose pre { background-color: #f3f4f6; padding: 12px; border-radius: 6px; border: 1px solid #d1d5db; }
                      </style>
                      ${initialMessage.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/```(.*?)```/g, '<pre><code>$1</code></pre>')
                        .replace(/`(.*?)`/g, '<code>$1</code>')
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                        .replace(/^- (.*$)/gm, '<li>• $1</li>')
                        .replace(/^\d+\. (.*$)/gm, '<li>$&</li>')
                        .replace(/\n\n/g, '<br><br>')
                        .replace(/\n/g, '<br>')
                      }
                    `
                  }} 
                />
              ) : (
                <p className="whitespace-pre-wrap">{initialMessage.text}</p>
              )}
            </div>
          </div>
        </div>
        )}
        
        {/* Mensajes del Chat - Siempre visible */}
        <div className="space-y-4">
        {messages.map((message) => {
          // Debug: verificar si hay mensajes con contenido del mensaje inicial
          if (message.text.includes('ASISTENTE PEDAGÓGICO INTELIGENTE')) {
            console.log('🚨 Mensaje inicial encontrado en array messages:', message)
          }
          return (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg backdrop-blur-sm ${
                  message.isUser
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-white/80 border border-white/50 shadow-lg shadow-gray-200/60'
                }`}
              >
                {message.isFormatted ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    style={{
                      lineHeight: '1.6',
                      fontSize: '14px'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: `
                        <style>
                          .prose li { margin-bottom: 8px; }
                          .prose h1, .prose h2, .prose h3 { color: #1f2937; }
                          .prose strong { color: #1f2937; font-weight: 600; }
                          .prose code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
                          .prose pre { background-color: #f3f4f6; padding: 12px; border-radius: 6px; border: 1px solid #d1d5db; }
                        </style>
                        ${message.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/```(.*?)```/g, '<pre><code>$1</code></pre>')
                          .replace(/`(.*?)`/g, '<code>$1</code>')
                          .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                          .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                          .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                          .replace(/^- (.*$)/gm, '<li>• $1</li>')
                          .replace(/^\d+\. (.*$)/gm, '<li>$&</li>')
                          .replace(/\n\n/g, '<br><br>')
                          .replace(/\n/g, '<br>')
                        }
                      `
                    }} 
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                )}
                <div className={`text-xs mt-2 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
            </div>
          </div>
          )
        })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl px-4 py-3 rounded-lg backdrop-blur-sm bg-white/80 border border-white/50 shadow-lg shadow-gray-200/60">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-blue-600/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-blue-600/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-gray-600 text-sm">El asistente está pensando...</span>
                  <span className="sr-only">Generando respuesta</span>
              </div>
            </div>
          </div>
        )}
          
        <div ref={messagesEndRef} />
        </div>
      </div>

                 {/* Input del Chat - Siempre visible */}
           <div className="bg-white border-t border-gray-100 p-8">
               <form onSubmit={handleSubmit} className="flex gap-6">
      <input
                   type="text"
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
            placeholder={isConfigured ? "Escribe tu consulta específica para el plan de clase..." : "Completa la configuración inicial para habilitar el chat"}
            className="flex-1 px-8 py-5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duración-300 text-gray-900 placeholder-gray-500 text-lg bg-white"
            disabled={!isConfigured || isLoading || isSaving}
        />
        <button
                   type="submit"
            disabled={!isConfigured || !inputText.trim() || isLoading || isSaving}
            className="px-10 py-5 bg-gray-900/90 backdrop-blur-sm text-white rounded-2xl hover:bg-gray-800/90 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:opacity-50 transition-all duración-300 font-medium text-lg shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transform hover:-translate-y-0.5 disabled:transform-none"
                 >
                   {isLoading ? '🔄' : '📤'} Enviar
        </button>
        <button
          type="button"
          onClick={() => { try { abortControllerRef.current?.abort(); } catch {} finally { setIsLoading(false) } }}
          disabled={!isLoading}
          className="px-8 py-5 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 transition-all duración-300 font-medium text-lg"
          title="Cancelar generación"
        >
          ✖️ Cancelar
        </button>
               </form>
      </div>
    </div>
  )
}
