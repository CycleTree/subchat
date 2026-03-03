const WebSocket = require('ws');

async function testSimpleMessages() {
  console.log('🔌 Testing simple message formats...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  console.log('🔗 Connecting to:', url);
  
  const ws = new WebSocket(url);
  let messageIndex = 0;
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', JSON.stringify(message, null, 2));
      
      if (message.type === 'event' && message.event === 'connect.challenge') {
        console.log('🔐 Auth challenge received, trying various message formats...');
        
        const testMessages = [
          // Test 1: Plain string
          'sessions_list',
          
          // Test 2: Simple object
          { method: 'sessions_list' },
          
          // Test 3: Minimal RPC
          { id: 1, method: 'sessions_list' },
          
          // Test 4: Different id type
          { id: '1', method: 'sessions_list' },
          
          // Test 5: No params
          { id: 1, method: 'sessions_list', params: null },
          
          // Test 6: Empty params
          { id: 1, method: 'sessions_list', params: {} },
          
          // Test 7: OpenClaw specific format guess
          { 
            type: 'request',
            method: 'sessions_list',
            id: 1 
          }
        ];
        
        testMessages.forEach((msg, index) => {
          setTimeout(() => {
            messageIndex++;
            console.log(`📤 Test ${messageIndex}: Sending`, typeof msg === 'string' ? msg : JSON.stringify(msg));
            
            if (typeof msg === 'string') {
              ws.send(msg);
            } else {
              ws.send(JSON.stringify(msg));
            }
          }, index * 1000);
        });
      }
      
      // Handle any response
      if (message.id || message.result || message.error) {
        console.log('🎉 Got response!');
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
    
    // If we're getting 1008 errors, let's try a completely different approach
    if (code === 1008) {
      console.log('🔄 1008 error indicates message format issue');
      console.log('💡 This suggests OpenClaw Gateway expects a different message format');
    }
  });
  
  // Auto-close after 15 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout, closing...');
    ws.close();
  }, 15000);
}

testSimpleMessages().catch(console.error);
