# Railway Deployment Guide

## 🚀 Quick Deploy to Railway

This React frontend connects to: **https://ai-competition-2025-production.up.railway.app/api**

### Deploy via Railway Dashboard
1. Push to GitHub: `git push origin main`
2. Go to [Railway Dashboard](https://railway.app/dashboard)
3. New Project → Deploy from GitHub repo
4. Select your repository

### Deploy via Railway CLI
```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

## 📋 Configuration Details

### Environment Variables
- **Production:** Uses `https://ai-competition-2025-production.up.railway.app/api`
- **Override:** Set `REACT_APP_API_URL` in Railway dashboard if needed
- **Local Dev:** Create `.env.local` with `REACT_APP_API_URL=http://localhost:3001/api`

### Build Configuration
- **Builder:** Dockerfile (more reliable than Nixpacks)
- **Node Version:** 20.x Alpine (LTS)
- **NPM Version:** 10.x (compatible with Node 20)
- **Build Command:** `npm run build`
- **Start Command:** `node server.js` (custom Express server)
- **Port:** Railway auto-assigns via $PORT variable

### API Endpoints Connected
- `GET /api/files` - Load existing files
- `POST /api/files/upload` - Upload new files
- `GET /api/files/:id` - Get file details

## ✅ Pre-deployment Checklist

- [x] API URLs configured for Railway backend
- [x] Environment variables support added
- [x] Build scripts optimized for production
- [x] Railway configuration files created
- [x] .gitignore updated for security

## 🔧 Troubleshooting

**CORS Issues:**
- Ensure your Railway backend allows requests from your frontend domain
- Add your Railway frontend URL to backend CORS origins

**502 Bad Gateway Error:**
- Check Railway logs: `railway logs`
- Verify the app is binding to Railway's $PORT variable
- App now uses custom Express server: `node server.js`

**Build Failures:**
```bash
# Local test build
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

**API Connection Issues:**
- Verify backend is running: https://ai-competition-2025-production.up.railway.app/api/files
- Check Railway logs: `railway logs`
- Verify environment variables in Railway dashboard

**Port Binding Issues:**
- Railway assigns a dynamic $PORT environment variable
- The app must listen on this port, not a hardcoded port
- Current configuration: Custom Express server that reads process.env.PORT

## 📊 Backend Status

Your backend API is confirmed working and returns:
```json
{"success":true,"data":[]}
```

## 🎯 Next Steps After Deployment

1. **Update CORS:** Add your Railway frontend URL to backend CORS settings
2. **Domain Setup:** Configure custom domain in Railway dashboard (optional)
3. **Monitoring:** Set up Railway alerts for deployment issues

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://railway.app/discord
- **Check Logs:** `railway logs` or Railway dashboard