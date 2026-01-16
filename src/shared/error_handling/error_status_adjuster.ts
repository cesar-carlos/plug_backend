import { HTTP_STATUS } from "../constants/http_status";
import { isClientErrorCode } from "../utils/error_handler_helpers";
import type { ErrorResponse } from "./error_mapper";

export class ErrorStatusAdjuster {
  static adjustStatus(
    errorResponse: ErrorResponse,
    currentStatus: number | undefined
  ): number {
    if (
      isClientErrorCode(errorResponse.code) &&
      (!currentStatus || currentStatus >= HTTP_STATUS.INTERNAL_SERVER_ERROR)
    ) {
      return HTTP_STATUS.BAD_REQUEST;
    }

    return currentStatus || errorResponse.statusCode;
  }
}
