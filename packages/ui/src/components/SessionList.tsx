import React from 'react';
import { useChatStore } from '../store/chat-store';

export function SessionList() {
  const { sessions, currentSessionKey, selectSession } = useChatStore();

  const handleSessionSelect = (sessionKey: string) => {
    selectSession(sessionKey).catch(console.error);
  };

  // Build hierarchical structure
  const rootSessions = sessions.filter(s => !s.parentSessionKey);
  const sessionsByParent = sessions.reduce((acc, session) => {
    if (session.parentSessionKey) {
      if (!acc[session.parentSessionKey]) {
        acc[session.parentSessionKey] = [];
      }
      acc[session.parentSessionKey].push(session);
    }
    return acc;
  }, {} as Record<string, typeof sessions>);

  const SessionItem = ({ session, depth = 0 }: { session: typeof sessions[0], depth?: number }) => {
    const isSelected = session.sessionKey === currentSessionKey;
    const children = sessionsByParent[session.sessionKey] || [];
    
    return (
      <div>
        <button
          onClick={() => handleSessionSelect(session.sessionKey)}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-l-2 ${
            isSelected
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'border-transparent text-gray-700'
          }`}
          style={{ paddingLeft: `${16 + depth * 16}px` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {session.label || session.sessionKey.slice(0, 8)}
              </div>
              <div className="text-xs text-gray-500">
                {session.agentId || session.kind}
              </div>
            </div>
            <div className="ml-2 flex-shrink-0">
              {session.isActive && (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              )}
            </div>
          </div>
        </button>
        
        {children.map(child => (
          <SessionItem
            key={child.sessionKey}
            session={child}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  };

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-sm">サブエージェントが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootSessions.map(session => (
        <SessionItem key={session.sessionKey} session={session} />
      ))}
    </div>
  );
}