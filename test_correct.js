const WebSocket = require('ws');

console.log('Testing with correct port and token...');

const ws = new WebSocket('ws://localhost:18792/gateway');
const authToken = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
let authenticated = false;

ws.on('open', function() {
  console.log('✅ WebSocket connected to port 18792');
});

ws.on('message', function(data) {
  console.log('📨 Received:', data.toString());
  
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'event' && message.event === 'connect.challenge') {
      console.log('🔐 Received auth challenge, responding with correct token...');
      const authResponse = {
        type: 'auth',
        nonce: message.payload.nonce,
        token: authToken
      };
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
      console.log('📤 Requesting sessions...');
      ws.send(JSON.stringify(request));
      return;
    }
    
    if (message.id === '1') {
      console.log('📋 Sessions response:', message);
      if (message.result && Array.isArray(message.result)) {
        console.log(`✅ Found ${message.result.length} sessions`);
        message.result.forEach((session, i) => {
          console.log(`  ${i+1}. ${session.label || session.sessionKey} (${session.kind})`);
        });
      }
      
      setTimeout(() => ws.close(), 1000);
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
