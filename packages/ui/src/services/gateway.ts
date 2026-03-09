import type { Message, Session } from '../../../shared/src/types';

export interface ChatEventPayload {
  runId: string;
  sessionKey: string;
  seq: number;
  state: 'delta' | 'final' | 'error';
  message?: {
    role?: 'user' | 'assistant' | 'system';
    content?: any;
    timestamp?: number;
  };
  errorMessage?: string;
}

export class OpenClawGateway {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  private connectResolve: ((value: any) => void) | null = null;
  private connectReject: ((error: Error) => void) | null = null;
  private authToken = '';
  
  public onConnectionChange?: (isConnected: boolean) => void;
  public onChatEvent?: (payload: ChatEventPayload) => void;

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

    if (message.type === 'event' && message.event === 'chat') {
      this.onChatEvent?.(message.payload as ChatEventPayload);
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
      name: session.displayName || this.formatSessionName(session.key),
      agentId: this.extractAgent(session.key),
      lastActivity: new Date(session.updatedAt || Date.now()),
      messageCount: session.totalTokens || 0,
      isActive: session.isActive ?? true,
      parentSessionId: this.extractParentSessionId(session)
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

  async sendIntervention(sessionKey: string, content: string): Promise<{ idempotencyKey: string; transport: 'sessions_send' | 'chat.send' }> {
    const idempotencyKey = `subchat-intervention-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    try {
      await this.request('sessions_send', {
        sessionKey,
        message: content,
        idempotencyKey
      });

      console.log('✅ Intervention sent via sessions_send');
      return { idempotencyKey, transport: 'sessions_send' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!message.includes('Unknown method') && !message.includes('not found') && !message.includes('invalid method')) {
        throw error;
      }

      await this.request('chat.send', {
        sessionKey,
        message: content,
        idempotencyKey
      });

      console.log('✅ Intervention sent via chat.send fallback');
      return { idempotencyKey, transport: 'chat.send' };
    }
  }

  async killSession(sessionKey: string): Promise<void> {
    const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const baseUrl = isDevelopment
      ? 'http://localhost:18792'
      : 'https://subchat-openclaw-gateway.fly.dev';

    const response = await fetch(`${baseUrl}/api/subagents/kill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: sessionKey })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Kill failed: ${errorText}`);
    }

    console.log('🛑 Session killed:', sessionKey);
  }

  async configureApiKey(provider: string, apiKey: string): Promise<void> {
    console.log(`🔧 Configuring ${provider} API key via config.set...`);
    
    try {
      // 1. Get current config
      const configResponse = await this.request('config.get');
      const currentConfig = JSON.parse(configResponse.raw);
      
      // 2. Update config with API key
      currentConfig.env = currentConfig.env || {};
      currentConfig.env.vars = currentConfig.env.vars || {};
      
      if (provider === 'anthropic') {
        currentConfig.env.vars.ANTHROPIC_API_KEY = apiKey;
      } else if (provider === 'openai') {
        currentConfig.env.vars.OPENAI_API_KEY = apiKey;
      } else if (provider === 'gemini') {
        currentConfig.env.vars.GEMINI_API_KEY = apiKey;
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // 3. Save updated config
      const updatedConfigRaw = JSON.stringify(currentConfig, null, 2);
      await this.request('config.set', { raw: updatedConfigRaw, hash: configResponse.hash });
      
      console.log(`✅ ${provider} API key configured successfully`);
      
      // 4. Verify config was saved
      const verifyResponse = await this.request('config.get');
      const verifyConfig = JSON.parse(verifyResponse.raw);
      
      console.log(`📊 Config verification:`, verifyConfig.env?.vars);
      
    } catch (error) {
      console.error(`❌ Failed to configure ${provider} API key:`, error);
      throw new Error(`Failed to configure ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    if (content?.type === 'text' && typeof content.text === 'string') return content.text;
    if (Array.isArray(content)) {
      return content
        .filter(item => item?.type === 'text')
        .map(item => item.text)
        .join('\n');
    }
    return String(content);
  }

  private extractParentSessionId(session: any): string | undefined {
    const parent = session.parentSessionKey || session.parent || session.spawner;

    if (!parent) {
      return undefined;
    }

    if (typeof parent === 'string') {
      return parent;
    }

    if (typeof parent === 'object') {
      return parent.key || parent.sessionKey || parent.id || undefined;
    }

    return undefined;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
  }
}
