# SubChat v2 🚀

**OpenClaw SubAgent Conversation Visibility Tool**

![SubChat v2 Screenshot](https://via.placeholder.com/800x400/1976d2/ffffff?text=SubChat+v2)

## ✨ What is SubChat?

SubChat solves the **"black box" problem** of OpenClaw subagent interactions. While OpenClaw enables powerful agent hierarchies, the conversations between parent agents and their spawned subagents are invisible in the standard WebUI.

**SubChat makes the invisible visible** - providing real-time observation of:
- 🤖 Subagent spawning and task delegation  
- 💬 Parent ↔ Child agent conversations
- 🌳 Agent hierarchy visualization
- 📊 Message flows and task completion

## 🌐 Live Demo

- **Production**: [`https://cycletree.github.io/subchat/`](https://cycletree.github.io/subchat/)
- **Development**: `http://localhost:3000` (when running locally)

## 🏗️ Architecture

### Frontend (GitHub Pages)
- **React** + **TypeScript** + **Material-UI**
- **Zustand** state management
- **Vite** build system
- Real-time WebSocket connectivity

### Backend (Fly.io)
- **OpenClaw Gateway** on cloud infrastructure
- WebSocket authentication & session management
- Multi-tenant agent session handling

## 🚀 Quick Start

### Local Development
```bash
# Clone & install
git clone https://github.com/CycleTree/subchat
cd subchat
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Access
Visit [`https://cycletree.github.io/subchat/`](https://cycletree.github.io/subchat/) - connects automatically to OpenClaw on Fly.io.

## 🔧 Features

### ✅ Current (v2.0)
- [x] **OpenClaw Gateway Integration** - Full WebSocket authentication
- [x] **Session Management** - View all active agent sessions
- [x] **Real-time Messages** - Live conversation streaming  
- [x] **Agent Identification** - See which agent is handling each session
- [x] **Production Deployment** - GitHub Pages + Fly.io infrastructure

### 🔮 Planned (v2.1+)
- [ ] **Agent Hierarchy Visualization** - Parent/child relationship trees
- [ ] **Conversation Branching** - Git-like conversation branches
- [ ] **Advanced Search** - Filter by agent, time, keywords
- [ ] **Export/Import** - Save important conversation threads

## 🛠️ Development

### Project Structure
```
subchat/
├── packages/
│   ├── shared/          # TypeScript types & utilities
│   ├── ui/             # React frontend application  
│   └── core/           # Core business logic
├── .github/workflows/  # GitHub Actions CI/CD
└── fly.toml           # Fly.io deployment config
```

### Technology Stack
- **Language**: TypeScript
- **Frontend**: React 18 + Material-UI v5
- **State**: Zustand (lightweight Redux alternative)  
- **Build**: Vite (fast, modern bundler)
- **Deploy**: GitHub Actions → GitHub Pages
- **Backend**: OpenClaw Gateway on Fly.io

## 📦 Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy
```bash
# Deploy frontend to GitHub Pages
npm run deploy:pages

# Deploy OpenClaw to Fly.io  
fly deploy
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Workflow
- Use **conventional commits** (`feat:`, `fix:`, `docs:`, etc.)
- **Test** locally before pushing
- Update **documentation** for new features
- Follow **TypeScript best practices**

## 📊 Analytics & Monitoring

- **GitHub Actions**: Build/deploy status
- **Fly.io Metrics**: Backend performance monitoring  
- **Browser DevTools**: Frontend performance analysis

## 🐛 Troubleshooting

### Connection Issues
- Verify OpenClaw Gateway is running on Fly.io
- Check CORS settings for cross-origin requests
- Ensure authentication tokens are valid

### Build Issues  
- Clear npm cache: `npm clean-install`
- Check Node.js version compatibility (18+)
- Verify all dependencies are installed

See [`DEPLOYMENT.md#troubleshooting`](./DEPLOYMENT.md#troubleshooting) for detailed solutions.

## 📝 License

MIT License - see [`LICENSE`](./LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenClaw Team** - For the amazing agent framework
- **Material-UI** - For the beautiful component library
- **Fly.io** - For reliable cloud infrastructure
- **GitHub** - For free static hosting via Pages

---

**Built with ❤️ by the CycleTree Team**

*Making AI agent interactions transparent and understandable.*
