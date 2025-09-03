# Railway Deployment Guide

## 🚀 Quick Deploy to Railway

This React frontend is configured to work with your Railway backend at:
**https://ai-competition-2025-production.up.railway.app/api**

## Method 1: Deploy via Railway Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Configure for Railway deployment"
   git push origin main
   ```

2. **Deploy on Railway:**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the configuration and deploy

## Method 2: Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
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
- **Node Version:** 18.x Alpine
- **Build Command:** `npm run build`
- **Start Command:** `npm start` (serves build folder)
- **Port:** 3000 (Railway auto-assigns external port)

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