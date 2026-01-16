import { HTTP_STATUS, CLIENT_ERROR_MIN, CLIENT_ERROR_MAX } from "../constants/http_status";
import { ERROR_CODES } from "../constants/error_codes";
import { logger } from "./logger";

/**
 * Common browser resource paths that should not be logged as errors
 */
const COMMON_RESOURCE_PATHS = [
  "/favicon.ico",
  "/sw.js",
  "/manifest",
  "/robots.txt",
] as const;

/**
 * Client error message patterns
 */
const CLIENT_ERROR_PATTERNS = [
  "already exists",
  "username already",
  "user already",
  "invalid credentials",
  "authentication failed",
  "invalid token",
  "token expired",
  "token revoked",
  "unauthorized",
  "forbidden",
  "not found",
  "invalid",
  "must",
  "validation",
  "required",
] as const;

/**
 * Check if a pathname is a common browser resource
 */
export const isCommonResourcePath = (pathname: string): boolean => {
  return COMMON_RESOURCE_PATHS.some((path) => pathname === path || pathname.startsWith(path));
};

/**
 * Check if error message indicates a client error
 */
export const isClientErrorMessage = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return CLIENT_ERROR_PATTERNS.some((pattern) => lowerMessage.includes(pattern));
};

/**
 * Determine error code from error message
 */
export const determineErrorCodeFromMessage = (errorMessage: string): string => {
  const lowerMessage = errorMessage.toLowerCase();

  if (
    lowerMessage.includes("already exists") ||
    lowerMessage.includes("username already") ||
    lowerMessage.includes("user already")
  ) {
    return ERROR_CODES.USER_ALREADY_EXISTS;
  }

  if (
    lowerMessage.includes("invalid credentials") ||
    lowerMessage.includes("authentication failed")
  ) {
    return ERROR_CODES.AUTHENTICATION_FAILED;
  }

  if (lowerMessage.includes("must") || lowerMessage.includes("validation")) {
    return ERROR_CODES.VALIDATION_ERROR;
  }

  return ERROR_CODES.CLIENT_ERROR;
};

/**
 * Determine error code from JavaScript error type
 */
export const determineErrorCodeFromErrorType = (error: Error): {
  code: string;
  status: number;
} => {
  if (error instanceof ReferenceError) {
    return { code: ERROR_CODES.REFERENCE_ERROR, status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }

  if (error instanceof TypeError) {
    return { code: ERROR_CODES.TYPE_ERROR, status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }

  if (error instanceof SyntaxError) {
    return { code: ERROR_CODES.SYNTAX_ERROR, status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }

  if (error.name === "ValidationError") {
    return { code: ERROR_CODES.VALIDATION_ERROR, status: HTTP_STATUS.BAD_REQUEST };
  }

  if (isClientErrorMessage(error.message)) {
    const code = determineErrorCodeFromMessage(error.message);
    return { code, status: HTTP_STATUS.BAD_REQUEST };
  }

  return { code: ERROR_CODES.INTERNAL_ERROR, status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
};

/**
 * Check if status code is a client error
 */
export const isClientErrorStatus = (status: number): boolean => {
  return status >= CLIENT_ERROR_MIN && status < CLIENT_ERROR_MAX;
};

/**
 * Check if status code is a validation error
 */
export const isValidationErrorStatus = (status: number): boolean => {
  return status === HTTP_STATUS.BAD_REQUEST || status === HTTP_STATUS.UNPROCESSABLE_ENTITY;
};

/**
 * Log error based on type and severity
 */
export const logError = (
  errorCode: string,
  statusCode: number,
  error: unknown,
  url: string,
  method: string,
  isNotFound: boolean
): void => {
  const errorMessage = error instanceof Error ? error.message : undefined;

  if (isNotFound) {
    logger.warn(
      {
        code: errorCode,
        url,
        method,
      },
      "Route not found"
    );
    return;
  }

  if (isValidationErrorStatus(statusCode)) {
    logger.warn(
      {
        code: errorCode,
        url,
        method,
        message: errorMessage,
      },
      "Validation error"
    );
    return;
  }

  if (isClientErrorStatus(statusCode)) {
    logger.warn(
      {
        code: errorCode,
        status: statusCode,
        url,
        method,
        message: errorMessage,
      },
      "Client error"
    );
    return;
  }

  // Server errors (500+)
  logger.error(
    {
      code: errorCode,
      status: statusCode,
      err: error,
      stack: error instanceof Error ? error.stack : undefined,
      url,
      method,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    },
    "Global API Error - preventing crash"
  );
};

/**
 * Determine if error code should result in a 400 status
 */
export const isClientErrorCode = (errorCode: string): boolean => {
  return (
    errorCode === ERROR_CODES.USER_ALREADY_EXISTS ||
    errorCode === ERROR_CODES.VALIDATION_ERROR ||
    errorCode === ERROR_CODES.CLIENT_ERROR ||
    errorCode === ERROR_CODES.AUTHENTICATION_FAILED
  );
};
