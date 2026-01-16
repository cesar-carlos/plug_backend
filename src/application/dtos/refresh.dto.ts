export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
}
