import { describe, test, expect } from 'bun:test';
import { SendChatMessageUseCase } from '../../../src/domain/use_cases/send_chat_message.use_case';
import { ChatMessage } from '../../../src/domain/entities/chat_message.entity';

describe('SendChatMessageUseCase', () => {
  test('should return echo response with original text', async () => {
    const useCase = new SendChatMessageUseCase();
    const message = new ChatMessage('Hello world', undefined);

    const result = await useCase.execute(message);

    expect(result.original).toBe('Hello world');
    expect(result.response).toBe('Echo: Hello world');
    expect(result.timestamp).toBeGreaterThan(0);
  });

  test('should include timestamp in response', async () => {
    const useCase = new SendChatMessageUseCase();
    const message = new ChatMessage('Test', 'room-1');
    const beforeTime = Date.now();

    const result = await useCase.execute(message);

    const afterTime = Date.now();
    expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(result.timestamp).toBeLessThanOrEqual(afterTime);
  });
});
