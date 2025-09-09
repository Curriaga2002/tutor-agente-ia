import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID || 'asst_vZov1qHvECygGgxRDsv8CdZd';

const OPENAI_HEADERS = {
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  'Content-Type': 'application/json',
  'OpenAI-Beta': 'assistants=v2',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface OpenAIContext {
  message: string;
  planningConfig?: any;
  chatHistory?: any[];
}

export async function getOpenAIResponse(context: OpenAIContext): Promise<{ answer: string }> {
  if (!OPENAI_API_KEY || !ASSISTANT_ID) {
    return { answer: 'No se encontró la API Key o el Assistant ID de OpenAI.' };
  }
  try {
    // Construir el prompt enriquecido
    let prompt = '';
    if (context.planningConfig) {
      prompt += `CONFIGURACIÓN INICIAL:\n`;
      Object.entries(context.planningConfig).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
      prompt += '\n';
    }
    if (context.chatHistory && context.chatHistory.length > 0) {
      prompt += `HISTORIAL DEL CHAT:\n`;
      context.chatHistory.forEach((msg: any) => {
        prompt += `${msg.isUser ? 'Usuario' : 'Asistente'}: ${msg.text}\n`;
      });
      prompt += '\n';
    }
    prompt += `MENSAJE ACTUAL:\n${context.message}`;

    // 1. Crear thread
    const threadRes = await axios.post('https://api.openai.com/v1/threads', {}, { headers: OPENAI_HEADERS });
    const threadId = threadRes.data.id;
    // 2. Añadir mensaje
    await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { role: 'user', content: prompt },
      { headers: OPENAI_HEADERS }
    );
    // 3. Ejecutar assistant
    const runRes = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      { assistant_id: ASSISTANT_ID },
      { headers: OPENAI_HEADERS }
    );
    const runId = runRes.data.id;
    // 4. Polling hasta que termine
    let runStatus = 'queued';
    let attempts = 0;
    while (['queued', 'in_progress'].includes(runStatus) && attempts < 60) {
      await sleep(1000);
      const statusRes = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        { headers: OPENAI_HEADERS }
      );
      runStatus = statusRes.data.status;
      if (runStatus === 'completed') break;
      attempts++;
    }
    // 5. Obtener respuesta
    const messagesRes = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { headers: OPENAI_HEADERS }
    );
    const assistantMessage = messagesRes.data.data.find((msg: any) => msg.role === 'assistant');
    const parts = (assistantMessage.content || [])
      .map((p: any) => p?.text?.value || p?.text || '')
      .filter(Boolean);
    const answer = parts.join('\n');
    return { answer };
  } catch (error: any) {
    return { answer: 'Error comunicando con OpenAI Assistant.' };
  }
}

