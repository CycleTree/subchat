const WebSocket = require('ws');

async function testFixedSessions() {
  console.log('🎯 Testing FIXED sessions + chat.history...');
  
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
        console.log('📋 Sessions received!');
        
        // ✅ CORRECTED: Use payload.sessions array
        const sessionsData = message.payload || message.result;
        const sessionsList = sessionsData.sessions || [];
        
        console.log(`Found ${sessionsList.length} sessions:`);
        sessionsList.forEach((session, i) => {
          console.log(`  ${i + 1}. ${session.displayName || session.key}`);
          console.log(`     Channel: ${session.channel}`);
          console.log(`     Group: ${session.groupChannel || 'N/A'}`);
          console.log(`     Tokens: ${session.totalTokens || 'N/A'}`);
        });
        
        if (sessionsList.length > 0) {
          const firstSessionKey = sessionsList[0].key;
          console.log(`\n🔍 Testing chat.history for: ${firstSessionKey}`);
          
          ws.send(JSON.stringify({
            type: "req",
            id: "history",
            method: "chat.history",
            params: { sessionKey: firstSessionKey }
          }));
        }
      }
      
      if (message.type === 'res' && message.id === 'history') {
        console.log('\n📜 Chat History Response:');
        if (message.ok) {
          console.log('✅ chat.history SUCCESS!');
          const historyData = message.payload || message.result;
          console.log('History structure:', JSON.stringify(historyData, null, 2));
          
          if (historyData.messages && Array.isArray(historyData.messages)) {
            console.log(`💬 Found ${historyData.messages.length} messages`);
            historyData.messages.slice(-3).forEach((msg, i) => {
              console.log(`  Recent ${i + 1}: ${msg.role} - ${(msg.content || '').substring(0, 100)}...`);
            });
          }
        } else {
          console.log('❌ chat.history failed:', message.error?.message);
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

testFixedSessions().catch(console.error);
