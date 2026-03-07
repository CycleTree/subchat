# 🚀 SubChat - Project Roadmap

## 🎯 Project Overview
SubChat is a modern web-based chat interface for OpenClaw agents with advanced conversation management features.

## 📊 Current Status (v2.0)
### ✅ Completed Features
- ✅ **Core Architecture**: Material-UI + Zustand + TypeScript
- ✅ **Session Management**: List, select, and switch between OpenClaw sessions
- ✅ **Message Display**: Real-time chat interface with role-based styling
- ✅ **Message Sending**: Bidirectional communication with OpenClaw Gateway
- ✅ **WebSocket Integration**: Full OpenClaw Gateway protocol support
- ✅ **Responsive UI**: Desktop and mobile-optimized interface
- ✅ **Optimistic UI**: Immediate feedback with pending/sent/failed states

### ⚠️ Known Issues
- ❌ **Gateway Authentication**: client.id validation needs fixing
- ⚠️ **Connection Stability**: Reconnection logic needs improvement

## 🎯 Upcoming Features (v2.1+)

### 🌟 High Priority
1. **🌳 Conversation Branching** - Git-like conversation branches
2. **🔍 Advanced Search** - Search across all messages and sessions  
3. **📱 PWA Support** - Installable web app with offline capabilities
4. **🎨 Themes & Customization** - Dark mode, custom colors, fonts

### 🎯 Medium Priority
1. **📂 Session Organization** - Folders, tags, favorites
2. **📤 Export/Import** - Conversation backup and sharing
3. **🔔 Notifications** - Desktop notifications for new messages
4. **⚡ Performance** - Virtual scrolling, lazy loading

### 💡 Future Ideas
1. **🤝 Collaboration** - Multi-user session sharing
2. **📊 Analytics** - Usage statistics and insights
3. **🔌 Plugin System** - Extensible architecture
4. **🎯 AI Features** - Smart suggestions, auto-completion

## 📋 GitHub Project Structure

### Epic Labels
- `epic:authentication` - Gateway authentication fixes
- `epic:branching` - Conversation branching feature
- `epic:search` - Search functionality
- `epic:mobile` - Mobile experience improvements
- `epic:performance` - Performance optimizations

### Priority Labels
- `priority:critical` - Production blocking issues
- `priority:high` - Important features
- `priority:medium` - Nice to have
- `priority:low` - Future considerations

### Component Labels
- `component:ui` - User interface components
- `component:gateway` - OpenClaw Gateway integration
- `component:state` - State management (Zustand)
- `component:websocket` - WebSocket communication
- `component:auth` - Authentication system

## 🚀 Release Schedule
- **v2.0.1** (Hotfix) - Authentication fixes
- **v2.1.0** - Conversation branching
- **v2.2.0** - Advanced search
- **v2.3.0** - PWA support
- **v3.0.0** - Major redesign with collaboration features
