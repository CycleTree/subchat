import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chat-store';

export function ChatView() {
  const { 
    currentSessionKey, 
    messages, 
    sendMessage,
    sessions
  } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.sessionKey === currentSessionKey);
  const currentMessages = currentSessionKey ? messages[currentSessionKey] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentSessionKey) return;

    try {
      await sendMessage(inputText);
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentSessionKey) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">サブエージェントを選択してください</div>
          <div className="text-sm">左のリストからセッションを選択すると会話が表示されます</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">
              {currentSession?.label || currentSessionKey.slice(0, 8)}
            </h3>
            <div className="text-xs text-gray-500">
              {currentSession?.agentId || currentSession?.kind}
            </div>
          </div>
          {currentSession?.isActive && (
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm">アクティブ</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.role === 'assistant'
                  ? 'bg-white border border-gray-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user'
                    ? 'text-blue-100'
                    : 'text-gray-500'
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}