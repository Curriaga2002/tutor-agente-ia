"use client"

import React, { useState, useEffect } from 'react'
import { useChat } from '../contexts/ChatContext'
import { useChatActions } from '../hooks/useChatActions'
import { ConfigurationForm } from './ConfigurationForm'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ConsultedDocuments } from './ConsultedDocuments'
import { InitialMessage } from './InitialMessage'
import { Message } from '../types'

interface ChatAssistantProps {
  onChatUpdate?: (messages: Message[]) => void
  currentPlanningData?: any
  setCurrentPlanningData?: (data: any) => void
}

export function ChatAssistant({ 
  onChatUpdate, 
  currentPlanningData, 
  setCurrentPlanningData 
}: ChatAssistantProps) {
  const { 
    isConfigured, 
    planningConfig, 
    setConfiguration,
    messages,
    addMessage
  } = useChat()
  
  const { sendMessage } = useChatActions()
  const [sessionRestored, setSessionRestored] = useState(false)

  // Notificar actualización del chat
  useEffect(() => {
    if (onChatUpdate) {
      onChatUpdate(messages)
    }
  }, [messages, onChatUpdate])

  // Persistencia de sesión
  useEffect(() => {
    setSessionRestored(true)
  }, [])

  const handleConfigurationSubmit = () => {
    setConfiguration(planningConfig)
    
    // Solo mostrar mensaje de confirmación sin enviar automáticamente
              const configMessage: Message = {
                id: Date.now().toString(),
                text: `✅ **CONFIGURACIÓN COMPLETADA EXITOSAMENTE**

**🎯 Detalles de tu planeación:**
• **Grado:** ${planningConfig.grado}
• **Asignatura:** ${planningConfig.asignatura}
• **Tema:** ${planningConfig.tema}
• **Duración:** ${Number(planningConfig.sesiones) * 2} horas
• **Sesiones:** ${planningConfig.sesiones}

**💡 Ejemplo de solicitud para Tecnología e Informática:**

"Genera un plan de clase para grado 8° sobre programación básica con Scratch.
Cantidad de estudiantes: 30.
Recursos disponibles: 15 computadores.
Estrategia de trabajo: Grupos de 2 estudiantes por computador.
Metodología: Aprendizaje basado en proyectos con enfoque colaborativo, alineado al modelo crítico-social.
Duración: 2 sesiones (4 horas).
Evaluación: Formativa mediante observación, lista de cotejo y producto final del proyecto en Scratch."`,
                isUser: false,
                timestamp: new Date(),
                isFormatted: true,
              }
    
    // Agregar mensaje de confirmación sin enviar automáticamente
    addMessage(configMessage)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-3xl shadow-[0_10px_30px_rgba(59,130,246,0.08)] ring-1 ring-blue-200/40 border border-gray-100 overflow-hidden">
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Formulario de Configuración Inicial */}
        {!isConfigured && sessionRestored && (
          <ConfigurationForm onSubmit={handleConfigurationSubmit} />
        )}
        
        {/* Documentos consultados en tiempo real */}
        <ConsultedDocuments />
        
        {/* Mensaje inicial del asistente */}
        {!isConfigured && sessionRestored && (
          <InitialMessage />
        )}
        
        {/* Mensajes del Chat */}
        <ChatMessages />
                  </div>

      {/* Input del Chat */}
      <ChatInput />
    </div>
  )
}
