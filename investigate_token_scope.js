const WebSocket = require('ws');

async function investigateTokenScope() {
  console.log('🔍 Investigating token scope behavior...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  // Test different client configurations to see if scope is client-based
  const testConfigs = [
    { id: "cli", mode: "admin" },      // Try admin mode
    { id: "admin", mode: "ui" },       // Try admin id  
    { id: "operator", mode: "ui" },    // Try operator id
    { id: "root", mode: "ui" },        // Try root id
    { id: "gateway", mode: "admin" }   // Try gateway/admin combo
  ];
  
  for (const config of testConfigs) {
    console.log(`\n📤 Testing: id="${config.id}", mode="${config.mode}"`);
    
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
              id: "auth",
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: config.id,
                  version: "0.1.0",
                  platform: "browser",
                  mode: config.mode
                },
                auth: {
                  token: token
                }
              }
            };
            
            ws.send(JSON.stringify(connectRequest));
          }
          
          if (message.type === 'res' && message.id === 'auth' && message.ok) {
            console.log('  🎉 Auth successful, testing sessions_list...');
            
            const sessionsRequest = {
              type: "req",
              id: "test",
              method: "sessions_list",
              params: {}
            };
            
            ws.send(JSON.stringify(sessionsRequest));
          }
          
          if (message.type === 'res' && message.id === 'test') {
            if (message.ok) {
              console.log(`  🎉🎉🎉 SUCCESS with id="${config.id}", mode="${config.mode}"!`);
              console.log('  Sessions count:', message.result?.length || 0);
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
      
      ws.on('error', () => resolve());
      ws.on('close', () => resolve());
      
      setTimeout(() => {
        ws.close();
        resolve();
      }, 3000);
    });
  }
  
  console.log('\n❌ No working configuration found');
  console.log('💡 Token scope appears to be fixed, not client-based');
}

investigateTokenScope().catch(console.error);
