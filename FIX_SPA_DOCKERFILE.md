# Fix: SPA Still Running Bot Instead of Server

The error shows Railway is still running `index.js` (the bot) instead of `server.js` (the SPA).

## The Problem

Railway is using **Nixpacks** (reading from `railway.json`) instead of your **Dockerfile**.

## Solution: Configure Railway to Use Dockerfile

### Step 1: In Railway Dashboard

1. Go to your **SPA Service**
2. Click **Settings** tab
3. Scroll to **Build** section
4. Look for:
   - **"Build Method"** or **"Builder"** dropdown
   - OR **"Dockerfile Path"** field
   - OR **"Use Dockerfile"** toggle

### Step 2: Switch to Dockerfile

**Option A: If you see "Build Method" dropdown:**
- Change from "Nixpacks" to "Dockerfile"
- Set Dockerfile path to: `Dockerfile.spa`

**Option B: If you see "Dockerfile Path" field:**
- Enter: `Dockerfile.spa`
- Save

**Option C: If you see a toggle:**
- Enable "Use Dockerfile"
- Set path to: `Dockerfile.spa`

### Step 3: Verify

After saving, Railway will:
1. Stop the current deployment
2. Rebuild using the Dockerfile
3. Start with `node server.js` instead of `npm start`

---

## Alternative: If Dockerfile Option Not Available

If you can't find Dockerfile options in Railway:

### Option 1: Rename Dockerfile.spa to Dockerfile

1. Rename `Dockerfile.spa` to `Dockerfile` in your repo
2. Commit and push
3. Railway should auto-detect it

**BUT:** This will affect both services if they're in the same repo!

### Option 2: Use Environment Variable Wrapper

Create a smart entry point:

1. Create `start-spa.js`:
```javascript
// Only start the SPA server, never the bot
require('./server.js');
```

2. Update `railway.json` temporarily:
```json
{
  "deploy": {
    "startCommand": "node start-spa.js"
  }
}
```

3. But this affects both services... so not ideal.

---

## Recommended: Use Dockerfile

**The Dockerfile approach is best because:**
- ✅ Each service can have its own Dockerfile
- ✅ No conflicts between services
- ✅ More control

**Make sure:**
1. `Dockerfile.spa` exists in your repo ✅
2. Railway SPA service is configured to use it
3. Railway Bot service uses `Dockerfile.bot` (or keeps Nixpacks with `npm start`)

---

## Quick Check

After configuring Dockerfile, the logs should show:
```
🎮 Retro invite page running on http://localhost:3000
```

NOT:
```
Error [TokenMissing]: Request to use token...
```

If you still see the token error, Railway is still using Nixpacks/railway.json instead of the Dockerfile.

