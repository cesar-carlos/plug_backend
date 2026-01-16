import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { logger } from "./shared/utils/logger";
import { authPlugin } from "./plugins/auth.plugin";
import { env } from "./shared/config/env";
import { container } from "./shared/di/container";
import { HTTP_STATUS } from "./shared/constants/http_status";
import { ERROR_CODES } from "./shared/constants/error_codes";
import { SOCKET_CONFIG } from "./shared/constants/socket_config";
import { isCommonResourcePath, logError } from "./shared/utils/error_handler_helpers";
import { ErrorMapper } from "./shared/error_handling/error_mapper";
import { ErrorStatusAdjuster } from "./shared/error_handling/error_status_adjuster";

export const app = new Elysia()
  .onError(
    ({
      code,
      error,
      set,
      request,
    }): { success: boolean; code: string | number; message: string } | undefined => {
      const url = new URL(request.url);
      const isNotFound = code === ERROR_CODES.NOT_FOUND;
      const pathname = url.pathname;

      // Ignorar erros de rotas do Socket.io - deixar o Socket.io processar
      if (pathname.startsWith(SOCKET_CONFIG.PATH)) {
        return undefined;
      }

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

      const errorResponse = ErrorMapper.map({
        code,
        error,
        currentStatus,
        isNotFound,
      });

      const finalStatus = ErrorStatusAdjuster.adjustStatus(
        errorResponse,
        currentStatus
      );

      logError(
        errorResponse.code,
        finalStatus,
        error,
        pathname,
        request.method,
        isNotFound
      );

      if (!currentStatus) {
        set.status = finalStatus;
      }

      return {
        success: errorResponse.success,
        code: errorResponse.code,
        message: errorResponse.message,
      };
    }
  )
  .use(
    cors({
      origin: (request: Request) => {
        const origin = request.headers.get("origin");
        // Permite requisições sem origin (Insomnia, curl, Postman)
        if (!origin) return true;

        // Se wildcard, permite tudo
        if (env.CORS_ORIGIN === "*") return true;

        // Lista de origens permitidas
        const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) =>
          o.trim()
        );
        return allowedOrigins.includes(origin);
      },
      credentials: env.CORS_ORIGIN === "*" ? false : true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: true, // Permite todos os headers para compatibilidade com ferramentas REST
      exposeHeaders: ["Content-Type", "Authorization"],
    })
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
  .use(authPlugin)
  .onRequest(({ request }): void => {
    // Não logar requisições do Socket.io para reduzir poluição nos logs
    const url = new URL(request.url);
    if (url.pathname.startsWith(SOCKET_CONFIG.PATH)) {
      return;
    }
    
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
  
  // Rota para delegar requisições Socket.io para o Bun Engine
  // O engine precisa processar todas as requisições /socket.io/* para funcionar corretamente
  .all(`${SOCKET_CONFIG.PATH}*`, ({ request, server }) => {
    const socketConfig = container.socketConfig;
    if (!socketConfig) {
      return new Response('Socket.io not configured', { status: 503 });
    }
    
    // Delega a requisição para o engine do Socket.io
    // O engine processa tanto HTTP polling quanto WebSocket upgrades
    return socketConfig.engine.handleRequest(request, server);
  })

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
