import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { logger } from "./shared/utils/logger";
import { authPlugin } from "./plugins/auth.plugin";
import { env } from "./shared/config/env";
import { container } from "./shared/di/container";
import { HTTP_STATUS } from "./shared/constants/http_status";
import { ERROR_CODES } from "./shared/constants/error_codes";
import {
  isCommonResourcePath,
  isClientErrorMessage,
  determineErrorCodeFromMessage,
  determineErrorCodeFromErrorType,
  isClientErrorStatus,
  isValidationErrorStatus,
  isClientErrorCode,
  logError,
} from "./shared/utils/error_handler_helpers";

export const app = new Elysia()
  .onError(
    ({
      code,
      error,
      set,
      request,
    }): { success: boolean; code: string | number; message: string } => {
      const url = new URL(request.url);
      const isNotFound = code === ERROR_CODES.NOT_FOUND;
      const pathname = url.pathname;

      if (isNotFound && isCommonResourcePath(pathname)) {
        set.status = HTTP_STATUS.NOT_FOUND;
        return {
          success: false,
          code: ERROR_CODES.NOT_FOUND,
          message: "Resource not found",
        };
      }

      const currentStatus =
        typeof set.status === "number" ? set.status : undefined;

      let errorCode: string;
      let inferredStatus: number;

      if (code && code !== ERROR_CODES.UNKNOWN) {
        errorCode = typeof code === "string" ? code : String(code);
        inferredStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      } else if (currentStatus && isClientErrorStatus(currentStatus)) {
        if (error instanceof Error && isClientErrorMessage(error.message)) {
          errorCode = determineErrorCodeFromMessage(error.message);
        } else {
          errorCode = ERROR_CODES.CLIENT_ERROR;
        }
        inferredStatus = currentStatus;
      } else if (error instanceof Error) {
        const { code: determinedCode, status } =
          determineErrorCodeFromErrorType(error);
        errorCode = determinedCode;
        inferredStatus = status;
      } else {
        errorCode = ERROR_CODES.UNKNOWN_ERROR;
        inferredStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      }

      const statusCode =
        currentStatus || (isNotFound ? HTTP_STATUS.NOT_FOUND : inferredStatus);

      logError(
        errorCode,
        statusCode,
        error,
        pathname,
        request.method,
        isNotFound
      );

      if (
        isClientErrorCode(errorCode) &&
        (!currentStatus || currentStatus >= HTTP_STATUS.INTERNAL_SERVER_ERROR)
      ) {
        set.status = HTTP_STATUS.BAD_REQUEST as typeof set.status;
      } else if (!currentStatus) {
        const finalStatus = isNotFound ? HTTP_STATUS.NOT_FOUND : inferredStatus;
        set.status = finalStatus as typeof set.status;
      }

      return {
        success: false,
        code: errorCode,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      };
    }
  )
  .use(
    swagger({
      path: "/documentation",
      documentation: {
        info: {
          title: "Plug Backend API",
          description:
            "Backend API REST e Socket.io server construído com Bun, Elysia e Clean Architecture",
          version: "1.0.0",
        },
        tags: [
          {
            name: "Auth",
            description: "Endpoints de autenticação e autorização",
          },
          {
            name: "Health",
            description: "Endpoints de verificação de saúde da API",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description:
                "JWT token obtido através do endpoint /auth/login ou /auth/register",
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    })
  )
  .use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: true, // Permite todos os headers para compatibilidade com ferramentas como Insomnia
      exposedHeaders: ["Content-Type"],
    })
  )
  .use(authPlugin)
  .onRequest(({ request }): void => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      },
      "Incoming Request"
    );
  })
  .use(container.authController)

  .get(
    "/",
    (): { status: string; timestamp: string } => {
      return { status: "online", timestamp: new Date().toISOString() };
    },
    {
      detail: {
        tags: ["Health"],
        summary: "Health Check",
        description:
          "Verifica se a API está online e retorna o status e timestamp atual",
        responses: {
          200: {
            description: "API está online",
            content: {
              "application/json": {
                example: {
                  status: "online",
                  timestamp: "2024-01-15T10:30:00.000Z",
                },
              },
            },
          },
        },
      },
    }
  );

export type App = typeof app;
