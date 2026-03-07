# 📋 SubChat - GitHub Issues to Create

Copy and paste these into GitHub Issues at https://github.com/CycleTree/subchat/issues

---

## Issue #1: 🔧 Fix OpenClaw Gateway Authentication

**Title**: `[BUG] Gateway authentication failing - client.id validation error`

**Labels**: `bug`, `priority:critical`, `component:auth`, `epic:authentication`

**Description**:
### 🐛 Problem
SubChat v2 cannot authenticate with OpenClaw Gateway due to client.id validation errors.

### 🔍 Error Details
```
❌ Auth failed: invalid connect params: 
   at /client/id: must be equal to constant
   at /client/id: must match a schema in anyOf
```

### 🔧 Current Implementation
```typescript
client: { 
  id: 'client', 
  version: '1.0.0', 
  platform: 'browser',
  mode: 'ui' 
}
```

### 🎯 Tasks
- [ ] Research valid client.id values from OpenClaw documentation
- [ ] Test different client.id patterns (openclaw-webui, client, browser, etc.)
- [ ] Implement proper authentication parameter validation
- [ ] Add fallback authentication methods
- [ ] Test with current OpenClaw Gateway instance

### ✅ Acceptance Criteria
- [ ] SubChat successfully authenticates with Gateway
- [ ] Session list loads without errors
- [ ] Message sending/receiving works end-to-end
- [ ] Connection state properly reflects authentication status

---

## Issue #2: 🌳 Implement Conversation Branching

**Title**: `[FEATURE] Git-like conversation branching system`

**Labels**: `enhancement`, `priority:high`, `component:ui`, `epic:branching`

### ✨ Feature Description
Implement a Git-like conversation branching system allowing users to:
- Create branches from any message point
- Switch between different conversation paths
- Compare different conversation branches
- Merge valuable insights across branches

### 🎯 Use Cases
- **Experimentation**: Try different approaches without losing main conversation
- **What-if Scenarios**: Explore alternative solutions
- **Recovery**: Restore from failed conversation paths
- **Comparison**: Compare AI responses to different prompts

### 🎨 UI Design Options
1. **TreeView Sidebar**: Hierarchical branch navigation
2. **Tab Interface**: Horizontal branch switching
3. **Graph View**: Visual conversation flow diagram

### 🔧 Technical Implementation

#### Data Structure
```typescript
interface ConversationBranch {
  id: string;
  name: string;
  parentMessageId: string;
  messages: Message[];
  children: ConversationBranch[];
  metadata: {
    createdAt: Date;
    createdBy: 'user' | 'assistant';
    description?: string;
    color?: string;
  };
}
```

#### Zustand Store Extension
```typescript
interface BranchStore {
  branches: Map<string, ConversationBranch>;
  currentBranchId: string;
  createBranch: (fromMessageId: string, name: string) => void;
  switchBranch: (branchId: string) => void;
  deleteBranch: (branchId: string) => void;
}
```

#### Material-UI Components
- `TreeView` for branch hierarchy
- `Tabs` for branch switching
- `Menu` for branch operations
- `Dialog` for branch creation

### 📋 Development Phases

#### Phase 1: Basic Branching
- [ ] Implement core data structures
- [ ] Add branch creation from message hover
- [ ] Basic branch switching UI
- [ ] Local storage persistence

#### Phase 2: Advanced UI
- [ ] TreeView branch navigation
- [ ] Branch comparison mode (side-by-side)
- [ ] Branch metadata editing
- [ ] Color coding and icons

#### Phase 3: Advanced Features
- [ ] Branch merging
- [ ] Branch search and filtering
- [ ] Export/import branches
- [ ] Real-time branch collaboration

### ✅ Acceptance Criteria
- [ ] Users can create branches from any message
- [ ] Branch switching preserves context and UI state
- [ ] Branch tree displays correctly with visual hierarchy
- [ ] Branch operations (create/delete/rename) work reliably
- [ ] Performance remains smooth with 10+ branches
- [ ] Mobile-friendly branch navigation

---

## Issue #3: 🔍 Advanced Search & Filtering

**Title**: `[FEATURE] Advanced search across all sessions and messages`

**Labels**: `enhancement`, `priority:medium`, `component:ui`, `epic:search`

### ✨ Feature Description
Implement powerful search functionality to find information across all SubChat sessions.

### 🔍 Search Features
- **Full-text search** across all messages
- **Session filtering** by agent, date, activity
- **Advanced filters** by role, date range, session type
- **Search highlights** in results
- **Search history** and saved searches

### 🎨 UI Components
- Global search bar in header
- Advanced search modal with filters
- Search results with context preview
- Search suggestions and autocomplete

### 🔧 Implementation
- Client-side search with Fuse.js
- Search indexing for performance
- Real-time search as you type
- Search result ranking and relevance

### ✅ Acceptance Criteria
- [ ] Search across all loaded sessions
- [ ] Sub-500ms search response time
- [ ] Highlighted search results
- [ ] Advanced filtering options
- [ ] Mobile-optimized search interface

---

## Issue #4: 📱 PWA Support & Mobile Experience

**Title**: `[FEATURE] Progressive Web App with offline capabilities`

**Labels**: `enhancement`, `priority:medium`, `component:ui`, `epic:mobile`

### ✨ Feature Description
Transform SubChat into a PWA for native app-like experience.

### 🎯 PWA Features
- **Installable** on desktop and mobile
- **Offline support** for viewing cached conversations
- **Push notifications** for new messages
- **App-like navigation** and gestures

### 📱 Mobile Optimizations
- Touch-friendly interface
- Responsive design improvements
- Mobile-specific gestures
- Optimized loading performance

### 🔧 Technical Implementation
- Service worker for offline caching
- Web App Manifest
- IndexedDB for local storage
- Push notification API integration

### ✅ Acceptance Criteria
- [ ] App installs on mobile devices
- [ ] Works offline for cached content
- [ ] Native app-like experience
- [ ] Push notifications (when supported)

---

## Issue #5: 🎨 Themes & Customization

**Title**: `[FEATURE] Theme system and UI customization`

**Labels**: `enhancement`, `priority:medium`, `component:ui`

### ✨ Feature Description
Implement comprehensive theming and customization system.

### 🎨 Theme Features
- **Dark/Light modes** with system preference detection
- **Custom color schemes** with palette editor
- **Typography options** (font family, size)
- **Layout customization** (sidebar width, message density)

### 🔧 Implementation
- Material-UI theme system extension
- CSS custom properties for dynamic theming
- User preference persistence
- Real-time theme switching

### ✅ Acceptance Criteria
- [ ] Dark/light mode toggle
- [ ] Custom color selection
- [ ] Font size/family options
- [ ] Layout density settings
- [ ] Theme persistence across sessions

