import { HTTP_STATUS } from "../constants/http_status";
import { ERROR_CODES } from "../constants/error_codes";
import {
  isClientErrorMessage,
  determineErrorCodeFromMessage,
  determineErrorCodeFromErrorType,
  isClientErrorStatus,
} from "../utils/error_handler_helpers";

export interface ErrorContext {
  code: string | number | undefined;
  error: unknown;
  currentStatus: number | undefined;
  isNotFound: boolean;
}

export interface ErrorResponse {
  success: boolean;
  code: string;
  message: string;
  statusCode: number;
}

export class ErrorMapper {
  static map(context: ErrorContext): ErrorResponse {
    const { code, error, currentStatus, isNotFound } = context;

    if (isNotFound) {
      return {
        success: false,
        code: ERROR_CODES.NOT_FOUND,
        message: "Resource not found",
        statusCode: HTTP_STATUS.NOT_FOUND,
      };
    }

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

    const statusCode = currentStatus || inferredStatus;
    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    return {
      success: false,
      code: errorCode,
      message,
      statusCode,
    };
  }
}
