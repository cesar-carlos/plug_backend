import { Username } from "../../domain/value_objects/username.value_object";
import { Password } from "../../domain/value_objects/password.value_object";
import { logger } from "../utils/logger";
import { HTTP_STATUS } from "../constants/http_status";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationMiddleware {
  static validateUsername(username: string): ValidationResult {
    try {
      Username.create(username);
      return { isValid: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid username format";
      logger.warn({ username, error: errorMessage }, "Invalid username format");
      return { isValid: false, error: errorMessage };
    }
  }

  static validatePassword(password: string): ValidationResult {
    try {
      Password.create(password);
      return { isValid: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid password format";
      logger.warn({ error: errorMessage }, "Invalid password format");
      return { isValid: false, error: errorMessage };
    }
  }

  static validateCredentials(
    username: string,
    password: string
  ): ValidationResult {
    const usernameResult = this.validateUsername(username);
    if (!usernameResult.isValid) {
      return usernameResult;
    }

    const passwordResult = this.validatePassword(password);
    if (!passwordResult.isValid) {
      return passwordResult;
    }

    return { isValid: true };
  }
}
