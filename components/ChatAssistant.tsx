"use client"

import { useState, useEffect, useRef } from 'react'
import { vectorSearchService, SearchResult } from '../lib/vector-search'
import { createClient } from '@supabase/supabase-js'
import { 
  getAllEducationalContent, 
  EducationalDocument, 
  PlanStructure 
} from '../lib/educational-content-service'
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
    if (planningConfig.grado && planningConfig.asignatura && planningConfig.tema && planningConfig.horas && planningConfig.sesiones) {
      onSubmit()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setPlanningConfig((prev: PlanningConfig) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">⚙️ Configuración Inicial Requerida</h3>
        <p className="text-sm text-blue-600">
          Antes de continuar, necesito que configures los parámetros básicos de tu planeación
        </p>
      </div>
      
      <form onSubmit={handleConfigSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Grado *
            </label>
            <select
              value={planningConfig.grado}
              onChange={(e) => handleInputChange('grado', e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Asignatura *
            </label>
            <input
              type="text"
              value={planningConfig.asignatura}
              onChange={(e) => handleInputChange('asignatura', e.target.value)}
              placeholder="Ej: Matemáticas, Ciencias, Español..."
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Tema Específico *
            </label>
            <input
              type="text"
              value={planningConfig.tema}
              onChange={(e) => handleInputChange('tema', e.target.value)}
              placeholder="Ej: Suma y resta, Ecosistemas, Poesía..."
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Duración Total (horas) *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={planningConfig.horas}
              onChange={(e) => handleInputChange('horas', e.target.value)}
              placeholder="Ej: 2, 4, 6..."
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Número de Sesiones *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={planningConfig.sesiones}
              onChange={(e) => handleInputChange('sesiones', e.target.value)}
              placeholder="Ej: 2, 3, 4..."
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Sección de Consulta Automática de Documentos Institucionales */}
          <div className="md:col-span-2">
            <div className="border-t border-blue-200 pt-4">
              <h4 className="text-sm font-medium text-blue-800 mb-3">🔍 Consulta Automática de Documentos Institucionales</h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="consultarPEI"
                    checked={planningConfig.consultarPEI}
                    onChange={(e) => handleInputChange('consultarPEI', e.target.checked.toString())}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="consultarPEI" className="ml-2 text-sm text-blue-700">
                    ✅ Consultar automáticamente el PEI de la institución
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="consultarModeloPedagogico"
                    checked={planningConfig.consultarModeloPedagogico}
                    onChange={(e) => handleInputChange('consultarModeloPedagogico', e.target.checked.toString())}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="consultarModeloPedagogico" className="ml-2 text-sm text-blue-700">
                    🎯 Consultar automáticamente el modelo pedagógico institucional
                  </label>
                </div>
                
                <div className="ml-6 text-xs text-blue-600">
                  <p>💡 Estos documentos se consultarán automáticamente antes de cada generación de contenido para asegurar coherencia institucional.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            ✅ Confirmar Configuración
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
        console.log('⚠️ No hay documentos disponibles para buscar')
        return []
      }
      
      console.log(`🔍 **BÚSQUEDA EN DOCUMENTOS ACTIVA**`)
      console.log(`📚 Total de documentos disponibles: ${bucketDocuments.length}`)
      console.log(`🔎 Consulta del usuario: "${query}"`)
      
      // Buscar documentos que contengan la consulta
      const relevantDocs = bucketDocuments.filter(doc => {
        const titleMatch = doc.title.toLowerCase().includes(query.toLowerCase())
        const contentMatch = doc.content.toLowerCase().includes(query.toLowerCase())
        const typeMatch = doc.doc_type.toLowerCase().includes(query.toLowerCase())
        
        if (titleMatch || contentMatch || typeMatch) {
          console.log(`✅ Documento relevante encontrado: ${doc.title} (${doc.doc_type})`)
          return true
        }
        return false
      })
      
      console.log(`🎯 **RESULTADO DE BÚSQUEDA:**`)
      console.log(`📊 Documentos relevantes encontrados: ${relevantDocs.length}`)
      
      if (relevantDocs.length > 0) {
        relevantDocs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.title} (${doc.doc_type})`)
        })
      } else {
        console.log(`⚠️ No se encontraron documentos específicos para: "${query}"`)
        console.log(`💡 El agente usará el contexto general de los ${bucketDocuments.length} documentos disponibles`)
      }
      
      return relevantDocs
      
    } catch (error) {
      console.error('❌ Error buscando documentos:', error)
      return []
    }
  }

  // Función para generar respuesta pedagógica usando Gemini
  const generatePedagogicalResponse = async (userInput: string, relevantDocs: PDFContent[]): Promise<string> => {
    try {
      console.log('🤖 **GENERACIÓN DE RESPUESTA PEDAGÓGICA INICIADA**')
      console.log('📝 Entrada del usuario:', userInput)
      console.log('📚 Documentos relevantes pre-filtrados:', relevantDocs.length)
      
      // Analizar entrada del usuario
      const analysis = analyzeUserInput(userInput)
      console.log('📊 Análisis de entrada:', analysis)
      
      // CONSULTA AUTOMÁTICA DE DOCUMENTOS INSTITUCIONALES
      console.log('🏛️ **INICIANDO CONSULTA AUTOMÁTICA DE DOCUMENTOS INSTITUCIONALES**')
      const documentosInstitucionales = await consultarDocumentosInstitucionales()
      
      // Combinar documentos relevantes de la consulta con documentos institucionales
      let relevantFiles = [...relevantDocs]
      
      // Agregar PEI si está habilitado
      if (planningConfig.consultarPEI && documentosInstitucionales.pei.length > 0) {
        console.log('✅ Agregando documentos del PEI a la consulta')
        relevantFiles.push(...documentosInstitucionales.pei)
      }
      
      // Agregar Modelo Pedagógico si está habilitado
      if (planningConfig.consultarModeloPedagogico && documentosInstitucionales.modeloPedagogico.length > 0) {
        console.log('✅ Agregando documentos del Modelo Pedagógico a la consulta')
        relevantFiles.push(...documentosInstitucionales.modeloPedagogico)
      }
      
      // Agregar Orientaciones Curriculares
      if (documentosInstitucionales.orientacionesCurriculares.length > 0) {
        console.log('✅ Agregando Orientaciones Curriculares a la consulta')
        relevantFiles.push(...documentosInstitucionales.orientacionesCurriculares)
      }
      
      // Buscar documentos adicionales si no hay suficientes
      if (relevantFiles.length === 0) {
        console.log('🔍 **BÚSQUEDA ADICIONAL DE DOCUMENTOS**')
        const docsAdicionales = await searchRelevantDocuments(userInput)
        relevantFiles.push(...docsAdicionales)
        console.log('📚 Documentos encontrados en búsqueda adicional:', docsAdicionales.length)
      }
      
      // Eliminar duplicados basados en ID
      const uniqueDocs = relevantFiles.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      )
      
      console.log('🚀 **ENVIANDO A GEMINI CON CONTEXTO INSTITUCIONAL COMPLETO**')
      console.log('📋 Parámetros para Gemini:', {
        grado: analysis.grado,
        tema: analysis.tema,
        asignatura: analysis.asignatura,
        horas: analysis.horas,
        sesiones: analysis.sesiones,
        context: analysis.context,
        relevantDocsCount: uniqueDocs.length,
        totalDocsAvailable: bucketDocuments.length,
        peiIncluido: planningConfig.consultarPEI && documentosInstitucionales.pei.length > 0,
        modeloPedagogicoIncluido: planningConfig.consultarModeloPedagogico && documentosInstitucionales.modeloPedagogico.length > 0
      })
      
      // Mostrar qué documentos se están enviando a Gemini
      if (uniqueDocs.length > 0) {
        console.log('📖 **DOCUMENTOS COMPLETOS ENVIADOS A GEMINI:**')
        
        // Agrupar por tipo
        const docsPorTipo = {
          'PEI': uniqueDocs.filter(doc => 
            doc.title.toLowerCase().includes('pei') || 
            doc.title.toLowerCase().includes('proyecto educativo')
          ),
          'Modelo Pedagógico': uniqueDocs.filter(doc => 
            doc.title.toLowerCase().includes('modelo pedagógico') || 
            doc.title.toLowerCase().includes('enfoque pedagógico')
          ),
          'Orientaciones Curriculares': uniqueDocs.filter(doc => 
            doc.title.toLowerCase().includes('orientaciones') || 
            doc.title.toLowerCase().includes('curricular')
          ),
          'Otros': uniqueDocs.filter(doc => 
            !doc.title.toLowerCase().includes('pei') && 
            !doc.title.toLowerCase().includes('modelo pedagógico') && 
            !doc.title.toLowerCase().includes('orientaciones') && 
            !doc.title.toLowerCase().includes('curricular')
          )
        }
        
        Object.entries(docsPorTipo).forEach(([tipo, docs]) => {
          if (docs.length > 0) {
            console.log(`  📁 ${tipo}: ${docs.length} documentos`)
            docs.forEach((doc, index) => {
              console.log(`     ${index + 1}. ${doc.title} (${doc.doc_type})`)
              console.log(`        Contenido: ${doc.content.substring(0, 100)}...`)
            })
          }
        })
      } else {
        console.log('⚠️ **NO HAY DOCUMENTOS DISPONIBLES**')
        console.log('💡 Gemini usará el contexto general de todos los documentos disponibles')
      }
      
      // Usar Gemini para generar el plan de clase
      const geminiResponse = await geminiService.generateClassPlan(
        analysis.grado,
        analysis.tema,
        analysis.context,
        uniqueDocs
      )
      
      console.log('📨 **RESPUESTA DE GEMINI RECIBIDA:**')
      console.log('✅ Éxito:', geminiResponse.success)
      console.log('📝 Longitud:', geminiResponse.text?.length || 0)
      
      if (geminiResponse.success) {
        console.log('✅ **PLAN DE CLASE GENERADO EXITOSAMENTE**')
        console.log('🎯 Basado en:', uniqueDocs.length > 0 ? `${uniqueDocs.length} documentos (incluyendo institucionales)` : 'contexto general de documentos')
        return geminiResponse.text
      } else {
        console.error('❌ **ERROR EN GEMINI:**', geminiResponse.error)
        
        // Verificar si es error de cuota excedida
        if (geminiResponse.error && (geminiResponse.error.includes('quota') || geminiResponse.error.includes('429'))) {
          console.log('🔄 **CUOTA EXCEDIDA DETECTADA - ACTIVANDO SISTEMA DE FALLBACK**')
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
      console.log('🔄 **GENERANDO RESPUESTA DE FALLBACK** (Gemini excedió cuota)')
      
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
      
      console.log(`📚 Generando respuesta basada en ${uniqueDocs.length} documentos del bucket`)
      
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
      console.log('🏛️ **CONSULTA AUTOMÁTICA DE DOCUMENTOS INSTITUCIONALES**')
      
      if (bucketDocuments.length === 0) {
        console.log('⚠️ No hay documentos disponibles para consulta institucional')
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
      
      console.log('📋 **DOCUMENTOS INSTITUCIONALES ENCONTRADOS:**')
      console.log(`🏛️ PEI: ${peiDocs.length} documentos`)
      peiDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title} (${doc.doc_type})`)
      })
      
      console.log(`🎯 Modelo Pedagógico: ${modeloPedagogicoDocs.length} documentos`)
      modeloPedagogicoDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title} (${doc.doc_type})`)
      })
      
      console.log(`📚 Orientaciones Curriculares: ${orientacionesCurricularesDocs.length} documentos`)
      orientacionesCurricularesDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title} (${doc.doc_type})`)
      })
      
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

      console.log('💾 Guardando planeación en base de datos:', chatData)

      // Guardar en la base de datos
      const { data, error } = await supabase
        .from('planeaciones')
        .insert([chatData])
        .select()

      if (error) {
        console.error('❌ Error guardando planeación:', error)
        alert(`❌ Error al guardar: ${error.message}`)
      } else {
        console.log('✅ Planeación guardada exitosamente:', data)
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
  const exportToWord = () => {
    if (messages.length <= 1) {
      alert('No hay planeación para exportar')
      return
    }

    if (!isConfigured) {
      alert('Debes completar la configuración inicial antes de exportar')
      return
    }

    try {
      // Crear contenido HTML formateado con información de configuración
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Planeación Didáctica - Conversación Completa</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .config-info { background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
            .user { background-color: #f0f0f0; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; border-radius: 4px; }
            .assistant { background-color: #e8f5e8; padding: 10px; margin: 10px 0; border-left: 4px solid #28a745; border-radius: 4px; }
            .timestamp { color: #666; font-size: 12px; margin-top: 8px; }
            .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
            .config-item { background-color: white; padding: 8px; border-radius: 4px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Planeación Didáctica - Conversación Completa</h1>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            <p><strong>Generado por:</strong> Asistente Pedagógico IA</p>
          </div>
          
          <div class="config-info">
            <h2>📋 Configuración de la Planeación</h2>
            <div class="config-grid">
              <div class="config-item">
                <strong>Grado:</strong> ${planningConfig.grado}
              </div>
              <div class="config-item">
                <strong>Asignatura:</strong> ${planningConfig.asignatura}
              </div>
              <div class="config-item">
                <strong>Tema:</strong> ${planningConfig.tema}
              </div>
              <div class="config-item">
                <strong>Duración:</strong> ${planningConfig.horas} horas
              </div>
              <div class="config-item">
                <strong>Sesiones:</strong> ${planningConfig.sesiones}
              </div>
            </div>
          </div>
          
          <h2>💬 Conversación Completa</h2>
          <hr>
      `

      messages.forEach((message, index) => {
        if (index === 0) return // Saltar mensaje inicial
        
        const messageClass = message.isUser ? 'user' : 'assistant'
        const sender = message.isUser ? 'Usuario' : 'Asistente IA'
        
        htmlContent += `
          <div class="${messageClass}">
            <strong>${sender}:</strong><br>
            ${message.text.replace(/\n/g, '<br>')}
            <div class="timestamp">${message.timestamp.toLocaleString('es-ES')}</div>
          </div>
        `
      })

      htmlContent += `
        </body>
        </html>
      `

      // Crear y descargar archivo
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plan-clase-chat-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('✅ Planeación exportada exitosamente como HTML')
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
    <div className="flex flex-col h-full bg-gray-100 rounded-lg">
      {/* Header del Chat */}
      <div className="bg-white border-b border-gray-200 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">💬 Asistente Pedagógico IA</h2>
            <p className="text-sm text-gray-600">
              Sistema de planeación inteligente con IA
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={clearChat}
              disabled={isLoading || isSaving}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              title="Limpiar conversación"
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={exportToWord}
              disabled={isLoading || isSaving || !isConfigured}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              title="Exportar planeación"
            >
              📄 Exportar
            </button>
            <button
              onClick={saveChatToDatabase}
              disabled={isLoading || isSaving || !isConfigured}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
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
                text: `✅ **CONFIGURACIÓN INICIAL COMPLETADA**

**Detalles de la planeación:**
• **Grado:** ${planningConfig.grado}
• **Asignatura:** ${planningConfig.asignatura}
• **Tema:** ${planningConfig.tema}
• **Duración:** ${planningConfig.horas} horas
• **Sesiones:** ${planningConfig.sesiones}

**🔍 Consulta automática de documentos institucionales:**
• **PEI:** ${planningConfig.consultarPEI ? '✅ Habilitado' : '❌ Deshabilitado'}
• **Modelo Pedagógico:** ${planningConfig.consultarModeloPedagogico ? '✅ Habilitado' : '❌ Deshabilitado'}

**Estado:** Sistema listo para generar el plan de clase
**Próximo paso:** Escribe tu consulta específica en el chat de abajo.

💡 **Nota:** El sistema consultará automáticamente los documentos institucionales antes de cada generación para asegurar coherencia con la identidad de la institución.`,
                isUser: false,
                timestamp: new Date(),
                isFormatted: true,
              }
              setMessages(prev => [...prev, configMessage])
            }}
          />
        )}
        
        {/* Mensajes del Chat */}
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
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

      {/* Input del Chat - Solo visible si está configurado */}
      {isConfigured && (
        <div className="bg-white border-t border-gray-200 p-4 rounded-b-lg">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu consulta específica para el plan de clase..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || isSaving}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading || isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '🔄' : '📤'} Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
