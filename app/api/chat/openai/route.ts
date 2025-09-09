import { NextRequest, NextResponse } from "next/server";
import { getOpenAIResponse } from "../../../../lib/openai-assistant-service";

export async function POST(request: NextRequest) {
  try {
    const { message, planningConfig, chatHistory } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }
    const response = await getOpenAIResponse({ message, planningConfig, chatHistory });
    return NextResponse.json({ answer: response.answer });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

