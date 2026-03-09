// SubChat v2 - Zustand Store
import { create } from 'zustand';
import type { Session, Message, ConnectionState, QueuedMessage } from '../../shared/src/types';

// Theme mode type
export type ThemeMode = 'light' | 'dark';

// localStorage key for theme persistence
const THEME_STORAGE_KEY = 'subchat_theme_mode';

// Get initial theme from localStorage or system preference
const getInitialTheme = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  // Default to system preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

interface AppStore {
  // State
  sessions: Session[];
  messages: Record<string, Message[]>;
  currentSessionId: string | null;
  connection: ConnectionState;
  drafts: Record<string, string>;
  queuedMessages: QueuedMessage[];
  themeMode: ThemeMode;
  
  // Actions
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setConnection: (connection: ConnectionState) => void;
  
  // Theme actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Draft actions
  saveDraft: (sessionId: string, content: string) => void;
  clearDraft: (sessionId: string) => void;
  getDraft: (sessionId: string) => string;
  
  // Queue actions
  queueMessage: (content: string, sessionId: string) => void;
  removeQueuedMessage: (messageId: string) => void;
  getQueuedCount: () => number;
  getSessionQueuedCount: (sessionId: string) => number;
  
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
  drafts: {},
  queuedMessages: [],
  themeMode: getInitialTheme(),
  
  // Actions
  setSessions: (sessions) => set({ sessions }),
  
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  
  clearCurrentSession: () => set({ currentSessionId: null }),
  
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
  
  // Theme actions
  setThemeMode: (mode) => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    set({ themeMode: mode });
  },
  
  toggleTheme: () => {
    const state = get();
    const newMode = state.themeMode === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
    set({ themeMode: newMode });
  },
  
  // Draft actions
  saveDraft: (sessionId, content) => set((state) => ({
    drafts: { ...state.drafts, [sessionId]: content }
  })),
  
  clearDraft: (sessionId) => set((state) => {
    const newDrafts = { ...state.drafts };
    delete newDrafts[sessionId];
    return { drafts: newDrafts };
  }),
  
  getDraft: (sessionId) => {
    const state = get();
    return state.drafts[sessionId] || '';
  },
  
  // Queue actions
  queueMessage: (content, sessionId) => set((state) => {
    const queuedMessage: QueuedMessage = {
      id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'queued',
      retryCount: 0,
      queuedAt: new Date(),
    };
    
    return {
      queuedMessages: [...state.queuedMessages, queuedMessage]
    };
  }),
  
  removeQueuedMessage: (messageId) => set((state) => ({
    queuedMessages: state.queuedMessages.filter(msg => msg.id !== messageId)
  })),
  
  getQueuedCount: () => {
    const state = get();
    return state.queuedMessages.length;
  },
  
  getSessionQueuedCount: (sessionId) => {
    const state = get();
    return state.queuedMessages.filter(msg => msg.sessionId === sessionId).length;
  },
  
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
