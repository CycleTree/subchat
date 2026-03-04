const WebSocket = require('ws');

async function testMethodNames() {
  console.log('🔍 Testing different session method names...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  // Methods to test
  const methodsToTest = [
    'sessions_list',
    'session_list', 
    'sessions.list',
    'list_sessions',
    'sessions',
    'session.list',
    'agent.sessions',
    'subagents',
    'subagents_list',
    'sessions_status',
    'status'
  ];
  
  let authenticated = false;
  let currentIndex = 0;
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ Connected');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'event' && message.event === 'connect.challenge' && !authenticated) {
        console.log('🔐 Authenticating with admin scopes...');
        
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
      
      if (message.type === 'res' && message.id === 'auth') {
        if (message.ok) {
          console.log('🎉 Authenticated! Testing methods...\n');
          authenticated = true;
          testNextMethod();
        } else {
          console.log('❌ Auth failed:', message.error?.message);
          ws.close();
        }
      }
      
      if (message.type === 'res' && message.id.startsWith('method-')) {
        const methodIndex = parseInt(message.id.split('-')[1]);
        const method = methodsToTest[methodIndex];
        
        if (message.ok) {
          console.log(`✅ ${method}: SUCCESS`);
          if (message.payload || message.result) {
            console.log(`   Data type: ${Array.isArray(message.payload || message.result) ? 'Array' : typeof (message.payload || message.result)}`);
            if (Array.isArray(message.payload || message.result)) {
              console.log(`   Array length: ${(message.payload || message.result).length}`);
            }
          }
        } else {
          console.log(`❌ ${method}: ${message.error?.message || 'FAILED'}`);
        }
        
        setTimeout(testNextMethod, 500);
      }
      
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
  
  function testNextMethod() {
    if (currentIndex >= methodsToTest.length) {
      console.log('\n✅ Method testing complete');
      ws.close();
      return;
    }
    
    const method = methodsToTest[currentIndex];
    const request = {
      type: "req",
      id: `method-${currentIndex}`,
      method: method,
      params: {}
    };
    
    console.log(`📤 Testing: ${method}`);
    ws.send(JSON.stringify(request));
    currentIndex++;
  }
  
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

testMethodNames().catch(console.error);
