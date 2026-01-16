/**
 * User Role Constants
 * Centralized role definitions to avoid magic strings
 */
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
