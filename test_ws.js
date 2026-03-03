const WebSocket = require('ws');

console.log('Testing WebSocket connection to OpenClaw Gateway...');

const ws = new WebSocket('ws://localhost:18800/gateway');

ws.on('open', function() {
  console.log('✅ WebSocket connected!');
  
  // Test sessions_list request
  const request = {
    id: '1',
    method: 'sessions_list',
    params: {}
  };
  
  console.log('📤 Sending sessions_list request:', JSON.stringify(request));
  ws.send(JSON.stringify(request));
  
  setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
  }, 3000);
});

ws.on('message', function(data) {
  console.log('📨 Received response:', data.toString());
  try {
    const parsed = JSON.parse(data.toString());
    console.log('📋 Parsed response:', parsed);
    if (parsed.result && parsed.result.length) {
      console.log(`Found ${parsed.result.length} sessions`);
      parsed.result.forEach((session, i) => {
        console.log(`  ${i+1}. ${session.label || session.sessionKey} (${session.kind})`);
      });
    }
  } catch (e) {
    console.log('Unable to parse as JSON');
  }
});

ws.on('error', function(error) {
  console.log('❌ WebSocket error:', error.message);
});

ws.on('close', function() {
  console.log('🔌 Connection closed');
});
