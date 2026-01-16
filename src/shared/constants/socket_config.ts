/**
 * Socket.io Configuration Constants
 * Magic numbers extracted to named constants
 */
export const SOCKET_CONFIG = {
  MAX_HTTP_BUFFER_SIZE: 1e8, // 100MB
  PING_TIMEOUT: 60000, // 60 seconds
  PING_INTERVAL: 25000, // 25 seconds
  PATH: "/socket.io/",
} as const;

/**
 * Socket event names
 */
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CHAT_MESSAGE: 'chat:message',
  CHAT_RESPONSE: 'chat:response',
} as const;

/**
 * Socket error messages
 */
export const SOCKET_ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid token',
  AUTH_FAILED: 'Authentication failed',
  NO_TOKEN: 'No token provided',
  INVALID_COMPRESSED_FORMAT: 'Invalid compressed format',
  INVALID_ROOM_ID: 'Invalid room ID format',
} as const;
