import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { AuthService } from "../../application/services/auth.service";
import { logger } from "../../shared/utils/logger";
import { Username } from "../../domain/value_objects/username.value_object";
import { Password } from "../../domain/value_objects/password.value_object";
import type {
  LoginRequest,
  LoginResponse,
} from "../../application/dtos/login.dto";
import type {
  RegisterRequest,
  RegisterResponse,
} from "../../application/dtos/register.dto";
import type {
  RefreshRequest,
  RefreshResponse,
} from "../../application/dtos/refresh.dto";

const LoginBodySchema = t.Object({
  username: t.String({
    minLength: 3,
    maxLength: 30,
    error: "Username must be between 3 and 30 characters",
  }),
  password: t.String({
    minLength: 8,
    maxLength: 128,
    error: "Password must be between 8 and 128 characters",
  }),
});

const RegisterBodySchema = t.Object({
  username: t.String({
    minLength: 3,
    maxLength: 30,
    error: "Username must be between 3 and 30 characters",
  }),
  password: t.String({
    minLength: 8,
    maxLength: 128,
    error: "Password must be between 8 and 128 characters",
  }),
  role: t.Optional(
    t.String({
      error: "Role must be a string",
    })
  ),
});

const RefreshBodySchema = t.Object({
  refreshToken: t.String({
    error: "Refresh token is required",
  }),
});

export const createAuthController = (authService: AuthService) => {
  return new Elysia().use(authPlugin).group("/auth", (app) =>
    app
      .post(
        "/register",
        async ({ body, jwt, set }): Promise<RegisterResponse> => {
          const { username, password, role }: RegisterRequest = body;

          try {
            Username.create(username);
          } catch (error) {
            logger.warn(
              { username, error: (error as Error).message },
              "Invalid username format"
            );
            set.status = 400;
            throw new Error((error as Error).message);
          }

          try {
            Password.create(password);
          } catch (error) {
            logger.warn(
              { error: (error as Error).message },
              "Invalid password format"
            );
            set.status = 400;
            throw new Error((error as Error).message);
          }

          const result = await authService.register(
            username,
            password,
            role || "user",
            async (payload) => {
              return jwt.sign(payload);
            }
          );

          if (!result.success) {
            logger.warn({ username }, "Registration attempt failed");
            set.status = 400;
            throw new Error(result.error || "Registration failed");
          }

          logger.info(
            { username, role: role || "user" },
            "User registered successfully"
          );

          return {
            success: true,
            message: "User registered successfully",
            token: result.token,
            refreshToken: result.refreshToken,
          };
        },
        {
          body: RegisterBodySchema,
          detail: {
            tags: ["Auth"],
            summary: "Registrar novo usuário",
            description:
              "Cria uma nova conta de usuário e retorna tokens de autenticação (access token e refresh token)",
            responses: {
              200: {
                description: "Usuário registrado com sucesso",
                content: {
                  "application/json": {
                    example: {
                      success: true,
                      message: "User registered successfully",
                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      refreshToken: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
                    },
                  },
                },
              },
              400: {
                description: "Erro de validação ou usuário já existe",
                content: {
                  "application/json": {
                    example: {
                      success: false,
                      error: "Username already exists",
                    },
                  },
                },
              },
            },
          },
        }
      )
      .post(
        "/login",
        async ({ body, jwt, set }): Promise<LoginResponse> => {
          const { username, password }: LoginRequest = body;

          try {
            Username.create(username);
          } catch (error) {
            logger.warn(
              { username, error: (error as Error).message },
              "Invalid username format"
            );
            set.status = 400;
            throw new Error((error as Error).message);
          }

          try {
            Password.create(password);
          } catch (error) {
            logger.warn(
              { error: (error as Error).message },
              "Invalid password format"
            );
            set.status = 400;
            throw new Error((error as Error).message);
          }

          const result = await authService.login(
            username,
            password,
            async (payload) => {
              return jwt.sign(payload);
            }
          );

          if (!result.success) {
            logger.warn({ username }, "Login attempt failed");
            set.status = 401;
            throw new Error(result.error || "Invalid credentials");
          }

          logger.info({ username }, "User logged in successfully");

          return {
            success: true,
            token: result.token,
            refreshToken: result.refreshToken,
          };
        },
        {
          body: LoginBodySchema,
          detail: {
            tags: ["Auth"],
            summary: "Fazer login",
            description:
              "Autentica um usuário e retorna tokens de autenticação (access token e refresh token)",
            responses: {
              200: {
                description: "Login realizado com sucesso",
                content: {
                  "application/json": {
                    example: {
                      success: true,
                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      refreshToken: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
                    },
                  },
                },
              },
              401: {
                description: "Credenciais inválidas",
                content: {
                  "application/json": {
                    example: {
                      success: false,
                      error: "Invalid credentials",
                    },
                  },
                },
              },
            },
          },
        }
      )
      .post(
        "/refresh",
        async ({ body, jwt, set }): Promise<RefreshResponse> => {
          const { refreshToken }: RefreshRequest = body;

          if (!refreshToken || typeof refreshToken !== "string") {
            logger.warn("Refresh token missing or invalid");
            set.status = 400;
            throw new Error("Refresh token is required");
          }

          const result = await authService.refresh(
            refreshToken,
            async (payload) => {
              return jwt.sign(payload);
            }
          );

          if (!result.success) {
            logger.warn("Token refresh attempt failed");
            set.status = 401;
            throw new Error(result.error || "Token refresh failed");
          }

          logger.info("Token refreshed successfully");

          return {
            success: true,
            token: result.token,
            refreshToken: result.refreshToken,
          };
        },
        {
          body: RefreshBodySchema,
          detail: {
            tags: ["Auth"],
            summary: "Renovar tokens",
            description:
              "Renova o access token e o refresh token usando um refresh token válido. O refresh token usado será revogado e um novo será gerado (rotação de tokens)",
            responses: {
              200: {
                description: "Tokens renovados com sucesso",
                content: {
                  "application/json": {
                    example: {
                      success: true,
                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      refreshToken: "x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4...",
                    },
                  },
                },
              },
              401: {
                description: "Refresh token inválido, expirado ou revogado",
                content: {
                  "application/json": {
                    example: {
                      success: false,
                      error: "Refresh token expired or revoked",
                    },
                  },
                },
              },
            },
          },
        }
      )
  );
};
