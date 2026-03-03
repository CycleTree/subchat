import { useChatStore } from '../store/chat-store';

export function SessionList() {
  const { sessions, currentSessionKey, selectSession, isConnected } = useChatStore();

  if (!isConnected) {
    return (
      <div style={{ padding: '10px', color: '#666' }}>
        Not connected to Gateway
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{ padding: '10px', color: '#666' }}>
        No active sessions found
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '10px 0', fontSize: '14px' }}>
        Active Sessions ({sessions.length})
      </h3>
      <div>
        {sessions.map((session) => (
          <div
            key={session.sessionKey}
            onClick={() => selectSession(session.sessionKey)}
            style={{
              padding: '8px',
              margin: '2px 0',
              background: currentSessionKey === session.sessionKey ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '4px',
              cursor: 'pointer',
              border: currentSessionKey === session.sessionKey ? '1px solid #2196F3' : '1px solid transparent',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {session.label || session.sessionKey}
            </div>
            {session.agentId && (
              <div style={{ fontSize: '10px', color: '#666' }}>
                {session.agentId}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
