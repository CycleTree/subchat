const WebSocket = require('ws');

async function testFinalAttempts() {
  console.log('🔍 Final attempts with common system names...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const finalAttempts = [
    // Common system/protocol names
    { id: "cli", mode: "ui" },
    { id: "webui", mode: "webui" },
    { id: "web", mode: "web" },
    { id: "browser", mode: "browser" },
    { id: "openai", mode: "ui" },
    { id: "anthropic", mode: "ui" },
    { id: "claude", mode: "ui" },
    
    // Try without version/platform
    { id: "openclaw", mode: "ui", minimal: true }
  ];
  
  for (let i = 0; i < finalAttempts.length; i++) {
    const { id, mode, minimal } = finalAttempts[i];
    
    console.log(`\n📤 Test ${i + 1}/${finalAttempts.length}: id="${id}", mode="${mode}"${minimal ? ' (minimal)' : ''}`);
    
    await new Promise((resolve) => {
      const ws = new WebSocket(url);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'event' && message.event === 'connect.challenge') {
            const clientInfo = {
              id: id,
              mode: mode
            };
            
            // Add optional fields only if not minimal
            if (!minimal) {
              clientInfo.version = "0.1.0";
              clientInfo.platform = "browser";
            }
            
            const connectRequest = {
              type: "req",
              id: "1",
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: clientInfo,
                auth: {
                  token: token
                }
              }
            };
            
            ws.send(JSON.stringify(connectRequest));
          }
          
          if (message.type === 'res' && message.id === '1') {
            if (message.ok) {
              console.log(`  🎉🎉🎉 SUCCESS FINALLY! id="${id}", mode="${mode}"`);
              console.log('  Result:', JSON.stringify(message.result, null, 2));
              process.exit(0); // Exit immediately on success
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
  
  console.log('\n❌ No working combination found');
  console.log('💡 Need to check OpenClaw source code for correct client schema');
}

testFinalAttempts().catch(console.error);
