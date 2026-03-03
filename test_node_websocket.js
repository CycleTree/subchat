const WebSocket = require('ws');

async function testAuth() {
  console.log('🔌 Testing OpenClaw Gateway authentication...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  console.log('🔗 Connecting to:', url);
  
  const ws = new WebSocket(url);
  let challengeReceived = false;
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
    
    // Try direct request without auth first
    setTimeout(() => {
      if (!challengeReceived) {
        console.log('🔄 No challenge received, trying direct request...');
        const request = {
          id: 1,
          method: 'sessions_list',
          params: {}
        };
        console.log('📤 Sending:', JSON.stringify(request));
        ws.send(JSON.stringify(request));
      }
    }, 1000);
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', JSON.stringify(message, null, 2));
      
      if (message.type === 'event' && message.event === 'connect.challenge') {
        challengeReceived = true;
        console.log('🔐 Auth challenge received!');
        console.log('Challenge details:', message.payload);
        
        // Try all possible auth formats
        const formats = [
          // Format 1: Original RPC style
          {
            id: 0,
            method: 'connect.auth',
            params: {
              nonce: message.payload.nonce,
              token: token
            }
          },
          // Format 2: Event response
          {
            type: 'event',
            event: 'connect.auth',
            payload: {
              nonce: message.payload.nonce,
              token: token
            }
          },
          // Format 3: Simple object
          {
            nonce: message.payload.nonce,
            token: token
          }
        ];
        
        // Try each format with delays
        formats.forEach((authFormat, index) => {
          setTimeout(() => {
            console.log(`📤 Trying auth format ${index + 1}:`, JSON.stringify(authFormat));
            ws.send(JSON.stringify(authFormat));
          }, index * 500);
        });
        
        // Try plain token
        setTimeout(() => {
          console.log('📤 Trying plain token:', token);
          ws.send(token);
        }, formats.length * 500);
      }
      
      // Check for auth success
      if (message.type === 'event' && message.event === 'connect.ready') {
        console.log('🎉 Authentication successful!');
        
        // Now try sessions request
        const sessionsRequest = {
          id: 2,
          method: 'sessions_list',
          params: {}
        };
        console.log('📤 Requesting sessions:', JSON.stringify(sessionsRequest));
        ws.send(JSON.stringify(sessionsRequest));
      }
      
      // Check for auth failure
      if (message.type === 'event' && message.event === 'connect.error') {
        console.log('❌ Authentication failed:', message.payload);
      }
      
      // Handle RPC response
      if (message.id && message.result) {
        console.log('✅ RPC Response received!');
        if (message.id === 1 || message.id === 2) {
          console.log('Sessions result:', message.result);
        }
      }
      
      if (message.error) {
        console.log('❌ Error response:', message.error);
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
  
  // Auto-close after 15 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout, closing...');
    ws.close();
  }, 15000);
}

testAuth().catch(console.error);
