"use client"

import React, { useState } from 'react'
import { useChat } from '../contexts/ChatContext'
import { useChatActions } from '../hooks/useChatActions'

export function ChatInput() {
  const { isConfigured, isLoading, isSaving } = useChat()
  const { sendMessage } = useChatActions()
  const [inputText, setInputText] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isLoading) return

    await sendMessage(inputText)
    setInputText("")
  }

  const handleCancel = () => {
    // Implementar cancelación si es necesario
    setInputText("")
  }

  return (
    <div className="bg-white border-t border-gray-100 p-4 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pide aquí tu plan de clases"
          className="flex-1 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-500 text-sm sm:text-base lg:text-lg bg-white"
          disabled={!isConfigured || isLoading || isSaving}
        />
        <div className="flex gap-2 sm:gap-3 lg:gap-4">
          <button
            type="submit"
            disabled={!isConfigured || !inputText.trim() || isLoading || isSaving}
            className="flex-1 sm:flex-none px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm text-white rounded-xl sm:rounded-2xl hover:from-blue-600/90 hover:to-purple-600/90 focus:outline-none focus:ring-4 focus:ring-blue-200/30 disabled:opacity-50 transition-all duration-300 font-medium text-sm sm:text-base lg:text-lg shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 disabled:transform-none"
          >
            <span className="hidden sm:inline">{isLoading ? '🔄' : '📤'} Enviar</span>
            <span className="sm:hidden">{isLoading ? '🔄' : '📤'}</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isLoading}
            className="flex-1 sm:flex-none px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 transition-all duration-300 font-medium text-sm sm:text-base lg:text-lg"
            title="Cancelar generación"
          >
            <span className="hidden sm:inline">✖️ Cancelar</span>
            <span className="sm:hidden">✖️</span>
          </button>
        </div>
      </form>
    </div>
  )
}
