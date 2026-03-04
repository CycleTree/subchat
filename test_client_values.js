const WebSocket = require('ws');

async function testClientValues() {
  console.log('🔍 Testing different client id/mode combinations...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const testCombinations = [
    // Different possible client.id values
    { id: "openclaw", mode: "client" },
    { id: "fixus", mode: "client" },
    { id: "claude", mode: "client" },
    { id: "api", mode: "client" },
    { id: "gateway", mode: "client" },
    
    // Different possible client.mode values
    { id: "openclaw", mode: "ui" },
    { id: "openclaw", mode: "web" },
    { id: "openclaw", mode: "browser" },
    { id: "openclaw", mode: "observer" },
    { id: "openclaw", mode: "readonly" }
  ];
  
  for (let i = 0; i < testCombinations.length; i++) {
    const { id, mode } = testCombinations[i];
    
    console.log(`\n📤 Test ${i + 1}/${testCombinations.length}: id="${id}", mode="${mode}"`);
    
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
                  id: id,
                  version: "0.1.0",
                  platform: "browser",
                  mode: mode
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
              console.log(`  🎉 SUCCESS! id="${id}", mode="${mode}"`);
              console.log('  Result:', message.result);
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
  
  console.log('\n✅ All combinations tested');
}

testClientValues().catch(console.error);
