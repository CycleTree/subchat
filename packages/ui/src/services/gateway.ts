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
  status?: string;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
}

export class OpenClawGateway {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  private connectResolve: ((value: any) => void) | null = null;
  private connectReject: ((error: Error) => void) | null = null;
  private authToken = '';
  
  public onConnectionChange?: (isConnected: boolean) => void;

  async connect(gatewayUrl: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this.authToken = token;
      
      const wsUrl = `${gatewayUrl}?token=${token}`;
      console.log('🔗 Connecting to OpenClaw Gateway:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.onConnectionChange?.(false); // Wait for auth
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Message parse error:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.connectReject?.(new Error('WebSocket connection failed'));
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.onConnectionChange?.(false);
        this.cleanup();
      };
    });
  }

  private handleMessage(message: any) {
    // Handle challenge-response auth
    if (message.type === 'event' && message.event === 'connect.challenge') {
      console.log('🔐 Auth challenge received');
      this.authenticate();
      return;
    }
    
    // Handle auth response
    if (message.type === 'res' && message.id === 'auth') {
      if (message.ok) {
        console.log('🎉 Authentication successful');
        this.onConnectionChange?.(true);
        this.connectResolve?.(message.payload);
      } else {
        console.error('❌ Authentication failed:', message.error);
        this.connectReject?.(new Error(`Auth failed: ${message.error?.message}`));
      }
      return;
    }
    
    // Handle request responses
    if (message.type === 'res' && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      
      if (message.ok) {
        request.resolve(message.payload);
      } else {
        request.reject(new Error(message.error?.message || 'Request failed'));
      }
    }
  }

  private authenticate() {
    const authRequest = {
      type: 'req',
      id: 'auth',
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'gateway-client',
          version: '1.0.0',
          platform: 'browser',
          mode: 'ui'
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write', 'operator.admin'],
        auth: { token: this.authToken }
      }
    };
    
    console.log('📤 Sending auth request');
    this.ws?.send(JSON.stringify(authRequest));
  }

  private cleanup() {
    this.pendingRequests.clear();
  }

  async request(method: string, params: any = {}): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const id = (++this.requestId).toString();
    const request = {
      type: 'req',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      console.log('📤 Request:', method, params);
      this.ws!.send(JSON.stringify(request));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  async getSessions(): Promise<Session[]> {
    const response = await this.request('sessions.list');
    console.log('📋 Sessions response:', response);
    
    const sessions = response.sessions || [];
    return sessions.map((session: any, index: number) => ({
      id: session.key || `session-${index}`,
      name: this.formatSessionName(session.key),
      agentId: this.extractAgent(session.key),
      lastActivity: new Date(session.updatedAt || Date.now()),
      messageCount: session.totalTokens || 0,
      isActive: session.isActive ?? true
    }));
  }

  async getMessages(sessionKey: string): Promise<Message[]> {
    const response = await this.request('chat.history', { sessionKey });
    const messages = response.messages || [];
    
    return messages.map((msg: any, index: number) => ({
      id: msg.id || `msg-${index}`,
      sessionId: sessionKey,
      role: msg.role || 'system',
      content: this.extractContent(msg.content),
      timestamp: new Date(msg.timestamp || Date.now())
    }));
  }

  async sendMessage(sessionKey: string, content: string): Promise<void> {
    const idempotencyKey = `subchat-v2-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    await this.request('chat.send', {
      sessionKey,
      message: content,
      idempotencyKey
    });
    
    console.log('✅ Message sent successfully');
  }

  private formatSessionName(key: string): string {
    if (!key) return 'Unknown Session';
    const parts = key.split(':');
    return parts[parts.length - 1] || key;
  }

  private extractAgent(key: string): string {
    if (!key) return 'unknown';
    const parts = key.split(':');
    return parts.length >= 2 && parts[0] === 'agent' ? parts[1] : 'unknown';
  }

  private extractContent(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(item => item?.type === 'text')
        .map(item => item.text)
        .join('\n');
    }
    return String(content);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
  }
}
