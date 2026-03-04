const WebSocket = require('ws');

async function testValidModes() {
  console.log('🔍 Testing valid client.mode values...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  // Try different mode values
  const modesToTest = [
    "ui",           // Was working before
    "cli",          // Common CLI mode
    "admin",        // Admin mode
    "operator",     // Operator mode
    "browser",      // Browser mode
    "webchat",      // Web chat mode
    "dashboard"     // Dashboard mode
  ];
  
  for (const mode of modesToTest) {
    console.log(`\n📤 Testing mode: "${mode}"`);
    
    await new Promise((resolve) => {
      const ws = new WebSocket(url);
      let responded = false;
      
      ws.on('open', () => {
        console.log(`  ✅ Connected for mode: ${mode}`);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'event' && message.event === 'connect.challenge') {
            const connectRequest = {
              type: "req",
              id: "test",
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: "cli",
                  version: "0.1.0",
                  platform: "browser",
                  mode: mode  // Testing different modes
                },
                role: "operator",
                scopes: [
                  "operator.read",
                  "operator.write", 
                  "operator.admin"
                ],
                auth: { token: token }
              }
            };
            
            ws.send(JSON.stringify(connectRequest));
          }
          
          if (message.type === 'res' && message.id === 'test' && !responded) {
            responded = true;
            if (message.ok) {
              console.log(`  🎉 SUCCESS with mode: "${mode}"!`);
              process.exit(0); // Exit on first success
            } else {
              console.log(`  ❌ Failed: ${message.error?.message}`);
            }
            ws.close();
            resolve();
          }
          
        } catch (e) {
          ws.close();
          resolve();
        }
      });
      
      ws.on('error', () => {
        if (!responded) {
          console.log(`  ❌ Connection error for mode: ${mode}`);
        }
        resolve();
      });
      
      ws.on('close', () => resolve());
      
      setTimeout(() => {
        ws.close();
        resolve();
      }, 3000);
    });
  }
  
  console.log('\n❌ No working mode found');
}

testValidModes().catch(console.error);
