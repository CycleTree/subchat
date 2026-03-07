// Browser WebSocket testing utility for SubChat

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

interface WebSocketTestResults {
  results: TestResult[];
  overall: boolean;
  duration: number;
}

export class WebSocketTester {
  private gatewayUrl: string;
  private token: string;
  private results: TestResult[] = [];

  constructor(gatewayUrl: string, token: string) {
    this.gatewayUrl = gatewayUrl;
    this.token = token;
  }

  private addResult(step: string, success: boolean, message: string, details?: any) {
    this.results.push({ step, success, message, details });
    console.log(`${success ? '✅' : '❌'} ${step}: ${message}`, details || '');
  }

  async runTest(): Promise<WebSocketTestResults> {
    const startTime = Date.now();
    this.results = [];

    console.log('🧪 Starting WebSocket Gateway test...');
    console.log('🔗 URL:', this.gatewayUrl);
    console.log('🔑 Token:', this.token.slice(0, 10) + '...');

    return new Promise((resolve) => {
      const wsUrl = `${this.gatewayUrl}?token=${this.token}`;
      let ws: WebSocket;
      
      try {
        ws = new WebSocket(wsUrl);
      } catch (error) {
        this.addResult('WebSocket Creation', false, 'Failed to create WebSocket', error);
        resolve({
          results: this.results,
          overall: false,
          duration: Date.now() - startTime
        });
        return;
      }

      let timeoutId: number;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };

      const finishTest = (overall: boolean) => {
        cleanup();
        resolve({
          results: this.results,
          overall,
          duration: Date.now() - startTime
        });
      };

      // Test timeout
      timeoutId = setTimeout(() => {
        this.addResult('Test Timeout', false, 'Test took longer than 15 seconds');
        finishTest(false);
      }, 15000);

      ws.onopen = () => {
        this.addResult('WebSocket Connection', true, 'Successfully opened WebSocket connection');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'event' && message.event === 'connect.challenge') {
            this.addResult('Auth Challenge', true, 'Received authentication challenge', message);
            
            // Send auth request
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
                auth: { token: this.token }
              }
            };
            
            ws.send(JSON.stringify(authRequest));
            
            this.addResult('Auth Request', true, 'Sent authentication request');
          }
          
          if (message.type === 'res' && message.id === 'auth') {
            if (message.ok) {
              this.addResult('Authentication', true, 'Successfully authenticated', {
                protocol: message.payload?.protocol,
                methods: message.payload?.features?.methods?.length || 0
              });
              
              // Test a simple API call
              const testRequest = {
                type: 'req',
                id: 'test-status',
                method: 'status',
                params: {}
              };
              ws.send(JSON.stringify(testRequest));
              this.addResult('API Request', true, 'Sent test API request (status)');
              
            } else {
              this.addResult('Authentication', false, 'Authentication failed', message.error);
              finishTest(false);
            }
          }
          
          if (message.type === 'res' && message.id === 'test-status') {
            this.addResult('API Response', true, 'Received successful API response', {
              sessions: message.payload?.sessions?.count || 0
            });
            finishTest(true);
          }
          
        } catch (error) {
          this.addResult('Message Parse', false, 'Failed to parse message', { error, raw: event.data });
        }
      };

      ws.onerror = (error) => {
        this.addResult('WebSocket Error', false, 'WebSocket error occurred', {
          readyState: ws.readyState,
          url: ws.url,
          error: error
        });
        finishTest(false);
      };

      ws.onclose = (event) => {
        const wasSuccessful = this.results.some(r => r.step === 'API Response' && r.success);
        if (!wasSuccessful) {
          this.addResult('WebSocket Close', false, `Connection closed unexpectedly`, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          finishTest(false);
        }
      };
    });
  }
}

// Global test function for browser console
export const testGateway = async (gatewayUrl?: string, token?: string): Promise<any> => {
  const defaultGatewayUrl = gatewayUrl || 'ws://localhost:18792/gateway';
  const defaultToken = token || sessionStorage.getItem('subchat_gateway_token') || '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  
  console.log('🧪 Starting WebSocket Gateway test from browser...');
  
  const tester = new WebSocketTester(defaultGatewayUrl, defaultToken);
  const results = await tester.runTest();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`⏱️  Duration: ${results.duration}ms`);
  console.log(`🎯 Overall: ${results.overall ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('\n📋 Detailed Results:');
  
  results.results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.success ? '✅' : '❌'} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  });
  
  if (!results.overall) {
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if OpenClaw Gateway is running: openclaw gateway status');
    console.log('2. Verify token: openclaw config get gateway.auth.token');
    console.log('3. Try fixGatewayAuth() to reset token');
    console.log('4. Check network connectivity to localhost:18792');
  }
  
  return results;
};
