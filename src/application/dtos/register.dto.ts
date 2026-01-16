export interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  error?: string;
}
