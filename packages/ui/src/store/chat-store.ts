import { create } from 'zustand';
import { GatewayClient, SessionManager } from '@subchat/core';
import type { ChatState } from '@subchat/shared';

interface ChatStore extends ChatState {
  sessionManager: SessionManager | null;
  connect: (gatewayUrl: string, token?: string) => Promise<void>;
  disconnect: () => void;
  selectSession: (sessionKey: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

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

    async connect(gatewayUrl: string, token?: string) {
      try {
        const client = new GatewayClient(gatewayUrl);
        sessionManager = new SessionManager(client);

        // Subscribe to state changes
        sessionManager.subscribe((state) => {
          set(state);
        });

        set({ sessionManager });
        await sessionManager.connect(gatewayUrl, token);
      } catch (error) {
        console.error('Failed to connect:', error);
        throw error;
      }
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
      });
    },

    async selectSession(sessionKey: string) {
      if (!sessionManager) throw new Error('Not connected');
      await sessionManager.selectSession(sessionKey);
    },

    async sendMessage(message: string) {
      if (!sessionManager) throw new Error('Not connected');
      await sessionManager.sendMessage(message);
    },

    async refreshSessions() {
      if (!sessionManager) throw new Error('Not connected');
      await sessionManager.refreshSessions();
    },
  };
});