// SubChat v2 - Clean Type Definitions

export interface Session {
  id: string;
  name: string;
  agentId: string;
  lastActivity: Date;
  messageCount: number;
  isActive: boolean;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'sent' | 'failed' | 'queued';
}

export interface QueuedMessage extends Message {
  status: 'queued';
  retryCount: number;
  queuedAt: Date;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

export interface AppState {
  sessions: Session[];
  messages: Record<string, Message[]>;
  currentSessionId: string | null;
  connection: ConnectionState;
}
