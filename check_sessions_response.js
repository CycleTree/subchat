const WebSocket = require('ws');

async function checkSessionsResponse() {
  console.log('🔍 sessions.listレスポンスの詳細確認...');
  
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
        console.log('🎉 Authenticated! Requesting sessions.list...');
        
        ws.send(JSON.stringify({
          type: "req",
          id: "sessions",
          method: "sessions.list",
          params: {}
        }));
      }
      
      if (message.type === 'res' && message.id === 'sessions' && message.ok) {
        console.log('📋 sessions.list SUCCESS!');
        console.log('🔍 詳細なレスポンス構造分析:');
        
        const response = message.payload || message.result;
        
        console.log('\n1. レスポンス最上位構造:');
        console.log('- Type:', typeof response);
        console.log('- Keys:', Object.keys(response || {}));
        console.log('- Has .sessions:', !!response?.sessions);
        console.log('- Sessions type:', typeof response?.sessions);
        
        if (response?.sessions) {
          console.log('\n2. sessions配列詳細:');
          console.log('- Array.isArray:', Array.isArray(response.sessions));
          console.log('- Length:', response.sessions.length);
          
          if (response.sessions.length > 0) {
            console.log('\n3. 最初のセッション構造:');
            const firstSession = response.sessions[0];
            console.log('- Keys:', Object.keys(firstSession));
            console.log('- sessionKey/key:', firstSession.sessionKey || firstSession.key);
            console.log('- displayName:', firstSession.displayName);
            console.log('- channel:', firstSession.channel);
            
            console.log('\n4. 変換テスト (gateway-clientロジック):');
            const converted = {
              sessionKey: firstSession.key,
              label: firstSession.displayName || firstSession.groupChannel || firstSession.key?.split(':').pop() || 'Unknown Session',
              agentId: firstSession.key?.split(':')[1] || 'unknown',
              kind: firstSession.key?.includes('discord') ? 'discord' : 'unknown',
              created: firstSession.createdAt || Date.now(),
              lastActivity: firstSession.updatedAt || Date.now(),
              isActive: firstSession.isActive ?? true
            };
            console.log('- Converted:', JSON.stringify(converted, null, 2));
          }
          
          console.log('\n5. 全セッション概要:');
          response.sessions.forEach((session, i) => {
            console.log(`  ${i + 1}. ${session.displayName} (${session.channel})`);
          });
        } else {
          console.log('\n❌ sessions配列が見つかりません');
          console.log('Raw response:', JSON.stringify(response, null, 2));
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
  
  setTimeout(() => {
    ws.close();
  }, 10000);
}

checkSessionsResponse().catch(console.error);
