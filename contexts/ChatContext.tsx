"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Message, PlanningConfig, ConsultedDocuments, ChatState } from '../types'

interface ChatContextType extends ChatState {
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  clearMessages: () => void
  setConfiguration: (config: PlanningConfig) => void
  updateConfiguration: (updates: Partial<PlanningConfig>) => void
  resetConfiguration: () => void
  updateConsultedDocuments: (docs: ConsultedDocuments) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
  children: ReactNode
}

const initialPlanningConfig: PlanningConfig = {
  grado: '',
  asignatura: 'Tecnología e informática',
  tema: '',
  horas: '',
  sesiones: '',
  recursos: '',
  nombreDocente: '',
  consultarPEI: true,
  consultarModeloPedagogico: true,
  filtrosInstitucionales: ['Orientaciones Curriculares', 'Estructuras de Planes de Clase', 'Proyectos Educativos', 'Modelos Pedagógicos']
}

const initialConsultedDocuments: ConsultedDocuments = {
  pei: [],
  modeloPedagogico: [],
  orientacionesCurriculares: [],
  tabla7: [],
  relevantDocs: []
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isConfigured, setIsConfigured] = useState(false)
  const [planningConfig, setPlanningConfig] = useState<PlanningConfig>(initialPlanningConfig)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [consultedDocuments, setConsultedDocuments] = useState<ConsultedDocuments>(initialConsultedDocuments)

  // Persistencia de sesión
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chatSession')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.planningConfig) {
          setPlanningConfig(parsed.planningConfig)
        }
        if (Array.isArray(parsed.messages)) {
          const filteredMessages = parsed.messages
            .filter((m: any) => 
              m.id !== "initial" && 
              !m.text.includes('ASISTENTE PEDAGÓGICO INTELIGENTE') &&
              !m.text.includes('CONFIGURACIÓN COMPLETADA EXITOSAMENTE')
            )
            .map((m: any) => ({...m, timestamp: new Date(m.timestamp)}))
          setMessages(filteredMessages)
        }
        if (typeof parsed.isConfigured === 'boolean') {
          setIsConfigured(false) // Siempre empezar con formulario no configurado
        }
      }
    } catch (error) {
      console.error('Error loading chat session:', error)
    }
  }, [])

  useEffect(() => {
    try {
      const filteredMessages = messages.filter(m => 
        !m.text.includes('CONFIGURACIÓN COMPLETADA EXITOSAMENTE')
      )
      localStorage.setItem('chatSession', JSON.stringify({ 
        planningConfig, 
        messages: filteredMessages, 
        isConfigured 
      }))
    } catch (error) {
      console.error('Error saving chat session:', error)
    }
  }, [planningConfig, messages, isConfigured])

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg)
    )
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setIsConfigured(false)
    setPlanningConfig(initialPlanningConfig)
    setConsultedDocuments(initialConsultedDocuments)
  }, [])

  const setConfiguration = useCallback((config: PlanningConfig) => {
    console.log('🔍 ChatContext: setConfiguration called with:', config)
    setPlanningConfig(config)
    setIsConfigured(true)
    console.log('🔍 ChatContext: isConfigured set to true')
  }, [])

  const updateConfiguration = useCallback((updates: Partial<PlanningConfig>) => {
    setPlanningConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const resetConfiguration = useCallback(() => {
    setPlanningConfig(initialPlanningConfig)
    setIsConfigured(false)
  }, [])

  const updateConsultedDocuments = useCallback((docs: ConsultedDocuments) => {
    setConsultedDocuments(docs)
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const setSaving = useCallback((saving: boolean) => {
    setIsSaving(saving)
  }, [])

  const setError = useCallback((error: string | null) => {
    // Error handling can be implemented here
    console.error('Chat error:', error)
  }, [])

  const value: ChatContextType = {
    // State
    messages,
    isConfigured,
    planningConfig,
    isLoading,
    isSaving,
    consultedDocuments,
    // Actions
    addMessage,
    updateMessage,
    clearMessages,
    setConfiguration,
    updateConfiguration,
    resetConfiguration,
    updateConsultedDocuments,
    setLoading,
    setSaving,
    setError
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
