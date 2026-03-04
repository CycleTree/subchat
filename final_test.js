const WebSocket = require('ws');

async function finalTest() {
  console.log('🎯 FINAL SUBCHAT TEST - Complete Integration');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ Connected to OpenClaw Gateway');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'event' && message.event === 'connect.challenge') {
        console.log('🔐 Auth challenge received');
        
        const connectRequest = {
          type: "req",
          id: "final-auth",
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: { id: "cli", version: "0.1.0", platform: "browser", mode: "ui" },
            role: "operator",
            scopes: ["operator.read", "operator.write", "operator.admin"],
            auth: { token: token }
          }
        };
        
        console.log('📤 Sending auth with full admin privileges...');
        ws.send(JSON.stringify(connectRequest));
      }
      
      if (message.type === 'res' && message.id === 'final-auth') {
        if (message.ok) {
          console.log('🎉 Authentication SUCCESS with admin privileges!');
          console.log('🔍 Testing sessions.list...');
          
          ws.send(JSON.stringify({
            type: "req",
            id: "final-sessions",
            method: "sessions.list",
            params: {}
          }));
        } else {
          console.log('❌ Auth failed:', message.error?.message);
          ws.close();
        }
      }
      
      if (message.type === 'res' && message.id === 'final-sessions') {
        if (message.ok) {
          console.log('🎉🎉🎉 SESSIONS.LIST SUCCESS!');
          console.log('📊 Session data received:');
          console.log(JSON.stringify(message.payload || message.result, null, 2));
          
          console.log('\n✅ SUBCHAT INTEGRATION COMPLETE!');
          console.log('🚀 All components working:');
          console.log('   ✅ Gateway connection');
          console.log('   ✅ Admin authentication'); 
          console.log('   ✅ sessions.list API');
          console.log('   ✅ Data parsing');
          
        } else {
          console.log('❌ sessions.list failed:', message.error?.message);
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

finalTest().catch(console.error);
