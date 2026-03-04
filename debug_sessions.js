const WebSocket = require('ws');

async function debugSessions() {
  console.log('🔍 Debugging sessions.list response...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ Connected');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Raw message:', JSON.stringify(message, null, 2));
      
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
        
        ws.send(JSON.stringify({
          type: "req",
          id: "sessions",
          method: "sessions.list",
          params: {}
        }));
      }
      
      if (message.type === 'res' && message.id === 'sessions') {
        console.log('\n📋 SESSIONS.LIST RESPONSE:');
        console.log('OK:', message.ok);
        console.log('Payload:', JSON.stringify(message.payload, null, 2));
        console.log('Result:', JSON.stringify(message.result, null, 2));
        console.log('Error:', message.error);
        
        if (message.ok && (message.payload || message.result)) {
          const sessions = message.payload || message.result;
          if (Array.isArray(sessions)) {
            console.log(`\n✅ Found ${sessions.length} sessions`);
            sessions.forEach((session, i) => {
              console.log(`Session ${i + 1}:`, {
                key: session.key,
                kind: session.kind,
                displayName: session.displayName,
                channel: session.channel
              });
            });
            
            if (sessions.length > 0) {
              console.log('\n🔍 Testing session.history for first session...');
              const firstSessionKey = sessions[0].key;
              
              ws.send(JSON.stringify({
                type: "req",
                id: "history",
                method: "sessions.history",
                params: { sessionKey: firstSessionKey }
              }));
            }
          } else {
            console.log('❌ Sessions is not an array:', typeof sessions);
          }
        } else {
          console.log('❌ Sessions request failed');
        }
      }
      
      if (message.type === 'res' && message.id === 'history') {
        console.log('\n📜 SESSIONS.HISTORY RESPONSE:');
        console.log('OK:', message.ok);
        console.log('Payload:', JSON.stringify(message.payload, null, 2));
        console.log('Result:', JSON.stringify(message.result, null, 2));
        console.log('Error:', message.error);
        
        ws.close();
      }
      
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
  
  ws.on('error', (error) => {
    console.log('❌ WebSocket Error:', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Connection closed: ${code} ${reason || ''}`);
  });
  
  setTimeout(() => {
    console.log('⏰ Timeout');
    ws.close();
  }, 15000);
}

debugSessions().catch(console.error);
