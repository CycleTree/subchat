import React, { useEffect } from 'react';
import { useChatStore } from './store/chat-store';
import { SessionList } from './components/SessionList';
import { ChatView } from './components/ChatView';
import { ConnectionStatus } from './components/ConnectionStatus';

function App() {
  const { isConnected, connect } = useChatStore();

  useEffect(() => {
    // TODO: Get gateway URL and token from config
    const gatewayUrl = 'ws://localhost:3000/gateway';
    connect(gatewayUrl);
  }, [connect]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">subchat</h1>
          <ConnectionStatus />
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-700">サブエージェント</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SessionList />
          </div>
        </aside>
        
        <div className="flex-1 flex flex-col">
          <ChatView />
        </div>
      </main>
    </div>
  );
}

export default App;