const WebSocket = require('ws');

async function testFullPermissions() {
  console.log('🔍 Testing with FULL PERMISSIONS...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ Connected');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'event' && message.event === 'connect.challenge') {
        console.log('🔐 Authenticating...');
        
        const connectRequest = {
          type: "req",
          id: "auth",
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: "cli",
              version: "0.1.0",
              platform: "browser",
              mode: "ui"
            },
            auth: {
              token: token
            }
          }
        };
        
        ws.send(JSON.stringify(connectRequest));
      }
      
      if (message.type === 'res' && message.id === 'auth' && message.ok) {
        console.log('🎉 Authenticated! Testing sessions_list...');
        
        const sessionsRequest = {
          type: "req",
          id: "sessions",
          method: "sessions_list",
          params: {}
        };
        
        ws.send(JSON.stringify(sessionsRequest));
      }
      
      if (message.type === 'res' && message.id === 'sessions') {
        if (message.ok) {
          console.log('🎉🎉🎉 SESSIONS_LIST SUCCESS!!!');
          console.log('\n📋 Sessions data:');
          console.log(JSON.stringify(message.result, null, 2));
          
          // Test session_history if we have sessions
          if (message.result && message.result.length > 0) {
            const firstSessionKey = message.result[0].sessionKey;
            console.log(`\n📜 Testing session_history for: ${firstSessionKey}`);
            
            const historyRequest = {
              type: "req",
              id: "history",
              method: "sessions_history",
              params: {
                sessionKey: firstSessionKey
              }
            };
            
            ws.send(JSON.stringify(historyRequest));
          } else {
            console.log('📝 No sessions found, closing connection');
            ws.close();
          }
        } else {
          console.log('❌ sessions_list still failed:', message.error?.message);
          ws.close();
        }
      }
      
      if (message.type === 'res' && message.id === 'history') {
        if (message.ok) {
          console.log('🎉 Session history success!');
          console.log('\n📜 History data:');
          console.log(JSON.stringify(message.result, null, 2));
        } else {
          console.log('❌ session_history failed:', message.error?.message);
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
  
  ws.on('close', () => {
    console.log('🔌 Connection closed');
  });
  
  // Timeout
  setTimeout(() => {
    console.log('⏰ Timeout');
    ws.close();
  }, 15000);
}

testFullPermissions().catch(console.error);
