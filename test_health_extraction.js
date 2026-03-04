const WebSocket = require('ws');

async function testHealthExtraction() {
  console.log('🔍 Testing health data extraction...');
  
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
        
        // Extract sessions using the same logic as gateway-client
        function extractSessionsFromHealth(healthData) {
          try {
            const sessions = [];
            
            // Extract from health.agents[].sessions.recent
            if (healthData?.agents) {
              healthData.agents.forEach((agent) => {
                console.log(`Agent: ${agent.id}`);
                if (agent.sessions?.recent) {
                  console.log(`  Sessions: ${agent.sessions.recent.length}`);
                  agent.sessions.recent.forEach((session, index) => {
                    console.log(`    [${index}] ${session.key} (age: ${session.age}ms)`);
                    sessions.push({
                      sessionKey: session.key,
                      label: session.key.split(':').pop() || session.key,
                      agentId: agent.id,
                      kind: session.key.includes('discord') ? 'discord' : 
                             session.key.includes('slack') ? 'slack' : 'unknown',
                      created: session.updatedAt - (session.age || 0),
                      lastActivity: session.updatedAt,
                      isActive: (session.age || 0) < 3600000 // Active if updated within 1 hour
                    });
                  });
                }
              });
            }
            
            return sessions;
          } catch (error) {
            console.error('Failed to extract sessions:', error);
            return [];
          }
        }
        
        const sessions = extractSessionsFromHealth(message.result);
        console.log(`\n✅ Extracted ${sessions.length} sessions:`);
        sessions.forEach((session, index) => {
          console.log(`  ${index + 1}. ${session.sessionKey}`);
          console.log(`     Label: ${session.label}`);
          console.log(`     Agent: ${session.agentId}`);
          console.log(`     Kind: ${session.kind}`);
          console.log(`     Active: ${session.isActive}`);
          console.log(`     Last Activity: ${new Date(session.lastActivity).toLocaleString()}`);
          console.log('');
        });
        
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

testHealthExtraction().catch(console.error);
