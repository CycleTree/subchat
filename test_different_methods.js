const WebSocket = require('ws');

async function testDifferentMethods() {
  console.log('🔍 Testing different API methods to find allowed ones...');
  
  const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
  const url = `ws://localhost:18792/gateway?token=${token}`;
  
  const methodsToTest = [
    'sessions_list',
    'session_list', 
    'list_sessions',
    'sessions',
    'status',
    'info',
    'ping',
    'health',
    'capabilities',
    'whoami',
    'user_sessions',
    'my_sessions',
    'sessions_mine',
    'session_history',
    'sessions_history'
  ];
  
  const ws = new WebSocket(url);
  let authenticated = false;
  let currentMethod = 0;
  
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
        console.log('🎉 Authenticated! Now testing methods...\n');
        authenticated = true;
        
        // Start testing methods
        testNextMethod();
      }
      
      if (message.type === 'res' && message.id.startsWith('test-')) {
        const methodIndex = parseInt(message.id.split('-')[1]);
        const method = methodsToTest[methodIndex];
        
        if (message.ok) {
          console.log(`✅ ${method}: SUCCESS`);
          console.log(`   Result:`, JSON.stringify(message.result, null, 2));
        } else {
          console.log(`❌ ${method}: ${message.error?.message || 'FAILED'}`);
        }
        
        // Test next method
        setTimeout(testNextMethod, 500);
      }
      
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
  
  function testNextMethod() {
    if (currentMethod >= methodsToTest.length) {
      console.log('\n✅ All methods tested');
      ws.close();
      return;
    }
    
    const method = methodsToTest[currentMethod];
    const request = {
      type: "req",
      id: `test-${currentMethod}`,
      method: method,
      params: {}
    };
    
    console.log(`📤 Testing: ${method}`);
    ws.send(JSON.stringify(request));
    currentMethod++;
  }
  
  ws.on('error', (error) => {
    console.log('❌ WebSocket error:', error.message);
  });
  
  ws.on('close', () => {
    console.log('🔌 Connection closed');
  });
  
  // Timeout
  setTimeout(() => {
    console.log('⏰ Test timeout');
    ws.close();
  }, 30000);
}

testDifferentMethods().catch(console.error);
