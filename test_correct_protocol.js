const WebSocket = require('ws');

async function testCorrectProtocol() {
  console.log('🔍 Testing CORRECT OpenClaw Gateway Protocol...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ Connected');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Raw message:', JSON.stringify(message, null, 2));
      
      if (message.type === 'event' && message.event === 'connect.challenge') {
        console.log('🔐 Challenge received, sending FULL PROTOCOL connect...');
        
        // EXACT protocol from OpenClaw docs
        const connectRequest = {
          type: "req",
          id: "connect-test",
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: "cli",                // Valid client ID
              version: "0.1.0",
              platform: "browser",
              mode: "operator"          // Changed from "ui"  
            },
            role: "operator",           // ✅ CRITICAL field
            scopes: [                   // ✅ CRITICAL field 
              "operator.read",
              "operator.write",
              "operator.admin"
            ],
            caps: [],                   // Empty for operator
            commands: [],               // Empty for operator
            permissions: {},            // Empty for operator
            auth: {
              token: token
            },
            locale: "en-US",
            userAgent: "subchat/0.1.0"
          }
        };
        
        console.log('📤 Sending FULL connect:', JSON.stringify(connectRequest, null, 2));
        ws.send(JSON.stringify(connectRequest));
      }
      
      if (message.type === 'res' && message.id === 'connect-test') {
        console.log('🎉 Connect response received!');
        if (message.ok) {
          console.log('✅ SUCCESS! Now testing sessions_list...');
          
          const sessionsRequest = {
            type: "req", 
            id: "sessions-test",
            method: "sessions_list",
            params: {}
          };
          
          console.log('📤 Testing sessions_list...');
          ws.send(JSON.stringify(sessionsRequest));
        } else {
          console.log('❌ Connect failed:', JSON.stringify(message.error, null, 2));
          ws.close();
        }
      }
      
      if (message.type === 'res' && message.id === 'sessions-test') {
        if (message.ok) {
          console.log('🎉🎉🎉 SESSIONS_LIST SUCCESS!!!');
          console.log('Sessions data:', JSON.stringify(message.payload || message.result, null, 2));
        } else {
          console.log('❌ sessions_list failed:', message.error?.message);
        }
        ws.close();
      }
      
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
  
  ws.on('error', (error) => {
    console.log('❌ Error:', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Closed: ${code} ${reason || ''}`);
  });
  
  // Timeout
  setTimeout(() => {
    console.log('⏰ Timeout');
    ws.close();
  }, 15000);
}

testCorrectProtocol().catch(console.error);
