const WebSocket = require('ws');

async function testMoreIds() {
  console.log('🔍 Testing more client.id values with mode="ui"...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const testIds = [
    "ui", "webui", "web-ui", "subchat", "observer", "client",
    "browser", "webapp", "frontend", "dashboard", "monitor",
    "viewer", "session-viewer", "chat-observer", "gateway-ui",
    "openclawui", "claw-ui", "fixus-ui"
  ];
  
  for (let i = 0; i < testIds.length; i++) {
    const clientId = testIds[i];
    
    console.log(`\n📤 Test ${i + 1}/${testIds.length}: id="${clientId}"`);
    
    await new Promise((resolve) => {
      const ws = new WebSocket(url);
      
      ws.on('open', () => {
        console.log('  ✅ Connected');
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'event' && message.event === 'connect.challenge') {
            const connectRequest = {
              type: "req",
              id: "1",
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: clientId,
                  version: "0.1.0",
                  platform: "browser",
                  mode: "ui"  // Use "ui" since it didn't error for mode
                },
                auth: {
                  token: token
                }
              }
            };
            
            ws.send(JSON.stringify(connectRequest));
          }
          
          if (message.type === 'res' && message.id === '1') {
            if (message.ok) {
              console.log(`  🎉🎉🎉 TOTAL SUCCESS! id="${clientId}", mode="ui"`);
              console.log('  Result:', JSON.stringify(message.result, null, 2));
            } else {
              console.log(`  ❌ Failed: ${message.error?.message}`);
            }
            ws.close();
            resolve();
          }
        } catch (e) {
          console.log('  ❌ Parse error:', e.message);
          ws.close();
          resolve();
        }
      });
      
      ws.on('error', (error) => {
        console.log('  ❌ Connection error:', error.message);
        resolve();
      });
      
      ws.on('close', () => {
        resolve();
      });
      
      // Timeout
      setTimeout(() => {
        console.log('  ⏰ Timeout');
        ws.close();
        resolve();
      }, 3000);
    });
  }
  
  console.log('\n✅ All IDs tested');
}

testMoreIds().catch(console.error);
