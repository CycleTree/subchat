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

    this.client.onDisconnect = () => {
      this.state.isConnected = false;
      this.notifyListeners();
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
      console.log('🔗 SessionManager: Starting connection...');
      this.state.isLoading = true;
      this.state.isConnected = false;
      this.notifyListeners();

      // Connect with retry logic
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔗 Connection attempt ${attempt}/3`);
          await this.client.connect(token);
          
          // Wait a moment for authentication to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          if (this.client.isConnected()) {
            console.log('✅ Authentication successful');
            this.state.isConnected = true;
            this.state.isLoading = false;
            this.notifyListeners();
            
            // Load initial data
            await this.refreshSessions();
            return;
          } else {
            throw new Error('Authentication failed');
          }
        } catch (error) {
          console.log(`❌ Connection attempt ${attempt} failed:`, error);
          lastError = error;
          
          if (attempt < 3) {
            console.log('🔄 Retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      throw lastError || new Error('Failed to connect after 3 attempts');
    } catch (error) {
      console.error('❌ SessionManager: Connection failed:', error);
      this.state.isLoading = false;
      this.state.isConnected = false;
      this.notifyListeners();
      throw error;
    }
  }

  async refreshSessions(): Promise<void> {
    try {
      console.log('📋 Refreshing sessions...');
      const sessions = await this.client.listSessions();
      console.log(`✅ Loaded ${sessions.length} sessions`);
      this.state.sessions = sessions;
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Failed to refresh sessions:', error);
      throw error;
    }
  }

  async selectSession(sessionKey: string): Promise<void> {
    try {
      console.log(`📂 Selecting session: ${sessionKey}`);
      this.state.currentSessionKey = sessionKey;
      
      // Load history if not already loaded
      if (!this.state.messages[sessionKey]) {
        console.log(`📜 Loading history for session: ${sessionKey}`);
        const history = await this.client.getSessionHistory(sessionKey);
        this.state.messages[sessionKey] = history.messages || [];
        console.log(`✅ Loaded ${this.state.messages[sessionKey].length} messages`);
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Failed to select session:', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.state.currentSessionKey) {
      throw new Error('No session selected');
    }

    try {
      console.log(`💬 Sending message to ${this.state.currentSessionKey}:`, message);
      await this.client.sendMessage(this.state.currentSessionKey, message);
      console.log('✅ Message sent');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
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
    console.log('🔌 SessionManager: Disconnecting...');
    this.client.disconnect();
    this.state.isConnected = false;
    this.state.currentSessionKey = null;
    this.notifyListeners();
  }
}
