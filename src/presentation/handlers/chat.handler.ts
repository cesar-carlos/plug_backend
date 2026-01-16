import type { Socket } from "socket.io";
import { ChatMessage } from "../../domain/entities/chat_message.entity";
import { ChatService } from "../../application/services/chat.service";
import { RoomId } from "../../domain/value_objects/room_id.value_object";
import {
  SOCKET_EVENTS,
  SOCKET_ERROR_MESSAGES,
} from "../../shared/constants/socket_config";
import { SocketLogger } from "../../shared/utils/socket_logger";
import { z } from "zod";

const ChatMessageSchema = z.object({
  text: z.string().min(1, "Message cannot be empty").max(1000),
  roomId: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});

export const createChatHandler = (chatService: ChatService) => {
  return (socket: Socket): void => {
    const user = socket.data.user;

    if (!user) {
      SocketLogger.logUnauthenticatedAccess(socket.id);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: SOCKET_ERROR_MESSAGES.AUTH_REQUIRED,
      });
      socket.disconnect();
      return;
    }

    const onMessage = async (data: unknown): Promise<void> => {
      try {
        const parsedData = ChatMessageSchema.parse(data);

        if (parsedData.roomId) {
          try {
            RoomId.create(parsedData.roomId);
          } catch (error) {
            SocketLogger.logInvalidRoomId(
              socket.id,
              parsedData.roomId,
              error,
              user.username
            );
            await socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
              message: SOCKET_ERROR_MESSAGES.INVALID_ROOM_ID,
            });
            return;
          }
        }

        const message = new ChatMessage(parsedData.text, parsedData.roomId);

        SocketLogger.logMessageReceived(socket.id, user.username, parsedData);

        const response = await chatService.sendMessage(message);

        await socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, response);
      } catch (err) {
        SocketLogger.logMessageError(socket.id, err);
        await socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          message:
            err instanceof Error ? err.message : "Invalid message format",
        });
      }
    };

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, onMessage);
  };
};
