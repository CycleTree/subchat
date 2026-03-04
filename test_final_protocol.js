const WebSocket = require('ws');

async function testFinalProtocol() {
  console.log('🔍 Final test: mode="ui" + role="operator" + admin scopes...');
  
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
        console.log('🔐 Challenge received, sending CORRECT FINAL connect...');
        
        const connectRequest = {
          type: "req",
          id: "final",
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: "cli",
              version: "0.1.0",
              platform: "browser",
              mode: "ui"           // ✅ CORRECT: mode="ui" 
            },
            role: "operator",      // ✅ CORRECT: role="operator"
            scopes: [              // ✅ CORRECT: admin scopes
              "operator.read",
              "operator.write",
              "operator.admin"
            ],
            auth: { token: token }
          }
        };
        
        console.log('📤 Final connect request:', JSON.stringify(connectRequest, null, 2));
        ws.send(JSON.stringify(connectRequest));
      }
      
      if (message.type === 'res' && message.id === 'final') {
        if (message.ok) {
          console.log('🎉 Final connect SUCCESS! Testing sessions_list...');
          
          const sessionsRequest = {
            type: "req",
            id: "final-sessions", 
            method: "sessions_list",
            params: {}
          };
          
          ws.send(JSON.stringify(sessionsRequest));
        } else {
          console.log('❌ Final connect failed:', message.error?.message);
          ws.close();
        }
      }
      
      if (message.type === 'res' && message.id === 'final-sessions') {
        if (message.ok) {
          console.log('🎉🎉🎉 FINAL SUCCESS! SESSIONS_LIST WORKS!');
          console.log('Session count:', (message.payload || message.result || []).length);
          console.log('Sessions:', JSON.stringify(message.payload || message.result, null, 2));
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
  
  ws.on('close', () => {
    console.log('🔌 Connection closed');
  });
  
  setTimeout(() => {
    ws.close();
  }, 10000);
}

testFinalProtocol().catch(console.error);
