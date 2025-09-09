"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useChat } from '../contexts/ChatContext'
import { useChatActions } from '../hooks/useChatActions'
import { ConfigurationForm } from './ConfigurationForm'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
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
  const [copied, setCopied] = useState(false)
  const configBlockRef = useRef<HTMLDivElement>(null)

  // Notificar actualización del chat
  useEffect(() => {
    if (onChatUpdate) {
      onChatUpdate(messages)
    }
  }, [messages, onChatUpdate])

  // Debug: Monitorear cambios en isConfigured
  useEffect(() => {
  }, [isConfigured])

  // Persistencia de sesión
  useEffect(() => {
    setSessionRestored(true)
  }, [])

  const handleCopyConfig = () => {
    if (configBlockRef.current) {
      // Copiar solo las líneas que empiezan con '•'
      const allText = configBlockRef.current.innerText
      const lines = allText.split('\n')
      const detailsLines = lines.filter(line => line.trim().startsWith('•'))
      const textToCopy = detailsLines.join('\n')
      navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const handleConfigurationSubmit = () => {
    
    setConfiguration(planningConfig)
    
    
    // Construir detalles dinámicamente, excluyendo campos no deseados
    const configDetails = Object.entries(planningConfig)
      .filter(([key]) =>
        !['consultarPEI', 'consultarModeloPedagogico', 'filtrosInstitucionales'].includes(key)
      )
      .map(([key, value]) => `• **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${value}`)
      .join('\n')
    const configMessage: Message = {
      id: Date.now().toString(),
      text: `✅ **CONFIGURACIÓN COMPLETADA EXITOSAMENTE**\n\n**🎯 Detalles de tu planeación:**\n\n${configDetails}`,
      isUser: false,
      timestamp: new Date(),
      isFormatted: true,
    }
    
    // Agregar mensaje de confirmación sin enviar automáticamente
    addMessage(configMessage)
    
    // Scroll automático al final de la página después de un breve delay
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      })
    }, 100)
  }

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-slate-200/60 border border-slate-200/50 overflow-hidden">
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Formulario de Configuración Inicial */}
        {!isConfigured && sessionRestored && (
          <ConfigurationForm onSubmit={handleConfigurationSubmit} />
        )}
        
        
        {/* Mensaje inicial del asistente */}
        {!isConfigured && sessionRestored && (
          <InitialMessage />
        )}
        
        {/* Mensajes del Chat */}
        <ChatMessages 
          renderExtra={(message) => {
            // Solo mostrar el botón de copiar en el mensaje de configuración
            if (
              message.text.startsWith('✅ **CONFIGURACIÓN COMPLETADA EXITOSAMENTE**')
            ) {
              return (
                <div className="flex items-center mt-2">
                  <button
                    onClick={handleCopyConfig}
                    className="ml-auto px-3 py-1 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              )
            }
            return null
          }}
          configBlockRef={configBlockRef}
        />
                  </div>

      {/* Input del Chat */}
      <ChatInput />
    </div>
  )
}
