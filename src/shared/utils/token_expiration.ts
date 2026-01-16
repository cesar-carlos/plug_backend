/**
 * Calculate JWT expiration timestamp from expires in string
 * Supports formats: "15m" (minutes), "1h" (hours), "7d" (days)
 * Returns Unix timestamp in seconds
 */
export function calculateTokenExpiration(expiresIn: string): number | undefined {
  if (expiresIn.endsWith('m')) {
    const minutes = parseInt(expiresIn.slice(0, -1), 10);
    if (isNaN(minutes) || minutes <= 0) {
      return undefined;
    }
    return Math.floor(Date.now() / 1000) + minutes * 60;
  }

  if (expiresIn.endsWith('h')) {
    const hours = parseInt(expiresIn.slice(0, -1), 10);
    if (isNaN(hours) || hours <= 0) {
      return undefined;
    }
    return Math.floor(Date.now() / 1000) + hours * 60 * 60;
  }

  if (expiresIn.endsWith('d')) {
    const days = parseInt(expiresIn.slice(0, -1), 10);
    if (isNaN(days) || days <= 0) {
      return undefined;
    }
    return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
  }

  return undefined;
}

/**
 * Calculate refresh token expiration date from expires in string
 * Supports formats: "15m" (minutes), "1h" (hours), "7d" (days)
 * Returns Date object
 */
export function calculateRefreshTokenExpirationDate(expiresIn: string): Date {
  const expiresAt = new Date();

  if (expiresIn.endsWith('d')) {
    const days = parseInt(expiresIn.slice(0, -1), 10);
    if (!isNaN(days) && days > 0) {
      expiresAt.setDate(expiresAt.getDate() + days);
      return expiresAt;
    }
  }

  if (expiresIn.endsWith('h')) {
    const hours = parseInt(expiresIn.slice(0, -1), 10);
    if (!isNaN(hours) && hours > 0) {
      expiresAt.setHours(expiresAt.getHours() + hours);
      return expiresAt;
    }
  }

  if (expiresIn.endsWith('m')) {
    const minutes = parseInt(expiresIn.slice(0, -1), 10);
    if (!isNaN(minutes) && minutes > 0) {
      expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
      return expiresAt;
    }
  }

  // Default to 7 days if format is invalid
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}
