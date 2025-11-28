# 🚀 Quick Deploy Guide

## Fastest Option: Railway (You're Already Using It!)

1. **In Railway Dashboard:**
   - Open your existing project
   - Click **"New Service"** → **"GitHub Repo"**
   - Select your repository

2. **Configure:**
   - **Start Command:** `npm run serve`
   - **Environment Variable:** Add `CLIENT_ID` (your bot's client ID)

3. **Get URL:**
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - Your SPA is live! 🎮

---

## Alternative: Vercel (2 Minutes)

1. **Install & Deploy:**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set Environment Variable:**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add: `CLIENT_ID` = your bot's client ID

3. **Done!** Your SPA is live at `https://your-project.vercel.app`

---

## Test Locally First

```bash
# Make sure CLIENT_ID is in .env
npm run serve

# Visit http://localhost:3000
```

---

## What You Need

- ✅ `CLIENT_ID` from Discord Developer Portal
- ✅ That's it! The SPA is ready to deploy.

---

For detailed instructions, see `DEPLOY_SPA.md`

