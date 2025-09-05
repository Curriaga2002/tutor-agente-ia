import { useCallback } from 'react'
import { useChat } from '../contexts/ChatContext'
import { usePlanning } from '../contexts/PlanningContext'
import { createClient } from '@supabase/supabase-js'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { Planeacion, Message } from '../types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function usePlanningActions() {
  const { messages, planningConfig, setSaving } = useChat()
  const { setCurrentPlanningData } = usePlanning()

  // Función para guardar el chat en la base de datos
  const saveChatToDatabase = useCallback(async () => {
    if (messages.length <= 1) {
      alert('No hay planeación para guardar')
      return
    }

    setSaving(true)
    try {
      const sesionesNum = Math.min(2, Math.max(1, Number(planningConfig.sesiones) || 1))
      const duracion = `${sesionesNum * 2} horas`

      const chatData = {
        grado: planningConfig.grado,
        tema: planningConfig.tema,
        duracion,
        sesiones: planningConfig.sesiones,
        contenido: messages.map(m => `${m.isUser ? 'Usuario' : 'Asistente'}: ${m.text}`).join('\n\n'),
        chat_history: messages,
        user_id: null
      }

      const { data, error } = await supabase
        .from('planeaciones')
        .insert([chatData])
        .select()
       
      if (error) {
        console.error('❌ Error guardando planeación:', error)
        alert(`❌ Error al guardar: ${error.message}`)
      } else {
        alert('✅ Planeación guardada exitosamente en la base de datos')
        
        if (data && data[0]) {
          setCurrentPlanningData(data[0])
        }
      }
    } catch (error) {
      console.error('❌ Error general guardando planeación:', error)
      alert(`❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }, [messages, planningConfig, setSaving, setCurrentPlanningData])

  // Función para exportar el chat como Word
  const exportToWord = useCallback(async (exportType: 'complete' | 'agent-only' = 'complete') => {
    if (messages.length <= 1) {
      alert('No hay planeación para exportar')
      return
    }

    try {
      const paragraphs: Paragraph[] = []

      if (exportType === 'agent-only') {
        const agentMessages = messages.filter(msg => !msg.isUser && msg.id !== "initial")
        
        if (agentMessages.length === 0) {
          alert('No hay contenido del agente para exportar')
          return
        }

        const lastAgentMessage = agentMessages[agentMessages.length - 1]
        let agentContent = lastAgentMessage.text
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/`/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/^\s*[-*+]\s/gm, '• ')
          .replace(/•\s*•/g, '•')
          .replace(/\n{3,}/g, '\n\n')
        
        const contentLines = agentContent.split('\n').filter(line => line.trim())
        
        contentLines.forEach(line => {
          if (line.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: line.trim(),
                    size: 24,
                    color: "2c3e50"
                  })
                ],
                spacing: { after: 200 }
              })
            )
          }
        })
      } else {
        // Modo conversación completa
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

        // Agregar cada mensaje del chat
        messages.forEach((message, index) => {
          if (index === 0) return
          
          const sender = message.isUser ? '👤 Docente' : '🤖 Asistente IA'
          const timestamp = message.timestamp.toLocaleString('es-ES')
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: sender,
                  bold: true,
                  size: 24,
                  color: message.isUser ? "e74c3c" : "27ae60"
                })
              ],
              spacing: { after: 100 }
            })
          )

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

          let cleanText = message.text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^### (.*$)/gim, '$1')
            .replace(/^## (.*$)/gim, '$1')
            .replace(/^# (.*$)/gim, '$1')
            .replace(/^\- (.*$)/gim, '• $1')
            .replace(/^\d+\. (.*$)/gim, '• $1')

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

          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 400 }
            })
          )
        })
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      })

      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      })
      
      const suffix = exportType === 'agent-only' ? '-solo-agente' : '-completo'
      const fileName = `plan-clase-${planningConfig.tema.replace(/[^a-zA-Z0-9]/g, '-')}${suffix}-${new Date().toISOString().split('T')[0]}.docx`
      saveAs(blob, fileName)

      const message = exportType === 'agent-only' 
        ? '✅ Plan de clase (solo agente) exportado exitosamente como Word'
        : '✅ Chat completo exportado exitosamente como Word'
      alert(message)
    } catch (error) {
      console.error('❌ Error exportando chat:', error)
      alert('❌ Error al exportar el chat')
    }
  }, [messages, planningConfig])

  return {
    saveChatToDatabase,
    exportToWord
  }
}
