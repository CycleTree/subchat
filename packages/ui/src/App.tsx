import { useEffect } from 'react';
import { SessionList } from './components/SessionList';
import { ChatView } from './components/ChatView';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useChatStore } from './store/chat-store';

export default function App() {
  const { connect, isLoading } = useChatStore();

  useEffect(() => {
    // Auto-connect on mount
    const gatewayUrl = 'ws://localhost:18792/gateway';
    const token = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
    
    connect(gatewayUrl, token).catch(console.error);
  }, [connect]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>subchat - OpenClaw サブエージェント会話観測</h2>
        <ConnectionStatus />
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '300px', borderRight: '1px solid #ddd', padding: '10px' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>subchat</h2>
        <ConnectionStatus />
        <SessionList />
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
        <ChatView />
      </div>
    </div>
  );
}
