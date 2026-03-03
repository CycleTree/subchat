import { create } from 'zustand';
import { GatewayClient, SessionManager } from '@subchat/core';
import type { ChatState } from '@subchat/shared';

interface ChatStore extends ChatState {
  sessionManager: SessionManager | null;
  lastError: string | null;
  connect: (gatewayUrl: string, token?: string) => Promise<void>;
  disconnect: () => void;
  selectSession: (sessionKey: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  retryConnection: () => Promise<void>;
  clearError: () => void;
}

let lastGatewayUrl = '';
let lastToken = '';

export const useChatStore = create<ChatStore>((set, get) => {
  let sessionManager: SessionManager | null = null;

  return {
    // Initial state
    sessions: [],
    currentSessionKey: null,
    messages: {},
    isConnected: false,
    isLoading: false,
    sessionManager: null,
    lastError: null,

    async connect(gatewayUrl: string, token?: string) {
      try {
        set({ isLoading: true, lastError: null });
        
        // Store for retry
        lastGatewayUrl = gatewayUrl;
        lastToken = token || '';
        
        console.log('🔗 ChatStore: Starting connection...');
        
        const client = new GatewayClient(gatewayUrl);
        sessionManager = new SessionManager(client);

        // Subscribe to state changes
        sessionManager.subscribe((state) => {
          set(state);
        });

        set({ sessionManager });
        await sessionManager.connect(gatewayUrl, token);
        
        console.log('✅ ChatStore: Connected successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
        console.error('❌ ChatStore: Connection failed:', errorMessage);
        
        set({ 
          isLoading: false, 
          isConnected: false,
          lastError: errorMessage 
        });
        
        // Don't throw here - let UI handle the error state
      }
    },

    async retryConnection() {
      const { connect } = get();
      if (lastGatewayUrl) {
        console.log('🔄 Retrying connection...');
        await connect(lastGatewayUrl, lastToken);
      }
    },

    clearError() {
      set({ lastError: null });
    },

    disconnect() {
      if (sessionManager) {
        sessionManager.disconnect();
        sessionManager = null;
      }
      set({
        sessionManager: null,
        isConnected: false,
        currentSessionKey: null,
        lastError: null,
      });
    },

    async selectSession(sessionKey: string) {
      try {
        if (!sessionManager) throw new Error('Not connected');
        await sessionManager.selectSession(sessionKey);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to select session';
        set({ lastError: errorMessage });
        throw error;
      }
    },

    async sendMessage(message: string) {
      try {
        if (!sessionManager) throw new Error('Not connected');
        await sessionManager.sendMessage(message);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        set({ lastError: errorMessage });
        throw error;
      }
    },

    async refreshSessions() {
      try {
        if (!sessionManager) throw new Error('Not connected');
        await sessionManager.refreshSessions();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh sessions';
        set({ lastError: errorMessage });
        throw error;
      }
    },
  };
});
