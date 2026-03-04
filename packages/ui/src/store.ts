// SubChat v2 - Zustand Store
import { create } from 'zustand';
import type { Session, Message, ConnectionState } from '../../shared/src/types';

interface AppStore {
  // State
  sessions: Session[];
  messages: Record<string, Message[]>;
  currentSessionId: string | null;
  connection: ConnectionState;
  
  // Actions
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (sessionId: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setConnection: (connection: ConnectionState) => void;
  
  // Computed
  getCurrentMessages: () => Message[];
  getCurrentSession: () => Session | null;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial State
  sessions: [],
  messages: {},
  currentSessionId: null,
  connection: {
    isConnected: false,
    isConnecting: false,
  },
  
  // Actions
  setSessions: (sessions) => set({ sessions }),
  
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  
  addMessage: (message) => set((state) => {
    const sessionMessages = state.messages[message.sessionId] || [];
    return {
      messages: {
        ...state.messages,
        [message.sessionId]: [...sessionMessages, message]
      }
    };
  }),
  
  updateMessage: (messageId, updates) => set((state) => {
    const newMessages = { ...state.messages };
    Object.keys(newMessages).forEach(sessionId => {
      newMessages[sessionId] = newMessages[sessionId].map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
    });
    return { messages: newMessages };
  }),
  
  setConnection: (connection) => set({ connection }),
  
  // Computed getters
  getCurrentMessages: () => {
    const state = get();
    return state.currentSessionId ? state.messages[state.currentSessionId] || [] : [];
  },
  
  getCurrentSession: () => {
    const state = get();
    return state.currentSessionId 
      ? state.sessions.find(s => s.id === state.currentSessionId) || null 
      : null;
  },
}));
