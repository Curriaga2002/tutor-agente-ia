// Tipos centralizados para toda la aplicación

export interface User {
  id: string
  email: string
  isAdmin: boolean
}

export interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isFormatted?: boolean
}

export interface PlanningConfig {
  grado: string
  asignatura: string
  tema: string
  horas: string
  sesiones: string
  recursos: string
  nombreDocente: string
  consultarPEI: boolean
  consultarModeloPedagogico: boolean
  filtrosInstitucionales: string[]
}

export interface Planeacion {
  id: string
  grado: string
  tema: string
  duracion: string
  sesiones: number
  contenido: any
  chat_history?: Message[]
  created_at: string
  user_id?: string
}

export interface PDFContent {
  id: string
  title: string
  content: string
  doc_type: string
  metadata?: {
    [key: string]: any
  }
}

export interface ConsultedDocuments {
  pei: PDFContent[]
  modeloPedagogico: PDFContent[]
  orientacionesCurriculares: PDFContent[]
  tabla7: PDFContent[]
  relevantDocs: PDFContent[]
}

export interface AppState {
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

export interface ChatState {
  messages: Message[]
  isConfigured: boolean
  planningConfig: PlanningConfig
  isLoading: boolean
  isSaving: boolean
  consultedDocuments: ConsultedDocuments
}

export interface PlanningState {
  currentPlanningData: Planeacion | null
  chatHistory: Message[]
}

export interface NavigationState {
  activeTab: 'generar' | 'estado' | 'historial' | 'usuarios'
}

export interface DocumentState {
  documents: PDFContent[]
  isLoading: boolean
  error: string | null
  documentCount: number
  lastUpdated: Date | null
}

// Tipos para props de componentes
export interface ChatAssistantProps {
  onChatUpdate?: (messages: Message[]) => void
  currentPlanningData?: Planeacion | null
  setCurrentPlanningData?: (data: Planeacion | null) => void
}

export interface ResourcesBankProps {
  setActiveTab: (tab: "generar" | "historial") => void
  setCurrentPlanningData: (data: Planeacion | null) => void
}

export interface NavigationProps {
  activeTab: "generar" | "estado" | "historial" | "usuarios"
  onTabChange: (tab: "generar" | "estado" | "historial" | "usuarios") => void
}

// Tipos para servicios
export interface GeminiResponse {
  text: string
  success: boolean
  error?: string
}

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

// Enums para mejor tipado
export enum ActiveTab {
  GENERAR = 'generar',
  ESTADO = 'estado', 
  HISTORIAL = 'historial',
  USUARIOS = 'usuarios'
}

export enum DocumentType {
  PEI = 'pei',
  MODELO_PEDAGOGICO = 'modeloPedagogico',
  ORIENTACIONES_CURRICULARES = 'orientacionesCurriculares',
  TABLA7 = 'tabla7',
  RELEVANT_DOCS = 'relevantDocs'
}

export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant'
}
