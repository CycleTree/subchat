import React from 'react';
import { useChatStore } from '../store/chat-store';

export function SessionList() {
  const { sessions, currentSessionKey, selectSession } = useChatStore();

  if (sessions.length === 0) {
    return <div style={{ padding: '10px' }}>No sessions</div>;
  }

  return (
    <div>
      {sessions.map(session => (
        <div key={session.sessionKey}>
          <button
            onClick={() => selectSession(session.sessionKey)}
            style={{
              width: '100%',
              padding: '10px',
              textAlign: 'left',
              border: 'none',
              background: currentSessionKey === session.sessionKey ? '#e0e0e0' : 'white',
              borderBottom: '1px solid #eee',
              cursor: 'pointer'
            }}
          >
            <div>
              {session.label || session.sessionKey.slice(0, 8)}
            </div>
            <small>{session.agentId || session.kind}</small>
          </button>
        </div>
      ))}
    </div>
  );
}
