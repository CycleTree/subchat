const WebSocket = require('ws');

async function testQuickAuth() {
  console.log('🔌 Quick authentication test after Gateway restart...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ Connected to Gateway');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨', JSON.stringify(message, null, 2));
      
      if (message.type === 'event' && message.event === 'connect.challenge') {
        console.log('🔐 Sending auth...');
        
        const connectRequest = {
          type: "req",
          id: "1",
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: "cli",        // Working values!
              version: "0.1.0",
              platform: "browser",
              mode: "ui"        // Working values!
            },
            auth: {
              token: token
            }
          }
        };
        
        ws.send(JSON.stringify(connectRequest));
      }
      
      if (message.type === 'res' && message.id === '1' && message.ok) {
        console.log('🎉 Auth SUCCESS! Now testing sessions_list...');
        
        // Test sessions_list immediately
        const sessionsRequest = {
          type: "req",
          id: "2",
          method: "sessions_list",
          params: {}
        };
        
        ws.send(JSON.stringify(sessionsRequest));
      }
      
      if (message.type === 'res' && message.id === '2') {
        if (message.ok) {
          console.log('🎉🎉🎉 SESSIONS_LIST SUCCESS!');
          console.log('Sessions:', JSON.stringify(message.result, null, 2));
        } else {
          console.log('❌ sessions_list still failed:', message.error?.message);
        }
        
        ws.close();
      }
      
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
  
  ws.on('error', (error) => {
    console.log('❌ Connection error:', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Closed: ${code} ${reason || ''}`);
  });
  
  // Timeout
  setTimeout(() => {
    console.log('⏰ Timeout');
    ws.close();
  }, 10000);
}

testQuickAuth().catch(console.error);
