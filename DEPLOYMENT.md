# SubChat v2 Deployment Guide

## 🌐 GitHub Pages (Frontend)

### Setup
1. **Enable GitHub Pages** in repository settings
   - Go to `Settings` → `Pages`
   - Source: `GitHub Actions`

2. **Environment Variables** (Repository Secrets)
   - `VITE_OPENCLAW_TOKEN`: Your OpenClaw authentication token
   - `VITE_OPENCLAW_GATEWAY_URL`: Fly.io gateway URL

### Deploy
```bash
# Automatic deployment via GitHub Actions
git push origin main

# Manual deployment
npm run deploy:pages
```

**Result**: `https://cycletree.github.io/subchat/`

## ☁️ Fly.io (OpenClaw Gateway)

### Setup
1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login & App Creation**
   ```bash
   fly auth login
   fly apps create openclaw-gateway --region nrt
   ```

3. **Set Secrets**
   ```bash
   fly secrets set OPENCLAW_TOKEN="your-secure-token-here"
   fly secrets set NODE_ENV="production"
   ```

4. **Create Volume** (for persistent data)
   ```bash
   fly volumes create openclaw_data --region nrt --size 1
   ```

### Deploy
```bash
# Deploy to Fly.io
fly deploy

# Check status
fly status
fly logs
```

**Result**: `https://openclaw-gateway.fly.dev/gateway`

## 🔗 Environment Configuration

### Development (localhost:3000)
- Gateway: `ws://localhost:18792/gateway`
- Token: Local OpenClaw token

### Production (GitHub Pages)
- Gateway: `wss://openclaw-gateway.fly.dev/gateway`
- Token: `VITE_OPENCLAW_TOKEN` environment variable

## 📊 Testing

### Local Testing
```bash
npm run dev  # http://localhost:3000
```

### Production Testing
```bash
# After deployment
curl -I https://cycletree.github.io/subchat/
curl -I https://openclaw-gateway.fly.dev/health
```

## 🛠️ Troubleshooting

### GitHub Pages Issues
- Check Actions tab for build errors
- Verify `base: '/subchat/'` in vite.config.ts
- Ensure CNAME or custom domain settings

### Fly.io Issues
- Check logs: `fly logs`
- Scale up if needed: `fly scale count 2`
- Restart: `fly apps restart openclaw-gateway`

### CORS Issues
- Verify origins in `openclaw.fly.json`
- Check browser console for CORS errors
- Update allowed origins for new domains

## 🔄 Update Workflow

1. **Code Changes** → Push to `main` branch
2. **GitHub Actions** → Builds and deploys to Pages
3. **Fly.io** → Manual deploy or auto-deploy via CI/CD
4. **Testing** → Verify both frontend and backend
