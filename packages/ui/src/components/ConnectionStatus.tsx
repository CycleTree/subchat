import { useState, useEffect } from 'react';
import { useChatStore } from '../store/chat-store';

export function ConnectionStatus() {
  const { isConnected, isLoading, sessions, lastError, retryConnection } = useChatStore();
  const [connectionTime, setConnectionTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isConnected && !connectionTime) {
      setConnectionTime(new Date());
    } else if (!isConnected) {
      setConnectionTime(null);
    }
  }, [isConnected, connectionTime]);

  let status = 'Disconnected';
  let color = 'red';
  let details = '';
  
  if (isLoading) {
    status = 'Connecting...';
    color = 'orange';
    details = 'Authenticating with Gateway';
  } else if (isConnected) {
    status = 'Connected';
    color = 'green';
    details = `${sessions.length} sessions loaded`;
    if (connectionTime) {
      details += ` • Connected at ${connectionTime.toLocaleTimeString()}`;
    }
  } else if (lastError) {
    status = 'Connection Failed';
    color = 'red';
    details = lastError;
  }

  return (
    <div style={{ 
      padding: '10px', 
      background: '#f5f5f5', 
      borderRadius: '5px',
      marginBottom: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
        <div style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          background: color,
          boxShadow: isConnected ? `0 0 10px ${color}` : 'none'
        }}></div>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{status}</span>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
          {!isConnected && !isLoading && (
            <button 
              onClick={retryConnection} 
              style={{ 
                padding: '4px 8px', 
                fontSize: '12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '4px 8px', 
              fontSize: '12px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      </div>
      
      {details && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          {details}
        </div>
      )}
    </div>
  );
}
