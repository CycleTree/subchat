const WebSocket = require('ws');

async function testIgnoreChallenge() {
  console.log('🔌 Testing by ignoring auth challenge...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  console.log('🔗 Connecting to:', url);
  
  const ws = new WebSocket(url);
  let requestSent = false;
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', JSON.stringify(message, null, 2));
      
      if (message.type === 'event' && message.event === 'connect.challenge') {
        console.log('🔐 Ignoring auth challenge, trying direct request...');
        
        if (!requestSent) {
          requestSent = true;
          
          // Send sessions request directly, ignoring auth challenge
          const sessionsRequest = {
            id: 1,
            method: 'sessions_list',
            params: {}
          };
          console.log('📤 Sending direct request:', JSON.stringify(sessionsRequest));
          ws.send(JSON.stringify(sessionsRequest));
        }
      }
      
      // Handle any response
      if (message.id === 1) {
        console.log('🎉 Direct request succeeded!');
        if (message.result) {
          console.log('Sessions:', message.result);
        }
        if (message.error) {
          console.log('Error:', message.error);
        }
      }
    } catch (e) {
      console.log('❌ Failed to parse message:', e.message);
      console.log('Raw message:', data.toString());
    }
  });
  
  ws.on('error', (error) => {
    console.log('❌ WebSocket error:', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed: ${code} ${reason || '(no reason)'}`);
  });
  
  // Auto-close after 10 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout, closing...');
    ws.close();
  }, 10000);
}

testIgnoreChallenge().catch(console.error);
