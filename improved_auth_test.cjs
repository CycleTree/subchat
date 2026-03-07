const WebSocket = require('ws');

const GATEWAY_URL = 'ws://localhost:18792/gateway';
const TOKEN = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';

console.log('🧪 Testing complete OpenClaw Gateway authentication flow');

const wsUrl = `${GATEWAY_URL}?token=${TOKEN}`;
const ws = new WebSocket(wsUrl);
let requestId = 0;

ws.on('open', () => {
  console.log('✅ WebSocket connection opened');
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📥 Received:', JSON.stringify(message, null, 2));
  
  if (message.type === 'event' && message.event === 'connect.challenge') {
    console.log('🔐 Sending authentication request...');
    
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
        auth: { token: TOKEN }
      }
    };
    
    console.log('📤 Sending auth:', JSON.stringify(authRequest, null, 2));
    ws.send(JSON.stringify(authRequest));
  }
  
  if (message.type === 'res' && message.id === 'auth') {
    if (message.ok) {
      console.log('🎉 Authentication successful!');
      console.log('✅ SubChat authentication flow works!');
      
      // Test a simple request
      const statusRequest = {
        type: 'req', 
        id: 'test',
        method: 'status',
        params: {}
      };
      console.log('📤 Testing status request...');
      ws.send(JSON.stringify(statusRequest));
      
    } else {
      console.error('❌ Authentication failed:', message.error);
    }
  }
  
  if (message.type === 'res' && message.id === 'test') {
    console.log('📊 Status response received - Gateway fully functional!');
    ws.close();
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('⏰ Closing connection');
  ws.close();
  process.exit(0);
}, 15000);
