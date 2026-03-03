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

  constructor(private gatewayUrl: string) {}

  async connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.gatewayUrl);
        if (token) {
          url.searchParams.set('token', token);
        }
        
        this.ws = new WebSocket(url.toString());
        
        this.ws.onopen = () => {
          console.log('Connected to OpenClaw Gateway');
          resolve();
        };
        
        this.ws.onerror = (error) => {
          console.error('Gateway connection error:', error);
          reject(new Error('Failed to connect to Gateway'));
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };
        
        this.ws.onclose = () => {
          console.log('Disconnected from Gateway');
          this.cleanup();
        };
      } catch (error) {
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

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(request));
    });
  }

  // API methods
  async listSessions(): Promise<SessionInfo[]> {
    return this.request('sessions_list');
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