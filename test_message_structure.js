const WebSocket = require('ws');

async function testMessageStructure() {
  console.log('🔍 Testing actual message structure...');
  
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
          const firstSessionKey = sessionsList[0].key;
          console.log(`🔍 Getting chat history for: ${firstSessionKey}`);
          
          ws.send(JSON.stringify({
            type: "req",
            id: "history",
            method: "chat.history",
            params: { sessionKey: firstSessionKey }
          }));
        }
      }
      
      if (message.type === 'res' && message.id === 'history' && message.ok) {
        const historyData = message.payload || message.result;
        
        if (historyData.messages && Array.isArray(historyData.messages)) {
          console.log(`💬 Found ${historyData.messages.length} messages`);
          
          // ✅ Check actual message structure
          const lastFewMessages = historyData.messages.slice(-3);
          lastFewMessages.forEach((msg, i) => {
            console.log(`\nMessage ${i + 1} structure:`);
            console.log('- role:', msg.role);
            console.log('- content type:', typeof msg.content);
            console.log('- content:', JSON.stringify(msg.content, null, 2));
            console.log('- timestamp:', msg.timestamp);
            console.log('- model:', msg.model);
          });
          
        } else {
          console.log('❌ No messages array found');
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
  }, 15000);
}

testMessageStructure().catch(console.error);
