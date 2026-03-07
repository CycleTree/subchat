# SubChat Production Environment Testing Guide

## 🌐 Live Environment

- **Frontend**: https://cycletree.github.io/subchat/
- **Backend**: wss://subchat-openclaw-gateway.fly.dev/gateway  
- **Status**: ✅ OPERATIONAL

## 🧪 Testing Steps

### 1. Basic Connection Test
```
1. Visit: https://cycletree.github.io/subchat/
2. Check connection status in UI
3. Should automatically connect to Fly.io Gateway
```

### 2. Advanced Testing (Browser Console)
```javascript
// Open F12 Developer Tools → Console, then run:

testGateway()                    // Complete WebSocket test
fixGatewayAuth()                // Reset authentication if needed
showCurrentToken()              // Display current token
```

### 3. API Key Configuration
```
1. Click Settings (gear icon)
2. Enter API keys for:
   - Anthropic Claude
   - OpenAI 
   - Google Gemini
3. Keys are saved to Fly.io OpenClaw config
```

### 4. Session Management
```
1. View existing OpenClaw sessions
2. Select session to view message history
3. Send test messages to agents
```

## 🔧 Troubleshooting

### Connection Issues
- **Token Mismatch**: Run `fixGatewayAuth()` in browser console
- **Gateway Down**: Check https://subchat-openclaw-gateway.fly.dev/
- **Network Block**: Try different network/VPN

### API Configuration
- **Fly.io Config**: Keys stored in ~/.openclaw/openclaw.json on Fly.io
- **Local vs Production**: Different token requirements
- **Testing**: Use provided Claude OAuth token for testing

## 📊 Production vs Development

| Feature | Development | Production |
|---------|-------------|------------|
| Frontend | localhost:3000 | GitHub Pages |
| Backend | localhost:18792 | Fly.io Gateway |
| Token | 3a46fc7cb6... | subchat-gateway-token-2026 |
| Config | Local file | Fly.io volume |
| Testing | Real-time dev | Browser console |

## 🎯 Expected Results

- ✅ Instant WebSocket connection
- ✅ Session list populated
- ✅ Message history loads
- ✅ API key configuration works
- ✅ No DOM nesting warnings
- ✅ Auto-retry on connection failure
- ✅ Browser testing utilities available

## 🚀 Performance Optimizations

- **Frontend**: 417KB optimized build (React + MUI + Zustand)
- **Backend**: Fly.io 2GB memory for stable OpenClaw operation
- **WebSocket**: Persistent connection with auto-reconnect
- **Caching**: Browser caching for static assets

---

**Ready for production use!** 🎉
