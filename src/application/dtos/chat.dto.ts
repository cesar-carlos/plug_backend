export interface ChatMessageRequest {
  text: string;
  roomId?: string;
}

export interface ChatMessageResponse {
  original: string;
  response: string;
  timestamp: number;
}
