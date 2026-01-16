import { logger } from "./logger";
import type { JWTPayload } from "./jwt_validator";

/**
 * Logging utilities for Socket.io events
 */
export class SocketLogger {
  static logConnection(socketId: string, user: JWTPayload | undefined): void {
    logger.info(
      { socketId, username: user?.username },
      "Client connected"
    );
  }

  static logDisconnection(socketId: string): void {
    logger.info(
      { socketId },
      "Client disconnected"
    );
  }

  static logAuthentication(socketId: string, username: string): void {
    logger.info(
      { socketId, username },
      "Socket authenticated"
    );
  }

  static logAuthenticationFailure(socketId: string, reason: string): void {
    logger.warn(
      { socketId },
      `Socket connection rejected: ${reason}`
    );
  }

  static logAuthenticationError(socketId: string, error: unknown): void {
    logger.error(
      { error: error, socketId },
      "Socket authentication error"
    );
  }

  static logMessageReceived(
    socketId: string,
    username: string,
    message: unknown
  ): void {
    logger.info(
      { msg: message, socketId, username },
      "Chat Message Received"
    );
  }

  static logMessageError(
    socketId: string,
    error: unknown
  ): void {
    logger.error(
      { error: error, socketId },
      "Chat Handler Error"
    );
  }

  static logDecompression(socketId: string, eventName: string): void {
    logger.debug(
      { eventName, socketId },
      "Payload decompressed"
    );
  }

  static logDecompressionError(
    socketId: string,
    error: unknown
  ): void {
    logger.error(
      { error: error, socketId },
      "Socket decompression error"
    );
  }

  static logSocketError(socketId: string, error: unknown): void {
    logger.error(
      { error: error, socketId },
      "Socket error"
    );
  }

  static logUnauthenticatedAccess(socketId: string): void {
    logger.warn(
      { socketId },
      "Unauthenticated socket attempting to use chat handler"
    );
  }

  static logServerInitializationError(error: unknown): void {
    logger.fatal(
      { error },
      "Failed to initialize Socket.io - preventing crash"
    );
  }

  static logServerError(error: unknown): void {
    logger.error(
      { error },
      "Socket.io server error - preventing crash"
    );
  }

  static logEngineError(error: unknown): void {
    logger.error(
      { error },
      "Socket.io engine error - preventing crash"
    );
  }

  static logCompressionError(socketId: string, event: string, error: unknown): void {
    logger.error(
      { error: error, event, socketId },
      "Error compressing/sending message"
    );
  }

  static logInvalidRoomId(
    socketId: string,
    roomId: string,
    error: unknown,
    username: string
  ): void {
    logger.warn(
      { error: error, roomId, socketId, username },
      "Invalid room ID format"
    );
  }
}
