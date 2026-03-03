const WebSocket = require('ws');

console.log('Testing authentication with OpenClaw Gateway...');

const ws = new WebSocket('ws://localhost:18800/gateway');

let authenticated = false;

ws.on('open', function() {
  console.log('✅ WebSocket connected, waiting for auth challenge...');
});

ws.on('message', function(data) {
  console.log('📨 Received:', data.toString());
  
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'event' && message.event === 'connect.challenge') {
      console.log('🔐 Received auth challenge, responding...');
      const authResponse = {
        type: 'auth',
        nonce: message.payload.nonce,
        token: 'anonymous'
      };
      console.log('📤 Sending auth response:', JSON.stringify(authResponse));
      ws.send(JSON.stringify(authResponse));
      return;
    }
    
    if (message.type === 'event' && message.event === 'connect.ready') {
      console.log('✅ Authentication successful!');
      authenticated = true;
      
      // Now try sessions_list
      const request = {
        id: '1',
        method: 'sessions_list',
        params: {}
      };
      console.log('📤 Sending sessions_list request:', JSON.stringify(request));
      ws.send(JSON.stringify(request));
      return;
    }
    
    if (message.id === '1') {
      console.log('📋 Sessions response:', message);
      if (message.result) {
        console.log(`Found ${message.result.length} sessions`);
      }
      ws.close();
    }
    
  } catch (e) {
    console.log('Unable to parse as JSON:', e.message);
  }
});

ws.on('error', function(error) {
  console.log('❌ WebSocket error:', error.message);
});

ws.on('close', function() {
  console.log('🔌 Connection closed');
});

setTimeout(() => {
  if (!authenticated) {
    console.log('❌ Authentication timeout');
    ws.close();
  }
}, 5000);
