import type { 
  GatewayMessage, 
  GatewayRequest, 
  GatewayResponse, 
  SessionInfo 
} from '@subchat/shared';

export class GatewayClient {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();
  private authenticated = false;

  constructor(private gatewayUrl: string) {}

  async connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.gatewayUrl);
        if (token) {
          url.searchParams.set('token', token);
        }
        
        console.log('Connecting to:', url.toString());
        this.ws = new WebSocket(url.toString());
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          // For now, assume we're authenticated after connection
          this.authenticated = true;
          resolve();
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ Gateway connection error:', error);
          reject(new Error('Failed to connect to Gateway'));
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received:', message);
            
            // Handle authentication challenge - try RPC style response
            if (message.type === 'event' && message.event === 'connect.challenge') {
              console.log('🔐 Received auth challenge, responding with RPC style...');
              const authResponse = {
                id: '0',
                method: 'connect.auth',
                params: {
                  nonce: message.payload.nonce,
                  token: token || ''
                }
              };
              console.log('📤 Sending auth response:', authResponse);
              this.ws!.send(JSON.stringify(authResponse));
              return;
            }
            
            // Handle successful authentication
            if (message.type === 'event' && message.event === 'connect.ready') {
              console.log('✅ Authentication successful');
              this.authenticated = true;
              resolve();
              return;
            }
            
            this.handleMessage(message);
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        };
        
        this.ws.onclose = () => {
          console.log('🔌 Disconnected from Gateway');
          this.authenticated = false;
          this.cleanup();
        };
      } catch (error) {
        console.error('Connection setup error:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: GatewayResponse | GatewayMessage) {
    // Handle RPC response
    if ('id' in message && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
      return;
    }
    
    // Handle push notifications
    if ('type' in message) {
      this.onMessage?.(message);
    }
  }

  private cleanup() {
    // Reject all pending requests
    for (const { reject } of this.pendingRequests.values()) {
      reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
  }

  async request(method: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Gateway not connected');
    }

    const id = (++this.requestId).toString();
    const request: GatewayRequest = { id, method, params };

    console.log('📤 Sending:', request);

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(request));
      
      // Add timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  // API methods
  async listSessions(): Promise<SessionInfo[]> {
    try {
      const result = await this.request('sessions_list');
      return result || [];
    } catch (error) {
      console.error('Failed to list sessions:', error);
      return [];
    }
  }

  async getSessionHistory(sessionKey: string): Promise<any> {
    return this.request('sessions_history', { sessionKey });
  }

  async sendMessage(sessionKey: string, message: string): Promise<void> {
    return this.request('sessions_send', { sessionKey, message });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Event handlers
  onMessage?: (message: GatewayMessage) => void;
  onDisconnect?: () => void;
}
