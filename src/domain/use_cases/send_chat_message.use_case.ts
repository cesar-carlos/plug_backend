import type { ChatMessage } from '../entities/chat_message.entity';

export interface ChatResponse {
  original: string;
  response: string;
  timestamp: number;
}

export class SendChatMessageUseCase {
  async execute(message: ChatMessage): Promise<ChatResponse> {
    return {
      original: message.text,
      response: `Echo: ${message.text}`,
      timestamp: Date.now(),
    };
  }
}
