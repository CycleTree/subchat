import React from 'react';
import { useChatStore } from '../store/chat-store';

export function ConnectionStatus() {
  const { isConnected, isLoading, refreshSessions } = useChatStore();

  const handleRefresh = () => {
    refreshSessions().catch(console.error);
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-yellow-600">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
        <span className="text-sm">接続中...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center text-red-600">
        <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
        <span className="text-sm">未接続</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center text-green-600">
        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
        <span className="text-sm">接続済み</span>
      </div>
      <button
        onClick={handleRefresh}
        className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
      >
        更新
      </button>
    </div>
  );
}