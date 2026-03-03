# SubChat Testing Guide

## Manual Browser Testing

### Prerequisites
- subchat development server running on `http://localhost:3000`
- OpenClaw Gateway running on `localhost:18792`

### Test Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   ✅ Should show: `Local: http://localhost:3000/`

2. **Open Browser**
   - Navigate to: `http://localhost:3000`
   - Open Developer Tools (F12)

3. **Check UI Elements**
   - ✅ Title shows "subchat"
   - ✅ Connection status indicator (colored dot)
   - ✅ Sessions panel (left side)
   - ✅ Chat view (right side)

4. **Check Console Logs**
   Look for these messages:
   - `Connecting to: ws://localhost:18792/gateway?token=...`
   - `📨 Received: {"type":"event","event":"connect.challenge",...}`
   - Connection status changes

### Expected Behavior

**✅ Working:**
- UI loads without errors
- WebSocket connection attempts
- Auth challenge received

**⚠️  Known Issues:**
- OpenClaw Gateway authentication in progress
- Sessions list may be empty until auth resolves

### Debug Information

**WebSocket URL:** `ws://localhost:18792/gateway`
**Auth Token:** `3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f`

### Fallback Testing (NixOS)

If Playwright fails due to NixOS compatibility:
1. Use manual browser testing above
2. Check network tab for WebSocket connections  
3. Verify server logs for connection attempts

## Next Steps

1. Resolve OpenClaw Gateway authentication
2. Test session listing and chat functionality
3. Add comprehensive error handling
