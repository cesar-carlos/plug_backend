import type {
  SendChatMessageUseCase,
  ChatResponse,
} from "../../domain/use_cases/send_chat_message.use_case";
import type { ChatMessage } from "../../domain/entities/chat_message.entity";

export class ChatService {
  constructor(
    private readonly sendChatMessageUseCase: SendChatMessageUseCase
  ) {}

  async sendMessage(message: ChatMessage): Promise<ChatResponse> {
    try {
      return await this.sendChatMessageUseCase.execute(message);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Chat service error"
      );
    }
  }
}
