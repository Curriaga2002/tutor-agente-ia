import { useCallback } from 'react'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { Planeacion, Message } from '../types'

export function useExport() {
  const exportChatToWord = useCallback(async (plan: Planeacion) => {
    try {
      
      // Validar datos de entrada
      if (!plan) {
        throw new Error('No hay datos de planeación para exportar')
      }
      
      if (!plan.tema) {
        throw new Error('La planeación no tiene tema definido')
      }
      
      // Crear párrafos del documento
      const paragraphs: Paragraph[] = []

      // Header del documento
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "📚 Planeación Didáctica",
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

      // Información de fecha y generador
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}`,
              size: 22,
              color: "7f8c8d"
            })
          ],
          spacing: { after: 200 }
        })
      )

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `🤖 Generado por: Planeador Inteligente`,
              size: 22,
              color: "7f8c8d"
            })
          ],
          spacing: { after: 400 }
        })
      )

      // Información de la planeación
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "📋 Información de la Planeación",
              bold: true,
              size: 28,
              color: "3498db"
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 }
        })
      )

      // Datos de la planeación
      const planData = [
        { icon: "🎓", label: "Grado", value: plan.grado },
        { icon: "📖", label: "Tema", value: plan.tema },
        { icon: "⏰", label: "Duración", value: plan.duracion },
        { icon: "📝", label: "Sesiones", value: plan.sesiones.toString() },
        { icon: "📅", label: "Creado", value: new Date(plan.created_at).toLocaleDateString('es-ES') }
      ]

      planData.forEach(data => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.icon} ${data.label}: `,
                bold: true,
                size: 24,
                color: "2c3e50"
              }),
              new TextRun({
                text: data.value,
                size: 24,
                color: "2c3e50"
              })
            ],
            spacing: { after: 200 }
          })
        )
      })

      // Espacio antes de la conversación
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 600 }
        })
      )

      // Título de la conversación
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "💬 Conversación Completa",
              bold: true,
              size: 28,
              color: "27ae60"
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        })
      )

      // Agregar cada mensaje del chat
      if (plan.chat_history && plan.chat_history.length > 0) {
        
        plan.chat_history.forEach((message, index) => {
          try {
            // Validar estructura del mensaje
            if (!message || typeof message !== 'object') {
              console.warn('⚠️ Mensaje inválido en índice', index, ':', message)
              return
            }
            
            const sender = message.isUser ? '👤 Docente' : '🤖 Asistente IA'
            const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString('es-ES') : 'Sin fecha'
            const senderColor = message.isUser ? "e74c3c" : "27ae60"
          
            // Nombre del emisor
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: sender,
                    bold: true,
                    size: 24,
                    color: senderColor
                  })
                ],
                spacing: { after: 100 }
              })
            )

            // Timestamp
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

            // Contenido del mensaje
            let cleanText = message.text
              .replace(/\*\*(.*?)\*\*/g, '$1') // Limpiar negritas
              .replace(/\*(.*?)\*/g, '$1') // Limpiar cursivas
              .replace(/^### (.*$)/gim, '$1') // Títulos como texto normal
              .replace(/^## (.*$)/gim, '$1') // Títulos como texto normal
              .replace(/^# (.*$)/gim, '$1') // Títulos como texto normal
              .replace(/^\- (.*$)/gim, '• $1') // Listas con viñetas
              .replace(/^\d+\. (.*$)/gim, '• $1') // Listas numeradas como viñetas

            // Dividir el texto en párrafos
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

            // Espacio entre mensajes
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ text: "" })],
                spacing: { after: 400 }
              })
            )
            
          } catch (messageError) {
            console.error('❌ Error procesando mensaje en índice', index, ':', messageError)
            // Continuar con el siguiente mensaje
          }
        })
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "💬 No hay historial de chat disponible para esta planeación.",
                size: 22,
                color: "7f8c8d"
              })
            ],
            spacing: { after: 400 }
          })
        )
      }

      // Footer
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📅 ${new Date().toLocaleString('es-ES')}`,
              size: 18,
              color: "7f8c8d"
            })
          ],
          alignment: AlignmentType.CENTER
        })
      )

      // Crear el documento
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      })

      // Generar y descargar el archivo
      const buffer = await Packer.toBuffer(doc)
      
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      })
      
      const fileName = `plan-clase-${plan.tema.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`
      
      // Usar una implementación más robusta de saveAs
      try {
        saveAs(blob, fileName)
      } catch (saveError) {
        console.error('❌ Error al descargar archivo:', saveError)
        // Fallback: crear un enlace de descarga manual
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      return { success: true, fileName }
      
    } catch (error) {
      console.error('❌ Error exportando chat:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      throw new Error(`Error al exportar el chat: ${errorMessage}`)
    }
  }, [])

  return {
    exportChatToWord
  }
}
