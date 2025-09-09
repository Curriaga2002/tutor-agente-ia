import { type NextRequest, NextResponse } from "next/server"

function generateFallbackResponse(message: string, context: any, documents: any[] = []): string {
  const lowerMessage = message.toLowerCase()

  // Document context for fallback responses
  const documentContext =
    documents.length > 0
      ? `\n\n📄 Documentos disponibles: ${documents.map((doc) => doc.name).join(", ")}\nPuedes preguntarme sobre el contenido de estos documentos.`
      : ""

  // Check if user is asking about documents
  if (lowerMessage.includes("documento") || lowerMessage.includes("archivo")) {
    if (documents.length > 0) {
      return `Tienes ${documents.length} documento(s) cargado(s):
      
${documents.map((doc) => `• ${doc.name} (${doc.type})`).join("\n")}

Puedo ayudarte a analizar el contenido de estos documentos y aplicarlo a tu planeación didáctica. ¿Qué aspecto específico te interesa?`
    } else {
      return `No tienes documentos cargados actualmente. Puedes cargar archivos PDF, Word o de texto usando el botón 📎 para enriquecer nuestras conversaciones con contenido específico.`
    }
  }

  // Respuestas específicas por tema
  if (lowerMessage.includes("objetivo") || lowerMessage.includes("meta")) {
    return `Para el tema "${context?.tema || "tu tema"}" en grado ${context?.grado || "8° o 9°"}, algunos objetivos podrían ser:
    
• Comprender los conceptos fundamentales del tema
• Desarrollar habilidades de análisis y síntesis
• Aplicar los conocimientos en situaciones prácticas
• Fomentar el pensamiento crítico y la participación activa

¿Te gustaría que profundice en algún objetivo específico?${documentContext}`
  }

  if (lowerMessage.includes("actividad") || lowerMessage.includes("ejercicio")) {
    return `Para desarrollar el tema "${context?.tema || "tu tema"}" te sugiero estas actividades:
    
• Lluvia de ideas inicial para activar conocimientos previos
• Trabajo en grupos pequeños con roles definidos
• Presentaciones cortas de los estudiantes
• Talleres prácticos con ejemplos reales
• Debates estructurados sobre el tema

Considera adaptar las actividades según el tiempo disponible (${context?.duracion || "duración planificada"}).${documentContext}`
  }

  if (lowerMessage.includes("recurso") || lowerMessage.includes("material")) {
    return `Recursos recomendados para tu clase:
    
• Presentaciones visuales (PowerPoint o Canva)
• Videos educativos de YouTube o plataformas especializadas
• Fichas de trabajo imprimibles
• Materiales manipulativos según el tema
• Plataformas digitales como Kahoot para evaluación
• Libros de texto del MEN Colombia

¿Necesitas ayuda con algún recurso específico?${documentContext}`
  }

  if (lowerMessage.includes("evalua") || lowerMessage.includes("califica")) {
    return `Estrategias de evaluación para tu tema:
    
• Evaluación diagnóstica al inicio
• Evaluación formativa durante el proceso (observación, preguntas)
• Evaluación sumativa al final (quiz, proyecto, presentación)
• Rúbricas claras con criterios específicos
• Autoevaluación y coevaluación entre estudiantes

Para ${context?.sesiones || "varias"} sesiones, distribuye la evaluación a lo largo del proceso.${documentContext}`
  }

  if (lowerMessage.includes("tiempo") || lowerMessage.includes("duración")) {
    return `Para organizar el tiempo en tu clase de ${context?.duracion || "duración planificada"}:
    
• Inicio (10-15 min): Saludo, repaso, introducción del tema
• Desarrollo (60-70% del tiempo): Actividades principales
• Cierre (10-15 min): Síntesis, evaluación, tarea
• Considera descansos activos cada 20-30 minutos

¿Necesitas ayuda distribuyendo actividades específicas?${documentContext}`
  }

  if (lowerMessage.includes("estándar") || lowerMessage.includes("competencia")) {
    return `Los estándares básicos de competencias del MEN para grados 8° y 9° incluyen:
    
• Competencias comunicativas (lectura, escritura, oralidad)
• Competencias matemáticas (pensamiento numérico, espacial, métrico)
• Competencias científicas (indagación, explicación, comunicación)
• Competencias ciudadanas (convivencia, participación, pluralidad)

¿En qué área específica necesitas enfocar tu planeación?${documentContext}`
  }

  // Respuesta general por defecto
  return `Gracias por tu pregunta sobre "${context?.tema || "el tema de tu clase"}". 

Como asistente de planeación didáctica, te puedo ayudar con:
• Definición de objetivos de aprendizaje
• Sugerencias de actividades pedagógicas
• Recursos y materiales educativos
• Estrategias de evaluación
• Distribución del tiempo de clase

Para grado ${context?.grado || "8° o 9°"} y una duración de ${context?.duracion || "la planificada"}, ¿podrías ser más específico sobre qué aspecto te gustaría desarrollar?${documentContext}

*Nota: Respuesta generada localmente. Para respuestas más personalizadas con IA, verifica la configuración de la API.*`
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, documents = [] } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 })
    }

    const fallbackResponse = generateFallbackResponse(message, context, documents)

    return NextResponse.json({
      response: fallbackResponse,
      formSuggestions: null,
    })
  } catch (error: any) {
    console.error("Error en el chat:", error)

    const {
      message,
      context,
      documents = [],
    } = await request.json().catch(() => ({ message: "", context: {}, documents: [] }))
    const fallbackResponse = generateFallbackResponse(message, context, documents)

    return NextResponse.json({
      response: fallbackResponse,
      formSuggestions: null,
    })
  }
}
