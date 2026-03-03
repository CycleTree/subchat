import React, { useEffect } from 'react';
import { useChatStore } from './store/chat-store';
import { SessionList } from './components/SessionList';
import { ChatView } from './components/ChatView';
import { ConnectionStatus } from './components/ConnectionStatus';

function App() {
  const { isConnected, connect } = useChatStore();

  useEffect(() => {
    // Use correct OpenClaw Gateway port and auth token
    const gatewayUrl = 'ws://localhost:18792/gateway';
    const authToken = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
    connect(gatewayUrl, authToken);
  }, [connect]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h1>subchat</h1>
          <ConnectionStatus />
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ width: '300px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
            <h2>Sessions</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SessionList />
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <ChatView />
        </div>
      </div>
    </div>
  );
}

export default App;
