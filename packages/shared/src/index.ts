// OpenClaw API types
export interface SessionInfo {
  sessionKey: string;
  label?: string;
  agentId?: string;
  kind: string;
  created: number;
  lastActivity: number;
  isActive: boolean;
  parentSessionKey?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sessionKey: string;
}

export interface SessionHistory {
  sessionKey: string;
  messages: Message[];
}

// Gateway WebSocket API
export interface GatewayMessage {
  type: 'session_list' | 'session_history' | 'chat_send' | 'chat_message';
  payload: any;
}

export interface GatewayRequest {
  id: string;
  method: string;
  params: Record<string, any>;
}

export interface GatewayResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// UI State
export interface ChatState {
  sessions: SessionInfo[];
  currentSessionKey: string | null;
  messages: Record<string, Message[]>;
  isConnected: boolean;
  isLoading: boolean;
}