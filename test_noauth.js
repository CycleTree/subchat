const WebSocket = require('ws');

console.log('Testing without authentication challenge...');

// Try with token in URL
const ws = new WebSocket('ws://localhost:18792/gateway?token=3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f');

ws.on('open', function() {
  console.log('✅ WebSocket connected with token in URL');
  
  // Immediately try sessions_list
  const request = {
    id: '1',
    method: 'sessions_list',
    params: {}
  };
  console.log('📤 Sending sessions_list immediately...');
  ws.send(JSON.stringify(request));
});

ws.on('message', function(data) {
  console.log('📨 Received:', data.toString());
  
  try {
    const message = JSON.parse(data.toString());
    
    if (message.id === '1') {
      console.log('📋 Sessions response:', message);
      if (message.result && Array.isArray(message.result)) {
        console.log(`✅ Found ${message.result.length} sessions`);
        message.result.forEach((session, i) => {
          console.log(`  ${i+1}. ${session.label || session.sessionKey} (${session.kind})`);
        });
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
  console.log('Timeout - closing');
  ws.close();
}, 3000);
