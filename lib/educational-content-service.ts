// Servicio para acceder al contenido educativo del bucket de Supabase
import { createClient } from '@supabase/supabase-js'

// Cliente principal de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente de storage con credenciales específicas
const storageClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_STORAGE_ACCESS_KEY}`,
        'apikey': process.env.SUPABASE_STORAGE_SECRET_KEY!
      }
    }
  }
)

export interface EducationalDocument {
  id: string
  title: string
  content: string
  doc_type: 'plan' | 'revision' | 'orientaciones' | 'pei'
  metadata: {
    grado?: string
    tema?: string
    componente?: string
    competencia?: string
    estrategia?: string
    [key: string]: any
  }
}

export interface PlanStructure {
  id: string
  title: string
  sections: PlanSection[]
}

export interface PlanSection {
  name: string
  content: string
  subsections?: PlanSubsection[]
}

export interface PlanSubsection {
  name: string
  content: string
}

/**
 * Obtiene la estructura oficial del Plan de Clases desde el bucket
 */
export async function getOfficialPlanStructure(): Promise<PlanStructure | null> {
  try {
    
    // Buscar archivos que contengan la estructura oficial
    const { data: files, error: listError } = await supabase.storage
      .from('educacion')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      console.error('❌ Error listando archivos:', listError)
      return null
    }

    // Buscar archivos de estructura oficial
    const officialFiles = files.filter(file => 
      file.name.toLowerCase().includes('estructura') ||
      file.name.toLowerCase().includes('oficial') ||
      file.name.toLowerCase().includes('plan') ||
      file.name.toLowerCase().includes('clases')
    )

    if (officialFiles.length === 0) {
      return null
    }

    // Leer el primer archivo oficial
    const officialFile = officialFiles[0]
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('educacion')
      .download(officialFile.name)

    if (downloadError) {
      console.error('❌ Error descargando archivo oficial:', downloadError)
      return null
    }

    const content = await fileData.text()

    // Parsear la estructura del documento
    return parsePlanStructure(content, officialFile.name)
    
  } catch (error) {
    console.error('❌ Error obteniendo estructura oficial:', error)
    return null
  }
}

/**
 * Obtiene las Orientaciones Curriculares del MEN 2022
 */
export async function getMENOrientations(): Promise<EducationalDocument[]> {
  try {
    
    const { data: files, error } = await supabase.storage
      .from('educacion')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('❌ Error listando archivos:', error)
      return []
    }

    // Buscar archivos de orientaciones curriculares
    const orientationFiles = files.filter(file => 
      file.name.toLowerCase().includes('orientaciones') ||
      file.name.toLowerCase().includes('curriculares') ||
      file.name.toLowerCase().includes('men') ||
      file.name.toLowerCase().includes('2022')
    )

    const documents: EducationalDocument[] = []
    
    for (const file of orientationFiles) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('educacion')
          .download(file.name)

        if (!downloadError && fileData) {
          const content = await fileData.text()
          documents.push({
            id: file.id,
            title: file.name,
            content: content,
            doc_type: 'orientaciones',
            metadata: {
              doc_type: 'orientaciones',
              source: 'MEN 2022'
            }
          })
        }
      } catch (error) {
        console.error(`Error leyendo archivo ${file.name}:`, error)
      }
    }

    return documents
    
  } catch (error) {
    console.error('❌ Error obteniendo orientaciones curriculares:', error)
    return []
  }
}

/**
 * Obtiene la revisión sistemática del modelo crítico-social
 */
export async function getCriticalSocialModel(): Promise<EducationalDocument[]> {
  try {
    
    const { data: files, error } = await supabase.storage
      .from('educacion')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('❌ Error listando archivos:', error)
      return []
    }

    // Buscar archivos del modelo crítico-social
    const modelFiles = files.filter(file => 
      file.name.toLowerCase().includes('crítico') ||
      file.name.toLowerCase().includes('social') ||
      file.name.toLowerCase().includes('modelo') ||
      file.name.toLowerCase().includes('revisión') ||
      file.name.toLowerCase().includes('sistemática')
    )

    const documents: EducationalDocument[] = []
    
    for (const file of modelFiles) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('educacion')
          .download(file.name)

        if (!downloadError && fileData) {
          const content = await fileData.text()
          documents.push({
            id: file.id,
            title: file.name,
            content: content,
            doc_type: 'revision',
            metadata: {
              doc_type: 'revision',
              model: 'crítico-social'
            }
          })
        }
      } catch (error) {
        console.error(`Error leyendo archivo ${file.name}:`, error)
      }
    }

    return documents
    
  } catch (error) {
    console.error('❌ Error obteniendo modelo crítico-social:', error)
    return []
  }
}

/**
 * Obtiene el PEI institucional
 */
export async function getPEI(): Promise<EducationalDocument[]> {
  try {
    
    const { data: files, error } = await supabase.storage
      .from('educacion')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('❌ Error listando archivos:', error)
      return []
    }

    // Buscar archivos del PEI
    const peiFiles = files.filter(file => 
      file.name.toLowerCase().includes('pei') ||
      file.name.toLowerCase().includes('institucional') ||
      file.name.toLowerCase().includes('proyecto') ||
      file.name.toLowerCase().includes('educativo')
    )

    const documents: EducationalDocument[] = []
    
    for (const file of peiFiles) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('educacion')
          .download(file.name)

        if (!downloadError && fileData) {
          const content = await fileData.text()
          documents.push({
            id: file.id,
            title: file.name,
            content: content,
            doc_type: 'pei',
            metadata: {
              doc_type: 'pei',
              institution: 'IE Camilo Torres'
            }
          })
        }
      } catch (error) {
        console.error(`Error leyendo archivo ${file.name}:`, error)
      }
    }

    return documents
    
  } catch (error) {
    console.error('❌ Error obteniendo PEI:', error)
    return []
  }
}

/**
 * Parsea la estructura del plan desde el contenido del documento
 */
function parsePlanStructure(content: string, fileName: string): PlanStructure {
  try {
    const lines = content.split('\n').filter(line => line.trim())
    const sections: PlanSection[] = []
    let currentSection: PlanSection | null = null
    let currentSubsection: PlanSubsection | null = null
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Detectar secciones principales
      if (trimmedLine.match(/^#{1,3}\s+/) || 
          (trimmedLine.match(/^[A-Z\s]+$/) && trimmedLine.length > 5)) {
        
        // Guardar sección anterior
        if (currentSection) {
          if (currentSubsection) {
            currentSection.subsections = currentSection.subsections || []
            currentSection.subsections.push(currentSubsection)
          }
          sections.push(currentSection)
        }
        
        // Crear nueva sección
        currentSection = {
          name: trimmedLine.replace(/^#{1,3}\s+/, ''),
          content: '',
          subsections: []
        }
        currentSubsection = null
        
      } else if (trimmedLine.match(/^[A-Z][a-z\s]+:$/) && currentSection) {
        // Detectar subsecciones
        if (currentSubsection) {
          currentSection.subsections = currentSection.subsections || []
          currentSection.subsections.push(currentSubsection)
        }
        
        currentSubsection = {
          name: trimmedLine.replace(':', ''),
          content: ''
        }
        
      } else if (currentSubsection) {
        // Agregar contenido a la subsección
        currentSubsection.content += (currentSubsection.content ? '\n' : '') + trimmedLine
        
      } else if (currentSection) {
        // Agregar contenido a la sección
        currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine
      }
    }
    
    // Agregar la última sección
    if (currentSection) {
      if (currentSubsection) {
        currentSection.subsections = currentSection.subsections || []
        currentSection.subsections.push(currentSubsection)
      }
      sections.push(currentSection)
    }
    
    return {
      id: fileName,
      title: `Plan de Clases - ${fileName}`,
      sections
    }
    
  } catch (error) {
    console.error('Error parseando estructura del plan:', error)
    return {
      id: fileName,
      title: `Plan de Clases - ${fileName}`,
      sections: []
    }
  }
}

/**
 * Obtiene todos los documentos educativos necesarios para generar el plan
 */
export async function getAllEducationalContent(): Promise<{
  planStructure: PlanStructure | null
  menOrientations: EducationalDocument[]
  criticalSocialModel: EducationalDocument[]
  pei: EducationalDocument[]
}> {
  try {
    
    const [planStructure, menOrientations, criticalSocialModel, pei] = await Promise.all([
      getOfficialPlanStructure(),
      getMENOrientations(),
      getCriticalSocialModel(),
      getPEI()
    ])
    
    
    return {
      planStructure,
      menOrientations,
      criticalSocialModel,
      pei
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo contenido educativo:', error)
    return {
      planStructure: null,
      menOrientations: [],
      criticalSocialModel: [],
      pei: []
    }
  }
}
