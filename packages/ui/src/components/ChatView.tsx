import React, { useState } from 'react';
import { useChatStore } from '../store/chat-store';

export function ChatView() {
  const { currentSessionKey, messages, sendMessage, sessions } = useChatStore();
  const [inputText, setInputText] = useState('');

  const currentSession = sessions.find(s => s.sessionKey === currentSessionKey);
  const currentMessages = currentSessionKey ? messages[currentSessionKey] || [] : [];

  const handleSend = async () => {
    if (!inputText.trim() || !currentSessionKey) return;
    try {
      await sendMessage(inputText);
      setInputText('');
    } catch (error) {
      console.error('Failed to send:', error);
    }
  };

  if (!currentSessionKey) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p>Select a session</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>
        <strong>{currentSession?.label || currentSessionKey.slice(0, 8)}</strong>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {currentMessages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: '10px' }}>
            <div style={{ 
              padding: '5px 10px', 
              background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '5px',
              marginLeft: msg.role === 'user' ? '20%' : '0',
              marginRight: msg.role === 'user' ? '0' : '20%'
            }}>
              <div>{msg.content}</div>
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ borderTop: '1px solid #ccc', padding: '10px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, padding: '5px', border: '1px solid #ccc' }}
          placeholder="Type message..."
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          style={{ padding: '5px 15px' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
