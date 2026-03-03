import React from 'react';
import { useChatStore } from '../store/chat-store';

export function ConnectionStatus() {
  const { isConnected, isLoading } = useChatStore();

  let status = 'Disconnected';
  let color = 'red';
  
  if (isLoading) {
    status = 'Connecting...';
    color = 'orange';
  } else if (isConnected) {
    status = 'Connected';
    color = 'green';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></div>
      <span style={{ fontSize: '12px' }}>{status}</span>
      <button onClick={() => window.location.reload()} style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '10px' }}>
        Reload
      </button>
    </div>
  );
}
