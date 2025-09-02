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
    if (planningConfig.grado && planningConfig.asignatura && planningConfig.tema && planningConfig.horas && planningConfig.sesiones && planningConfig.recursos && planningConfig.nombreDocente) {
      onSubmit()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setPlanningConfig((prev: PlanningConfig) => ({ ...prev, [field]: value }))
  }

           return (
           <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-12 mb-8 shadow-lg shadow-black/5">
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
                     className="w-full px-6 py-4 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
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
                     className="w-full px-6 py-4 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
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
                     className="w-full px-6 py-4 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                     required
                   />
                 </div>
                 
                 <div className="space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Duración Total (horas) *
                   </label>
                   <input
                     type="number"
                     min="1"
                     max="20"
                     value={planningConfig.horas}
                     onChange={(e) => handleInputChange('horas', e.target.value)}
                     placeholder="Ej: 2, 4, 6..."
                     className="w-full px-6 py-4 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                     required
                   />
                 </div>
                 
                 <div className="space-y-3">
                   <label className="block text-lg font-medium text-gray-900 mb-3">
                     Número de Sesiones *
                   </label>
                   <input
                     type="number"
                     min="1"
                     max="10"
                     value={planningConfig.sesiones}
                     onChange={(e) => handleInputChange('sesiones', e.target.value)}
                     placeholder="Ej: 2, 3, 4..."
                     className="w-full px-6 py-4 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                     required
                   />
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
                     className="w-full px-6 py-4 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
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
                     className="w-full px-6 py-4 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                     required
                   />
                 </div>
          
                           {/* Sección de Consulta Automática de Documentos Institucionales */}
                 <div className="md:col-span-2">
                   <div className="border-t border-gray-200 pt-8">
                     <h4 className="text-xl font-light text-gray-900 mb-6 flex items-center">
                       <span className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mr-4">
                         <span className="text-gray-600 text-lg">🔍</span>
                       </span>
                       Consulta Automática de Documentos Institucionales
                     </h4>
                     
                     <div className="space-y-4">
                       <div className="flex items-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                         <input
                           type="checkbox"
                           id="consultarPEI"
                           checked={planningConfig.consultarPEI}
                           onChange={(e) => handleInputChange('consultarPEI', e.target.checked.toString())}
                           className="w-6 h-6 text-gray-600 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                         />
                         <label htmlFor="consultarPEI" className="ml-4 text-gray-800 font-medium text-lg">
                           ✅ Consultar automáticamente el PEI de la institución
                         </label>
                       </div>
                       
                       <div className="flex items-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                         <input
                           type="checkbox"
                           id="consultarModeloPedagogico"
                           checked={planningConfig.consultarModeloPedagogico}
                           onChange={(e) => handleInputChange('consultarModeloPedagogico', e.target.checked.toString())}
                           className="w-6 h-6 text-gray-600 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                         />
                         <label htmlFor="consultarModeloPedagogico" className="ml-4 text-gray-800 font-medium text-lg">
                           🎯 Consultar automáticamente el modelo pedagógico institucional
                         </label>
                       </div>
                       
                       <div className="ml-6 p-6 bg-gray-100 rounded-2xl">
                         <p className="text-gray-600 leading-relaxed">
                           💡 Estos documentos se consultarán automáticamente antes de cada generación de contenido para asegurar coherencia institucional.
                         </p>
                       </div>
                     </div>
                   </div>
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
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
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

**💡 Antes de comenzar:** Completa la configuración inicial para personalizar tu planeación.`,
      isUser: false,
      timestamp: new Date(),
      isFormatted: true,
    }
  ])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Actualizar mensaje inicial cuando cambie el estado de los documentos
  useEffect(() => {
    if (messages.length > 0) {
      const updatedMessages = [...messages]
      const initialMessage = updatedMessages[0]
      
      if (documentsLoading) {
        initialMessage.text = `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

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

**💡 Antes de comenzar:** Completa la configuración inicial para personalizar tu planeación.`
      } else if (documentsError) {
        initialMessage.text = `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

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

**💡 Antes de comenzar:** Completa la configuración inicial para personalizar tu planeación.`
      } else if (bucketDocuments.length > 0) {
        initialMessage.text = `🎓 **ASISTENTE PEDAGÓGICO INTELIGENTE**

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

**💡 Antes de comenzar:** Completa la configuración inicial para personalizar tu planeación.`
      }
      
      setMessages(updatedMessages)
    }
  }, [documentsLoading, documentsError, bucketDocuments, documentCount])

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
      
      return relevantDocs
      
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
      
      // Eliminar duplicados basados en ID
      const uniqueDocs = relevantFiles.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      )
      
      // Usar Gemini para generar el plan de clase
      const geminiResponse = await geminiService.generateClassPlan(
        analysis.grado,
        analysis.tema,
        analysis.context,
        uniqueDocs,
        planningConfig.recursos,
        planningConfig.nombreDocente
      )
      
      if (geminiResponse.success) {
        return geminiResponse.text
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
      
      // Generar respuesta estructurada basada en los documentos disponibles
      let response = `🎓 **PLAN DE CLASE GENERADO (Sistema de Fallback)**

**Información de la Planeación:**
• **Grado:** ${analysis.grado}
• **Asignatura:** ${analysis.asignatura}
• **Tema:** ${analysis.tema}
• **Duración:** ${analysis.horas} horas
• **Sesiones:** ${analysis.sesiones}

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
   • Usar recursos disponibles

**4. EVALUACIÓN**
   • Criterios alineados con el PEI
   • Instrumentos del modelo pedagógico
   • Estándares curriculares oficiales

**💡 Recomendación:** Revisa los documentos específicos listados arriba para obtener detalles más precisos sobre la implementación de este plan de clase.`

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
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Buscar documentos relevantes usando el sistema vectorial
      const relevantDocs = await searchRelevantDocuments(inputText)
      
      // Generar respuesta pedagógica
      const aiResponse = await generatePedagogicalResponse(inputText, relevantDocs)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        isFormatted: true,
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Notificar actualización del chat
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
        chat_history: messages,
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
      setMessages([messages[0]]) // Mantener solo el mensaje inicial
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
        {!isConfigured && (
          <ConfigurationForm 
            planningConfig={planningConfig} 
            setPlanningConfig={setPlanningConfig} 
            onSubmit={() => {
              setIsConfigured(true)
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
            }}
          />
        )}
        
        {/* Mensajes del Chat - Siempre visible */}
        <div className="space-y-4">
        {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg backdrop-blur-sm ${
                  message.isUser
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-white/70 border border-white/40 shadow-md shadow-gray-200/50'
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
        ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-600"></div>
                  <span className="text-gray-600">Generando respuesta...</span>
              </div>
            </div>
          </div>
        )}
          
        <div ref={messagesEndRef} />
        </div>
      </div>

                 {/* Input del Chat - Siempre visible pero deshabilitado hasta confirmar */}
           <div className="bg-white border-t border-gray-100 p-8">
             {isConfigured ? (
               <form onSubmit={handleSubmit} className="flex gap-6">
      <input
                   type="text"
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   placeholder="Escribe tu consulta específica para el plan de clase..."
                   className="flex-1 px-8 py-5 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 text-gray-900 placeholder-gray-500 text-lg bg-white/50 backdrop-blur-sm"
                   disabled={isLoading || isSaving}
        />
        <button
                   type="submit"
                   disabled={!inputText.trim() || isLoading || isSaving}
                   className="px-10 py-5 bg-gray-900/90 backdrop-blur-sm text-white rounded-2xl hover:bg-gray-800/90 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:opacity-50 transition-all duration-300 font-medium text-lg shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transform hover:-translate-y-0.5 disabled:transform-none"
                 >
                   {isLoading ? '🔄' : '📤'} Enviar
        </button>
               </form>
             ) : (
               <div className="text-center text-gray-500">
                 <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                   <span className="text-gray-400 text-2xl">💡</span>
                 </div>
                 <p className="text-gray-600 font-medium text-lg">
                   <strong>Completa la configuración inicial</strong> para comenzar a usar el chat
                 </p>
               </div>
             )}
      </div>
    </div>
  )
}
