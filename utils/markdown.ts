// Función para procesar markdown y convertir a HTML
export function processMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text
    // Normalizar dobles dos puntos y títulos con ':' extra
    .replace(/:{2,}/g, ':')
    .replace(/^##\s*([^:]+):\s*$/gm, '## $1')
    // Formateo de texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Código
    .replace(/```(.*?)```/g, '<pre><code>$1</code></pre>')
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
