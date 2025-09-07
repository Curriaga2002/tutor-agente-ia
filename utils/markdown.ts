// Función para procesar markdown y convertir a HTML
export function processMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  // Detectar si es un mensaje de configuración para preservar saltos de línea específicos
  const isConfigMessage = text.includes('CONFIGURACIÓN COMPLETADA EXITOSAMENTE')
  
  let processedText = text
    // Limpiar espacios extra y normalizar
    .replace(/\s+$/gm, '') // Eliminar espacios al final de líneas
    .replace(/^\s+/gm, '') // Eliminar espacios al inicio de líneas

  // Preservar saltos de línea específicos en mensajes de configuración
  if (isConfigMessage) {
    // Preservar doble salto de línea después de "Sesiones:"
    processedText = processedText.replace(/(\*\*Sesiones:\*\* .*)\n(\*\*💡)/g, '$1\n\n$2')
    // Agregar espacio después del título "Ejemplo de solicitud para Tecnología e Informática:"
    processedText = processedText.replace(/(\*\*💡 Ejemplo de solicitud para Tecnología e Informática:\*\*)\n/g, '$1\n\n')
  } else {
    processedText = processedText.replace(/\n\s*\n\s*\n/g, '\n\n') // Normalizar múltiples saltos de línea
  }

  return processedText
    // Eliminar líneas en blanco entre elementos de lista
    .replace(/(^- .*)\n\s*\n(^- .*)/gm, '$1\n$2')
    .replace(/(^- .*)\n\s*\n(^- .*)/gm, '$1\n$2') // Aplicar dos veces para casos múltiples
    // Normalizar dobles dos puntos y títulos con ':' extra
    .replace(/:{2,}/g, ':')
    .replace(/^##\s*([^:]+):\s*$/gm, '## $1')
    // Formateo de texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Código
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Títulos
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Listas
    .replace(/^- (.*$)/gm, '<li>• $1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li>$&</li>')
    // Saltos de línea
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    // Limpiar HTML resultante
    .replace(/<br>\s*<br>\s*<br>/g, '<br><br>') // Normalizar múltiples <br>
    .replace(/<br>\s*<\/h[1-6]>/g, '</h$1>') // Eliminar <br> antes de cierre de títulos
    .replace(/<h[1-6][^>]*>\s*<br>/g, '<h$1>') // Eliminar <br> después de apertura de títulos
    // Eliminar <br> extra entre elementos de lista
    .replace(/<\/li>\s*<br>\s*<li>/g, '</li><li>')
}

// Función para limpiar texto para exportación
export function cleanTextForExport(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remover negritas
    .replace(/\*(.*?)\*/g, '$1') // Remover cursivas
    .replace(/^### (.*$)/gim, '$1') // Títulos como texto normal
    .replace(/^## (.*$)/gim, '$1') // Títulos como texto normal
    .replace(/^# (.*$)/gim, '$1') // Títulos como texto normal
    .replace(/^\- (.*$)/gim, '• $1') // Listas con viñetas
    .replace(/^\d+\. (.*$)/gim, '• $1') // Listas numeradas como viñetas
}
