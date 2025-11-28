# Deploying the Soundalite Invite SPA

This guide will help you deploy the retro gaming-styled invite page for your Discord bot.

## Option 1: Railway (Recommended - Same Platform)

Since you're already using Railway for your bot, you can deploy the SPA as a separate service.

### Steps:

1. **In Railway Dashboard:**
   - Go to your project
   - Click "New Service" → "GitHub Repo"
   - Select the same repository
   - Railway will detect it's a Node.js project

2. **Configure the Service:**
   - Go to Settings → Deploy
   - Set the **Start Command** to: `npm run serve`
   - Or use the `railway-spa.json` config file

3. **Set Environment Variables:**
   - Go to Variables tab
   - Add: `CLIENT_ID` (your Discord bot client ID)
   - Add: `PORT` (Railway will set this automatically, but you can override)

4. **Generate Public URL:**
   - Go to Settings → Networking
   - Click "Generate Domain" to get a public URL
   - Your SPA will be available at: `https://your-service-name.up.railway.app`

5. **Deploy:**
   - Railway will automatically build and deploy
   - Check the logs to ensure it started successfully

---

## Option 2: Vercel (Free & Easy)

Vercel is great for static sites and SPAs.

### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json` in the root:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server.js"
       },
       {
         "src": "/(.*)",
         "dest": "public/$1"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables:**
   - Go to your project on Vercel dashboard
   - Settings → Environment Variables
   - Add: `CLIENT_ID`

5. **Get Your URL:**
   - Vercel will provide a URL like: `https://your-project.vercel.app`

---

## Option 3: Render (Free Tier Available)

Render offers free hosting with automatic deployments.

### Steps:

1. **Go to Render Dashboard:**
   - Sign up at https://render.com
   - Click "New" → "Web Service"

2. **Connect Repository:**
   - Connect your GitHub repository
   - Render will auto-detect Node.js

3. **Configure:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm run serve`
   - **Environment:** Node

4. **Set Environment Variables:**
   - Add: `CLIENT_ID` (your Discord bot client ID)

5. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your URL: `https://your-service.onrender.com`

---

## Option 4: Netlify (For Static + Serverless Functions)

If you want to use Netlify, you'll need to convert the API to serverless functions.

### Steps:

1. **Create `netlify.toml`:**
   ```toml
   [build]
     publish = "public"
     functions = "netlify/functions"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

2. **Create `netlify/functions/config.js`:**
   ```javascript
   exports.handler = async (event, context) => {
     // Serverless function code
     // (You'll need to adapt server.js API endpoint)
   };
   ```

3. **Deploy:**
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod
   ```

---

## Quick Start (Railway - Easiest)

Since you're already on Railway:

1. **Add a new service** in your Railway project
2. **Set Start Command:** `npm run serve`
3. **Add Environment Variable:** `CLIENT_ID`
4. **Generate domain** in Settings → Networking
5. **Done!** 🎮

---

## Testing Locally Before Deploying

```bash
# Make sure CLIENT_ID is in your .env file
npm run serve

# Visit http://localhost:3000
```

---

## Environment Variables Required

- `CLIENT_ID` - Your Discord bot's client ID (required)
- `PORT` - Server port (optional, defaults to 3000)

---

## Troubleshooting

### SPA not loading?
- Check that `CLIENT_ID` is set correctly
- Verify the server is running (check logs)
- Ensure `public/` folder exists with all files

### API endpoint not working?
- Check that `CLIENT_ID` environment variable is set
- Verify the server logs for errors
- Test `/api/config` endpoint directly

### Build fails?
- Ensure `express` is in `package.json` dependencies
- Check Node.js version compatibility
- Review build logs for specific errors

---

## Custom Domain (Optional)

All platforms support custom domains:
- **Railway:** Settings → Networking → Custom Domain
- **Vercel:** Settings → Domains
- **Render:** Settings → Custom Domains

---

## Updating

Just push to your repository - most platforms auto-deploy on git push!

