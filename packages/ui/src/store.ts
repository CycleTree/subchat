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
  parentSessionId?: string;
  hasMissingParent: boolean;
}

export interface InterventionEntry {
  id: string;
  sessionId: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
  transport?: 'sessions_send' | 'chat.send';
  error?: string;
}

// localStorage keys for persistence
const THEME_STORAGE_KEY = 'subchat_theme_mode';
const VIEW_MODE_STORAGE_KEY = 'subchat_view_mode';
const INTERVENTIONS_STORAGE_KEY = 'subchat_interventions';

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

const getInitialInterventions = (): Record<string, InterventionEntry[]> => {
  const stored = localStorage.getItem(INTERVENTIONS_STORAGE_KEY);
  if (!stored) {
    return {};
  }

  try {
    const parsed = JSON.parse(stored) as Record<string, Array<Omit<InterventionEntry, 'timestamp'> & { timestamp: string }>>;
    return Object.fromEntries(
      Object.entries(parsed).map(([sessionId, entries]) => [
        sessionId,
        entries.map((entry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }))
      ])
    );
  } catch (error) {
    console.error('Failed to restore intervention history:', error);
    localStorage.removeItem(INTERVENTIONS_STORAGE_KEY);
    return {};
  }
};

const persistInterventions = (interventions: Record<string, InterventionEntry[]>) => {
  localStorage.setItem(INTERVENTIONS_STORAGE_KEY, JSON.stringify(interventions));
};

// Build session tree from flat session list
function buildSessionTree(sessions: Session[]): SessionTreeNode[] {
  const sessionMap = new Map<string, Session>();
  const childrenMap = new Map<string, string[]>();
  const normalizedSessions: Session[] = sessions.map((session) => ({
    ...session,
    childSessionIds: [],
  }));

  for (const session of normalizedSessions) {
    sessionMap.set(session.id, session);
  }

  for (const session of normalizedSessions) {
    if (session.parentSessionId && sessionMap.has(session.parentSessionId)) {
      const children = childrenMap.get(session.parentSessionId) || [];
      children.push(session.id);
      childrenMap.set(session.parentSessionId, children);
    }
  }

  const sortByLastActivity = (leftId: string, rightId: string) =>
    (sessionMap.get(rightId)?.lastActivity.getTime() || 0) -
    (sessionMap.get(leftId)?.lastActivity.getTime() || 0);

  for (const [parentId, childIds] of childrenMap.entries()) {
    childIds.sort(sortByLastActivity);
    const session = sessionMap.get(parentId);
    if (session) {
      session.childSessionIds = childIds;
    }
  }

  for (const session of normalizedSessions) {
    if (!sessionMap.has(session.id)) {
      continue;
    }
    session.childSessionIds = childrenMap.get(session.id) || [];
  }

  function buildNode(
    session: Session,
    depth: number,
    lineage: Set<string>
  ): SessionTreeNode {
    if (lineage.has(session.id)) {
      return {
        session,
        children: [],
        depth,
        parentSessionId: session.parentSessionId,
        hasMissingParent: false,
      };
    }

    const nextLineage = new Set(lineage);
    nextLineage.add(session.id);
    const childIds = childrenMap.get(session.id) || [];
    const children = childIds
      .map(id => sessionMap.get(id)!)
      .filter(Boolean)
      .map(child => buildNode(child, depth + 1, nextLineage));

    return {
      session,
      children,
      depth,
      parentSessionId: session.parentSessionId,
      hasMissingParent: Boolean(
        session.parentSessionId && !sessionMap.has(session.parentSessionId)
      ),
    };
  }

  const roots = normalizedSessions
    .filter(
    s => !s.parentSessionId || !sessionMap.has(s.parentSessionId)
    )
    .sort((left, right) => right.lastActivity.getTime() - left.lastActivity.getTime());

  return roots.map(root => buildNode(root, 0, new Set()));
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
  interventions: getInitialInterventions(),
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

    let interventions: Record<string, InterventionEntry[]>;

    if (existingIndex >= 0) {
      const nextEntries = [...sessionEntries];
      nextEntries[existingIndex] = { ...nextEntries[existingIndex], ...entry };

      interventions = {
        ...state.interventions,
        [entry.sessionId]: nextEntries
      };
    } else {
      interventions = {
        ...state.interventions,
        [entry.sessionId]: [...sessionEntries, entry]
      };
    }

    persistInterventions(interventions);
    return { interventions };
  }),

  updateIntervention: (entryId, updates) => set((state) => {
    const nextInterventions = { ...state.interventions };

    Object.keys(nextInterventions).forEach((sessionId) => {
      nextInterventions[sessionId] = nextInterventions[sessionId].map((entry) =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      );
    });

    persistInterventions(nextInterventions);
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
