const WebSocket = require('ws');

async function testSessionHistory() {
  console.log('🔍 Testing session history methods...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  let sessions = [];
  let authenticated = false;
  
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
        authenticated = true;
        
        ws.send(JSON.stringify({
          type: "req",
          id: "sessions",
          method: "sessions.list",
          params: {}
        }));
      }
      
      if (message.type === 'res' && message.id === 'sessions' && message.ok) {
        sessions = message.payload || message.result || [];
        console.log(`📋 Got ${sessions.length} sessions`);
        
        if (sessions.length > 0) {
          const firstSession = sessions[0];
          console.log(`🔍 Testing history for: ${firstSession.key}`);
          
          // Test different history method names
          const historyMethods = [
            'sessions.history',
            'session.history', 
            'sessions_history',
            'session_history',
            'chat.history',
            'messages.list'
          ];
          
          testHistoryMethods(firstSession.key, historyMethods, 0);
        } else {
          console.log('❌ No sessions found');
          ws.close();
        }
      }
      
      if (message.type === 'res' && message.id.startsWith('history-')) {
        const methodIndex = parseInt(message.id.split('-')[1]);
        const method = message.id.split('-')[2];
        
        if (message.ok) {
          console.log(`✅ ${method}: SUCCESS`);
          console.log('History data structure:', JSON.stringify(message.payload || message.result, null, 2));
          ws.close();
        } else {
          console.log(`❌ ${method}: ${message.error?.message}`);
          
          // Try next method
          const historyMethods = [
            'sessions.history',
            'session.history', 
            'sessions_history',
            'session_history',
            'chat.history',
            'messages.list'
          ];
          
          if (methodIndex + 1 < historyMethods.length) {
            setTimeout(() => {
              testHistoryMethods(sessions[0].key, historyMethods, methodIndex + 1);
            }, 500);
          } else {
            console.log('❌ No working history method found');
            ws.close();
          }
        }
      }
      
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
  
  function testHistoryMethods(sessionKey, methods, index) {
    if (index >= methods.length) return;
    
    const method = methods[index];
    console.log(`📤 Testing history method: ${method}`);
    
    ws.send(JSON.stringify({
      type: "req",
      id: `history-${index}-${method}`,
      method: method,
      params: { sessionKey: sessionKey }
    }));
  }
  
  ws.on('error', (error) => {
    console.log('❌ Error:', error.message);
  });
  
  ws.on('close', () => {
    console.log('🔌 Connection closed');
  });
  
  setTimeout(() => {
    ws.close();
  }, 30000);
}

testSessionHistory().catch(console.error);
