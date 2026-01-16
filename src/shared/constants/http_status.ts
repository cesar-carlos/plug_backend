/**
 * HTTP Status Codes
 * Centralized constants to avoid magic numbers
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const CLIENT_ERROR_MIN = 400;
export const CLIENT_ERROR_MAX = 499;
export const SERVER_ERROR_MIN = 500;
