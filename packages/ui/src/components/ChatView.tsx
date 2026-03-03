import { useState } from 'react';
import { useChatStore } from '../store/chat-store';

export function ChatView() {
  const { currentSessionKey, messages, sendMessage, isConnected } = useChatStore();
  const [newMessage, setNewMessage] = useState('');

  const currentMessages = currentSessionKey ? messages[currentSessionKey] || [] : [];

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentSessionKey) return;
    
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!currentSessionKey) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: '#666'
      }}>
        Select a session to view conversation
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        padding: '10px', 
        borderBottom: '1px solid #ddd',
        background: '#f8f9fa'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>
          Session: {currentSessionKey}
        </h3>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '10px',
        background: '#fff'
      }}>
        {currentMessages.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No messages in this session
          </div>
        ) : (
          currentMessages.map((message, index) => (
            <div
              key={message.id || index}
              style={{
                padding: '8px',
                margin: '5px 0',
                background: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                borderRadius: '8px',
                borderLeft: `3px solid ${message.role === 'user' ? '#2196F3' : '#4CAF50'}`
              }}
            >
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                {message.role} • {new Date(message.timestamp).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '14px' }}>
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div style={{ 
        padding: '10px', 
        borderTop: '1px solid #ddd',
        background: '#f8f9fa'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isConnected ? "Type a message..." : "Not connected"}
            disabled={!isConnected}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim()}
            style={{
              padding: '8px 16px',
              background: isConnected ? '#2196F3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
