const WebSocket = require('ws');

async function testRealtimeEvents() {
  console.log('🔍 OpenClaw Gateway リアルタイムイベント調査...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ Connected to Gateway');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Log all messages for analysis
      console.log('\n📨 Gateway Message:');
      console.log('  Type:', message.type);
      console.log('  Full:', JSON.stringify(message, null, 2));
      
      // Handle authentication
      if (message.type === 'event' && message.event === 'connect.challenge') {
        console.log('\n🔐 Authenticating...');
        
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
        return;
      }
      
      // Handle successful authentication
      if (message.type === 'res' && message.id === 'auth' && message.ok) {
        console.log('\n🎉 Authenticated! Monitoring real-time events...');
        console.log('📡 Waiting for message events from Gateway...');
        console.log('💬 Now send a test message via SubChat to observe events...');
        
        // Keep connection open to monitor events
        return;
      }
      
      // Look for chat/message related events
      if (message.type === 'event') {
        console.log('\n🎯 EVENT DETECTED:');
        console.log('  Event Type:', message.event);
        console.log('  Event Data:', JSON.stringify(message, null, 2));
      }
      
      // Look for message notifications
      if (message.event && (
        message.event.includes('message') || 
        message.event.includes('chat') ||
        message.event.includes('send')
      )) {
        console.log('\n🔔 MESSAGE-RELATED EVENT:');
        console.log('  Event:', message.event);
        console.log('  Payload:', JSON.stringify(message.payload || {}, null, 2));
      }
      
    } catch (e) {
      console.log('❌ Parse error:', e.message);
      console.log('Raw data:', data.toString().substring(0, 200));
    }
  });
  
  ws.on('error', (error) => {
    console.log('❌ Error:', error.message);
  });
  
  ws.on('close', () => {
    console.log('🔌 Connection closed');
  });
  
  // Keep alive for monitoring
  console.log('⏰ Monitoring for 60 seconds...');
  setTimeout(() => {
    console.log('⏰ Monitoring timeout - closing connection');
    ws.close();
  }, 60000);
}

testRealtimeEvents().catch(console.error);
