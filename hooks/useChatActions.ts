import { useCallback } from 'react'
import { useChat } from '../contexts/ChatContext'
import { usePlanning } from '../contexts/PlanningContext'

export function useChatActions() {
  const { 
    addMessage, 
    setLoading, 
    setSaving, 
    setError,
    updateConsultedDocuments,
    planningConfig,
    messages
  } = useChat()
  
  const { addToChatHistory } = usePlanning()

  // Función para enviar mensaje usando OpenAI
  const sendMessage = useCallback(async (inputText: string) => {
    if (!inputText.trim()) return
    const userMessage = {
      text: inputText,
      isUser: true,
      isFormatted: false
    }
    addMessage(userMessage)
    addToChatHistory(userMessage as any)
    setLoading(true)
    try {
      // Construir el contexto completo
      const chatHistory = messages.concat({ ...userMessage, id: Date.now().toString(), timestamp: new Date() });
      const payload = {
        message: inputText,
        planningConfig,
        chatHistory
      };
      const res = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      const assistantMessage = {
        text: data.answer,
        isUser: false,
        isFormatted: true
      }
      addMessage(assistantMessage)
      addToChatHistory(assistantMessage as any)
    } catch (error) {
      const errorMessage = {
        text: `❌ **Error generando respuesta:** ${error instanceof Error ? error.message : 'Error desconocido'}`,
        isUser: false,
        isFormatted: true
      }
      addMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [addMessage, addToChatHistory, setLoading, planningConfig, messages])

  return {
    sendMessage
  }
}
