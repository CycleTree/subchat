import type { SessionInfo, Message, ChatState } from '@subchat/shared';
import { GatewayClient } from './gateway-client';

export class SessionManager {
  private state: ChatState = {
    sessions: [],
    currentSessionKey: null,
    messages: {},
    isConnected: false,
    isLoading: false,
  };

  private listeners = new Set<(state: ChatState) => void>();

  constructor(private client: GatewayClient) {
    // Subscribe to gateway events
    this.client.onMessage = (message) => {
      this.handleGatewayMessage(message);
    };
  }

  private handleGatewayMessage(message: any) {
    switch (message.type) {
      case 'chat_message':
        this.addMessage(message.payload);
        break;
      case 'session_update':
        this.updateSession(message.payload);
        break;
    }
  }

  private addMessage(message: Message) {
    const sessionKey = message.sessionKey;
    if (!this.state.messages[sessionKey]) {
      this.state.messages[sessionKey] = [];
    }
    this.state.messages[sessionKey].push(message);
    this.notifyListeners();
  }

  private updateSession(session: SessionInfo) {
    const index = this.state.sessions.findIndex(s => s.sessionKey === session.sessionKey);
    if (index >= 0) {
      this.state.sessions[index] = session;
    } else {
      this.state.sessions.push(session);
    }
    this.notifyListeners();
  }

  async connect(gatewayUrl: string, token?: string): Promise<void> {
    try {
      this.state.isLoading = true;
      this.notifyListeners();

      await this.client.connect(token);
      
      this.state.isConnected = true;
      this.state.isLoading = false;
      this.notifyListeners();
      
      // Load initial data
      await this.refreshSessions();
    } catch (error) {
      this.state.isLoading = false;
      this.state.isConnected = false;
      this.notifyListeners();
      throw error;
    }
  }

  async refreshSessions(): Promise<void> {
    try {
      const sessions = await this.client.listSessions();
      this.state.sessions = sessions;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
      throw error;
    }
  }

  async selectSession(sessionKey: string): Promise<void> {
    try {
      this.state.currentSessionKey = sessionKey;
      
      // Load history if not already loaded
      if (!this.state.messages[sessionKey]) {
        const history = await this.client.getSessionHistory(sessionKey);
        this.state.messages[sessionKey] = history.messages || [];
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to select session:', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.state.currentSessionKey) {
      throw new Error('No session selected');
    }

    try {
      await this.client.sendMessage(this.state.currentSessionKey, message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // State management
  getState(): ChatState {
    return { ...this.state };
  }

  subscribe(listener: (state: ChatState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  disconnect() {
    this.client.disconnect();
    this.state.isConnected = false;
    this.state.currentSessionKey = null;
    this.notifyListeners();
  }
}