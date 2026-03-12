import { apiSlice } from '../apiSlice';

// Interfaces
interface ChatRequest {
  query: string;
  context?: Array<{ title: string; path?: string }>;
  report_data?: Record<string, any>; // Datos opcionales de reportes
}

interface ChatResponse {
  text: string;
  suggested_path?: string;
}

// AI Chat API Slice con RTK Query
export const aiChatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // POST para chat con AI
    sendChatMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: '/ai/chat',
        method: 'POST',
        body
      }),
      // No usamos cache para mensajes de chat ya que cada interacción es única
      transformResponse: (response: ChatResponse): ChatResponse => {
        return {
          text: response.text || 'Lo siento, no obtuve una respuesta válida.',
          suggested_path: response.suggested_path
        };
      }
    })
  })
});

// Export hooks
export const { useSendChatMessageMutation } = aiChatApi;
