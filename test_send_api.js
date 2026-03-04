const WebSocket = require('ws');

async function testSendAPI() {
  console.log('🔍 Send API確認テスト...');
  
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
        console.log('🎉 Authenticated! Getting sessions first...');
        
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
          console.log(`💬 Testing chat.send to: ${firstSessionKey}`);
          
          ws.send(JSON.stringify({
            type: "req",
            id: "send-test",
            method: "chat.send",
            params: { 
              sessionKey: firstSessionKey, 
              message: "🧪 Test message from subchat app!" 
            }
          }));
        } else {
          console.log('❌ No sessions found for testing');
        }
      }
      
      if (message.type === 'res' && message.id === 'send-test') {
        if (message.ok) {
          console.log('🎉 chat.send SUCCESS!');
          console.log('Response:', JSON.stringify(message.payload || message.result, null, 2));
        } else {
          console.log('❌ chat.send failed:', message.error?.message);
          console.log('Error details:', JSON.stringify(message.error, null, 2));
          
          // Try alternative methods
          console.log('🔄 Trying alternative send methods...');
          
          const alternatives = [
            'send',
            'message.send', 
            'sessions.send',
            'agent.send',
            'chat.message'
          ];
          
          testAlternatives(alternatives, 0);
        }
        
        function testAlternatives(methods, index) {
          if (index >= methods.length) {
            console.log('❌ No working send method found');
            ws.close();
            return;
          }
          
          const method = methods[index];
          console.log(`📤 Testing: ${method}`);
          
          ws.send(JSON.stringify({
            type: "req",
            id: `alt-${index}`,
            method: method,
            params: { 
              sessionKey: sessionsList[0].key, 
              message: "🧪 Alternative test message!" 
            }
          }));
          
          // Set up handler for this alternative
          const originalHandler = ws.onmessage;
          ws.onmessage = (data) => {
            try {
              const msg = JSON.parse(data.toString());
              if (msg.type === 'res' && msg.id === `alt-${index}`) {
                if (msg.ok) {
                  console.log(`✅ ${method}: SUCCESS!`);
                  ws.close();
                } else {
                  console.log(`❌ ${method}: ${msg.error?.message}`);
                  setTimeout(() => testAlternatives(methods, index + 1), 1000);
                }
              } else {
                originalHandler.call(ws, data);
              }
            } catch (e) {
              // ignore
            }
          };
        }
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
  }, 30000);
}

testSendAPI().catch(console.error);
