const WebSocket = require('ws');

async function finalIntegrationTest() {
  console.log('🎯 FINAL INTEGRATION TEST - Complete SubChat Functionality');
  
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
          console.log('✅ sessions.list SUCCESS!');
          
          const sessionsData = message.payload || message.result;
          const sessionsList = sessionsData.sessions || [];
          
          console.log(`📊 Found ${sessionsList.length} sessions:`);
          sessionsList.forEach((session, i) => {
            console.log(`  ${i + 1}. ${session.displayName}`);
            console.log(`     Channel: ${session.channel}`);
            console.log(`     Group: ${session.groupChannel}`);
            console.log(`     Tokens: ${session.totalTokens.toLocaleString()}`);
          });
          
          if (sessionsList.length > 0) {
            const firstSessionKey = sessionsList[0].key;
            console.log(`\n📜 Testing chat.history for: ${sessionsList[0].displayName}`);
            
            ws.send(JSON.stringify({
              type: "req",
              id: "final-history",
              method: "chat.history",
              params: { sessionKey: firstSessionKey }
            }));
          }
        } else {
          console.log('❌ sessions.list failed:', message.error?.message);
          ws.close();
        }
      }
      
      if (message.type === 'res' && message.id === 'final-history') {
        if (message.ok) {
          console.log('✅ chat.history SUCCESS!');
          
          const historyData = message.payload || message.result;
          if (historyData.messages && Array.isArray(historyData.messages)) {
            console.log(`💬 Found ${historyData.messages.length} messages`);
            
            // Test content extraction
            const recentMessages = historyData.messages.slice(-3);
            recentMessages.forEach((msg, i) => {
              let displayText = '[No content]';
              
              if (typeof msg.content === 'string') {
                displayText = msg.content.substring(0, 100) + '...';
              } else if (Array.isArray(msg.content)) {
                const textParts = msg.content
                  .filter(part => part.type === 'text')
                  .map(part => part.text)
                  .filter(Boolean);
                displayText = textParts.join(' ').substring(0, 100) + '...';
              }
              
              console.log(`  Recent ${i + 1}: [${msg.role}] ${displayText}`);
            });
            
            console.log('\n🎉🎉🎉 SUBCHAT FULLY FUNCTIONAL!');
            console.log('🚀 All components working perfectly:');
            console.log('   ✅ Gateway connection');
            console.log('   ✅ Admin authentication');
            console.log('   ✅ sessions.list API (payload.sessions structure)');
            console.log('   ✅ chat.history API');
            console.log('   ✅ Message content extraction');
            console.log('   ✅ Rich session metadata');
            
            console.log('\n📋 Ready for UI integration!');
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
  }, 20000);
}

finalIntegrationTest().catch(console.error);
