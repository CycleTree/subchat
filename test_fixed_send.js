const WebSocket = require('ws');

async function testFixedSend() {
  console.log('🔍 修正済みSend APIテスト...');
  
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
            client: { id: "cli", version: "0.1.0", platform: "browser", mode: "ui" },
            role: "operator",
            scopes: ["operator.read", "operator.write", "operator.admin"],
            auth: { token: token }
          }
        };
        
        ws.send(JSON.stringify(connectRequest));
      }
      
      if (message.type === 'res' && message.id === 'auth' && message.ok) {
        console.log('🎉 Authenticated! Getting sessions...');
        
        ws.send(JSON.stringify({
          type: "req",
          id: "sessions",
          method: "sessions.list",
          params: {}
        }));
      }
      
      if (message.type === 'res' && message.id === 'sessions' && message.ok) {
        const sessionsData = message.payload || message.result;
        const sessionsList = sessionsData.sessions || [];
        
        if (sessionsList.length > 0) {
          // Use Agent 1 session if available, otherwise use first session
          const agent1Session = sessionsList.find(session => session.key.includes('agent:1'));
          const targetSession = agent1Session || sessionsList[0];
          
          console.log(`💬 Testing fixed chat.send to: ${targetSession.key}`);
          
          const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).substring(2)}`;
          
          ws.send(JSON.stringify({
            type: "req",
            id: "send-test",
            method: "chat.send",
            params: { 
              sessionKey: targetSession.key, 
              message: "🎉 Test message from subchat with idempotency key!",
              idempotencyKey: idempotencyKey
            }
          }));
        } else {
          console.log('❌ No sessions found for testing');
          ws.close();
        }
      }
      
      if (message.type === 'res' && message.id === 'send-test') {
        if (message.ok) {
          console.log('🎉🎉🎉 CHAT.SEND SUCCESS!');
          console.log('✅ Message sent successfully');
          console.log('Response:', JSON.stringify(message.payload || message.result, null, 2));
        } else {
          console.log('❌ chat.send still failed:', message.error?.message);
          console.log('Error details:', JSON.stringify(message.error, null, 2));
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
  }, 20000);
}

testFixedSend().catch(console.error);
