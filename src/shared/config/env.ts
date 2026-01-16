import { logger } from "../utils/logger";

const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};

const missingVars: string[] = [];

if (!requiredEnvVars.JWT_SECRET) {
  missingVars.push("JWT_SECRET");
}

if (missingVars.length > 0) {
  logger.fatal(
    { missing: missingVars },
    "Missing required environment variables"
  );
  process.exit(1);
}

export const env = {
  JWT_SECRET: requiredEnvVars.JWT_SECRET!,
  CORS_ORIGIN: requiredEnvVars.CORS_ORIGIN,
  PORT: process.env.PORT || "3000",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_PATH: process.env.DATABASE_PATH || "./data/plug_backend.db",
  JWT_ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m",
  JWT_REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "7d",
} as const;
