import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "bun";
import { compress, decompress } from "./shared/utils/compression";
import { env } from "./shared/config/env";
import { container } from "./shared/di/container";
import { verifyJWT, type JWTPayload } from "./shared/utils/jwt_validator";
import {
  SOCKET_CONFIG,
  SOCKET_EVENTS,
  SOCKET_ERROR_MESSAGES,
} from "./shared/constants/socket_config";
import { SocketLogger } from "./shared/utils/socket_logger";

export const configureSocket = (server: HttpServer<unknown>): Server => {
  try {
    const corsOrigin =
      env.CORS_ORIGIN === "*"
        ? "*"
        : env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

    const io = new Server(server as any, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
      maxHttpBufferSize: SOCKET_CONFIG.MAX_HTTP_BUFFER_SIZE,
      pingTimeout: SOCKET_CONFIG.PING_TIMEOUT,
      pingInterval: SOCKET_CONFIG.PING_INTERVAL,
    });

    io.on(SOCKET_EVENTS.ERROR, (err: Error): void => {
      SocketLogger.logServerError(err);
    });

    if (io.engine) {
      io.engine.on(SOCKET_EVENTS.ERROR, (err: Error): void => {
        SocketLogger.logEngineError(err);
      });
    }

    io.use(async (socket, next): Promise<void> => {
      try {
        const token =
          socket.handshake.auth.token || socket.handshake.query.token;

        if (!token || typeof token !== "string") {
          SocketLogger.logAuthenticationFailure(
            socket.id,
            SOCKET_ERROR_MESSAGES.NO_TOKEN
          );
          return next(new Error(SOCKET_ERROR_MESSAGES.AUTH_REQUIRED));
        }

        const payload = await verifyJWT(token);

        if (!payload) {
          SocketLogger.logAuthenticationFailure(
            socket.id,
            SOCKET_ERROR_MESSAGES.INVALID_TOKEN
          );
          return next(new Error(SOCKET_ERROR_MESSAGES.INVALID_TOKEN));
        }

        socket.data.user = payload;
        SocketLogger.logAuthentication(socket.id, payload.username);
        next();
      } catch (err) {
        SocketLogger.logAuthenticationError(socket.id, err);
        next(new Error(SOCKET_ERROR_MESSAGES.AUTH_FAILED));
      }
    });

    io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
      const user = socket.data.user as JWTPayload | undefined;
      SocketLogger.logConnection(socket.id, user);

      socket.use(async (packet, next): Promise<void> => {
        try {
          const [eventName, payload] = packet;

          if (
            eventName === SOCKET_EVENTS.DISCONNECT ||
            eventName === SOCKET_EVENTS.ERROR
          ) {
            next();
            return;
          }

          if (
            payload &&
            (Buffer.isBuffer(payload) || payload instanceof ArrayBuffer)
          ) {
            const buffer = Buffer.isBuffer(payload)
              ? payload
              : Buffer.from(payload);
            const decoded = await decompress(buffer);
            packet[1] = decoded;
            SocketLogger.logDecompression(socket.id, eventName);
          }

          next();
        } catch (err) {
          SocketLogger.logDecompressionError(socket.id, err);
          next(new Error(SOCKET_ERROR_MESSAGES.INVALID_COMPRESSED_FORMAT));
        }
      });

      socket.emitCompressed = async (
        event: string,
        data: unknown
      ): Promise<void> => {
        try {
          const compressed = await compress(data as object);
          socket.emit(event, compressed);
        } catch (err) {
          SocketLogger.logCompressionError(socket.id, event, err);
        }
      };

      socket.on(SOCKET_EVENTS.ERROR, (err: Error): void => {
        SocketLogger.logSocketError(socket.id, err);
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, (): void => {
        SocketLogger.logDisconnection(socket.id);
      });

      container.chatHandler(socket);
    });

    return io;
  } catch (err) {
    SocketLogger.logServerInitializationError(err);
    throw err;
  }
};
