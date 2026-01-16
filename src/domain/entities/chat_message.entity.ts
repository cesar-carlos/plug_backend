export class ChatMessage {
  constructor(
    public readonly text: string,
    public readonly roomId: string | undefined,
    public readonly timestamp: number = Date.now()
  ) {
    if (!text || text.trim().length === 0) {
      throw new Error('Message text cannot be empty');
    }
    if (text.length > 1000) {
      throw new Error('Message text cannot exceed 1000 characters');
    }
  }
}
