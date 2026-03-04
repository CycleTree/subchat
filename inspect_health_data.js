const WebSocket = require('ws');

async function inspectHealthData() {
  console.log('🔍 Inspecting health data structure...');
  
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
            client: {
              id: "cli",
              version: "0.1.0",
              platform: "browser",
              mode: "ui"
            },
            auth: {
              token: token
            }
          }
        };
        
        ws.send(JSON.stringify(connectRequest));
      }
      
      if (message.type === 'res' && message.id === 'auth' && message.ok) {
        console.log('🎉 Authenticated! Requesting health...');
        
        const healthRequest = {
          type: "req",
          id: "health",
          method: "health",
          params: {}
        };
        
        ws.send(JSON.stringify(healthRequest));
      }
      
      if (message.type === 'res' && message.id === 'health' && message.ok) {
        console.log('🎉 Health response received!');
        console.log('\n📊 Complete health data structure:');
        console.log(JSON.stringify(message.result, null, 2));
        
        // Check for agents data
        if (message.result?.agents) {
          console.log(`\n🔍 Found ${message.result.agents.length} agents:`);
          message.result.agents.forEach((agent, i) => {
            console.log(`\nAgent ${i + 1}: ${agent.id || 'unknown'}`);
            console.log('  Agent structure:', Object.keys(agent));
            
            if (agent.sessions) {
              console.log('  Sessions structure:', Object.keys(agent.sessions));
              if (agent.sessions.recent) {
                console.log(`  Recent sessions: ${agent.sessions.recent.length}`);
                agent.sessions.recent.forEach((session, j) => {
                  console.log(`    Session ${j + 1}:`, JSON.stringify(session, null, 4));
                });
              }
            }
          });
        } else {
          console.log('❌ No agents array found in health data');
          console.log('Available top-level keys:', Object.keys(message.result || {}));
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
  
  // Timeout
  setTimeout(() => {
    console.log('⏰ Timeout');
    ws.close();
  }, 10000);
}

inspectHealthData().catch(console.error);
