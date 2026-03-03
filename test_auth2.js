const WebSocket = require('ws');

console.log('Testing different auth response formats...');

const ws = new WebSocket('ws://localhost:18792/gateway');
const authToken = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';

ws.on('open', function() {
  console.log('✅ WebSocket connected');
});

ws.on('message', function(data) {
  console.log('📨 Received:', data.toString());
  
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'event' && message.event === 'connect.challenge') {
      console.log('🔐 Received auth challenge');
      
      // Try different response formats
      const formats = [
        // Format 1: RPC style
        {
          id: '0',
          method: 'connect.auth',
          params: {
            nonce: message.payload.nonce,
            token: authToken
          }
        },
        // Format 2: Simple object
        {
          type: 'connect.auth',
          nonce: message.payload.nonce,
          token: authToken
        },
        // Format 3: Event style
        {
          type: 'event',
          event: 'connect.auth',
          payload: {
            nonce: message.payload.nonce,
            token: authToken
          }
        }
      ];
      
      // Try format 1
      console.log('📤 Trying RPC style auth...');
      ws.send(JSON.stringify(formats[0]));
      
      setTimeout(() => {
        console.log('📤 Trying simple object style auth...');
        ws.send(JSON.stringify(formats[1]));
      }, 500);
      
      setTimeout(() => {
        console.log('📤 Trying event style auth...');
        ws.send(JSON.stringify(formats[2]));
      }, 1000);
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
  console.log('Closing test...');
  ws.close();
}, 5000);
