"use client"

import React, { useEffect, useRef, RefObject } from 'react'
import { useChat } from '../contexts/ChatContext'
import { FormattedMessage } from './FormattedMessage'
import ReactMarkdown from 'react-markdown'

interface ChatMessagesProps {
  renderExtra?: (message: any) => React.ReactNode
  configBlockRef?: RefObject<HTMLDivElement>
}

export function ChatMessages({ renderExtra, configBlockRef }: ChatMessagesProps = {}) {
  const { messages, isLoading } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll automático al final
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.isUser === false) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  return (
    <div className="space-y-3 sm:space-y-4">
      {messages.map((message) => {
        const isConfigMsg = message.text.startsWith('✅ **CONFIGURACIÓN COMPLETADA EXITOSAMENTE**')
        const isAssistant = message.isUser === false && !isConfigMsg
        return (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-full sm:max-w-3xl px-4 sm:px-6 lg:px-8 py-3 rounded-lg backdrop-blur-sm ${
                message.isUser
                  ? 'bg-blue-600/90 text-white shadow-xl shadow-blue-600/35'
                  : 'bg-white/80 border border-white/50 shadow-xl shadow-blue-200/40'
              } ${isConfigMsg ? 'text-lg font-semibold' : ''}`}
              ref={isConfigMsg && configBlockRef ? configBlockRef : undefined}
            >
              {isAssistant
                ? <div className="prose prose-blue max-w-none"><ReactMarkdown>{message.text}</ReactMarkdown></div>
                : <FormattedMessage text={message.text} isFormatted={message.isFormatted} />
              }
              {renderExtra && renderExtra(message)}
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
  )
}
