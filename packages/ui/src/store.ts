// SubChat v2 - Zustand Store
import { create } from 'zustand';
import type { Session, Message, ConnectionState, QueuedMessage } from '../../shared/src/types';

// Theme mode type
export type ThemeMode = 'light' | 'dark';

// View mode type
export type ViewMode = 'flat' | 'tree';

// Tree node for hierarchical session display
export interface SessionTreeNode {
  session: Session;
  children: SessionTreeNode[];
  depth: number;
}

export interface InterventionEntry {
  id: string;
  sessionId: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
}

// localStorage keys for persistence
const THEME_STORAGE_KEY = 'subchat_theme_mode';
const VIEW_MODE_STORAGE_KEY = 'subchat_view_mode';

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

const getInitialViewMode = (): ViewMode => {
  const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (stored === 'flat' || stored === 'tree') {
    return stored;
  }
  return 'flat';
};

// Build session tree from flat session list
function buildSessionTree(sessions: Session[]): SessionTreeNode[] {
  const sessionMap = new Map<string, Session>();
  const childrenMap = new Map<string, string[]>();

  // Index sessions and compute childSessionIds
  for (const session of sessions) {
    sessionMap.set(session.id, session);
  }
  for (const session of sessions) {
    if (session.parentSessionId && sessionMap.has(session.parentSessionId)) {
      const children = childrenMap.get(session.parentSessionId) || [];
      children.push(session.id);
      childrenMap.set(session.parentSessionId, children);
    }
  }

  // Populate childSessionIds on each session
  for (const session of sessions) {
    session.childSessionIds = childrenMap.get(session.id) || [];
  }

  // Recursively build tree nodes
  function buildNode(session: Session, depth: number): SessionTreeNode {
    const childIds = childrenMap.get(session.id) || [];
    const children = childIds
      .map(id => sessionMap.get(id)!)
      .filter(Boolean)
      .map(child => buildNode(child, depth + 1));
    return { session, children, depth };
  }

  // Root nodes: sessions with no parent or whose parent doesn't exist
  const roots = sessions.filter(
    s => !s.parentSessionId || !sessionMap.has(s.parentSessionId)
  );

  return roots.map(root => buildNode(root, 0));
}

interface AppStore {
  // State
  sessions: Session[];
  messages: Record<string, Message[]>;
  currentSessionId: string | null;
  connection: ConnectionState;
  drafts: Record<string, string>;
  queuedMessages: QueuedMessage[];
  interventions: Record<string, InterventionEntry[]>;
  themeMode: ThemeMode;
  viewMode: ViewMode;

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

  // View mode actions
  toggleViewMode: () => void;

  // Tree computed
  getSessionTree: () => SessionTreeNode[];
  
  // Draft actions
  saveDraft: (sessionId: string, content: string) => void;
  clearDraft: (sessionId: string) => void;
  getDraft: (sessionId: string) => string;
  
  // Queue actions
  queueMessage: (content: string, sessionId: string) => void;
  removeQueuedMessage: (messageId: string) => void;
  getQueuedCount: () => number;
  getSessionQueuedCount: (sessionId: string) => number;

  // Intervention actions
  addIntervention: (entry: InterventionEntry) => void;
  updateIntervention: (entryId: string, updates: Partial<InterventionEntry>) => void;
  getSessionInterventions: (sessionId: string) => InterventionEntry[];
  
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
  interventions: {},
  themeMode: getInitialTheme(),
  viewMode: getInitialViewMode(),
  
  // Actions
  setSessions: (sessions) => set({ sessions }),
  
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  
  clearCurrentSession: () => set({ currentSessionId: null }),
  
  addMessage: (message) => set((state) => {
    const sessionMessages = state.messages[message.sessionId] || [];
    const existingIndex = sessionMessages.findIndex((entry) => entry.id === message.id);

    if (existingIndex >= 0) {
      const nextMessages = [...sessionMessages];
      nextMessages[existingIndex] = { ...nextMessages[existingIndex], ...message };

      return {
        messages: {
          ...state.messages,
          [message.sessionId]: nextMessages
        }
      };
    }

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

  // View mode actions
  toggleViewMode: () => {
    const state = get();
    const newMode = state.viewMode === 'flat' ? 'tree' : 'flat';
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, newMode);
    set({ viewMode: newMode });
  },

  // Tree computed
  getSessionTree: () => {
    const state = get();
    return buildSessionTree(state.sessions);
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

  addIntervention: (entry) => set((state) => {
    const sessionEntries = state.interventions[entry.sessionId] || [];
    const existingIndex = sessionEntries.findIndex((item) => item.id === entry.id);

    if (existingIndex >= 0) {
      const nextEntries = [...sessionEntries];
      nextEntries[existingIndex] = { ...nextEntries[existingIndex], ...entry };

      return {
        interventions: {
          ...state.interventions,
          [entry.sessionId]: nextEntries
        }
      };
    }

    return {
      interventions: {
        ...state.interventions,
        [entry.sessionId]: [...sessionEntries, entry]
      }
    };
  }),

  updateIntervention: (entryId, updates) => set((state) => {
    const nextInterventions = { ...state.interventions };

    Object.keys(nextInterventions).forEach((sessionId) => {
      nextInterventions[sessionId] = nextInterventions[sessionId].map((entry) =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      );
    });

    return { interventions: nextInterventions };
  }),

  getSessionInterventions: (sessionId) => {
    const state = get();
    return state.interventions[sessionId] || [];
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
