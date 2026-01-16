import { describe, test, expect } from 'bun:test';
import { ChatMessage } from '../../../src/domain/entities/chat_message.entity';

describe('ChatMessage Entity', () => {
  test('should create chat message with text', () => {
    const message = new ChatMessage('Hello world', undefined);

    expect(message.text).toBe('Hello world');
    expect(message.roomId).toBeUndefined();
    expect(message.timestamp).toBeGreaterThan(0);
  });

  test('should create chat message with roomId', () => {
    const message = new ChatMessage('Hello', 'room-123');

    expect(message.text).toBe('Hello');
    expect(message.roomId).toBe('room-123');
  });

  test('should throw error when text is empty', () => {
    expect(() => {
      new ChatMessage('', undefined);
    }).toThrow('Message text cannot be empty');
  });

  test('should throw error when text is only whitespace', () => {
    expect(() => {
      new ChatMessage('   ', undefined);
    }).toThrow('Message text cannot be empty');
  });

  test('should throw error when text exceeds 1000 characters', () => {
    const longText = 'a'.repeat(1001);

    expect(() => {
      new ChatMessage(longText, undefined);
    }).toThrow('Message text cannot exceed 1000 characters');
  });

  test('should accept text with exactly 1000 characters', () => {
    const text = 'a'.repeat(1000);
    const message = new ChatMessage(text, undefined);

    expect(message.text).toBe(text);
  });
});
