# Fix: Bot Service Running SPA Instead of Bot

## The Problem

Both services are reading from the same `railway.json`, which now points to `Dockerfile.spa`. So both services are trying to run the SPA!

## The Solution

Configure each service to use its own Dockerfile in Railway dashboard.

---

## Step 1: SPA Service (Already Correct ✅)

Your SPA service should be using:
- **Builder:** Dockerfile
- **Dockerfile Path:** `Dockerfile.spa`
- This is already configured correctly!

---

## Step 2: Bot Service Configuration

Go to your **Bot Service** in Railway:

1. **Settings** → **Build** section
2. **Builder:** Change to "Dockerfile" (if not already)
3. **Dockerfile Path:** Change from `/Dockerfile.spa` to `/Dockerfile.bot`
4. **Save**

This will make the bot service use `Dockerfile.bot` which runs `npm start` (the bot).

---

## Alternative: If Railway Still Reads railway.json

If Railway is still forcing both services to use `railway.json`, you have two options:

### Option A: Environment Variable Wrapper (Works with Same Config)

Create a smart entry point that checks an environment variable:

1. Create `start.js`:
```javascript
const SERVICE_TYPE = process.env.SERVICE_TYPE || 'bot';

if (SERVICE_TYPE === 'spa') {
  require('./server.js');
} else {
  require('./index.js');
}
```

2. Update `railway.json` to use Dockerfile with a wrapper, OR
3. Set environment variable:
   - **SPA Service:** `SERVICE_TYPE=spa`
   - **Bot Service:** `SERVICE_TYPE=bot` (or leave unset)

### Option B: Use Different Branches

- **SPA Service:** Use a branch where `railway.json` points to Dockerfile.spa
- **Bot Service:** Use main branch where `railway.json` points to Dockerfile.bot

---

## Recommended: Configure Dockerfile Path Per Service

**In Railway Dashboard:**

### SPA Service:
- Settings → Build
- Dockerfile Path: `Dockerfile.spa` ✅

### Bot Service:
- Settings → Build  
- Dockerfile Path: `Dockerfile.bot` ← **Change this!**

This way each service uses its own Dockerfile, regardless of what `railway.json` says.

---

## Quick Fix Right Now

1. Go to **Bot Service** → **Settings** → **Build**
2. Change **Dockerfile Path** from `/Dockerfile.spa` to `/Dockerfile.bot`
3. Save and redeploy

The bot service should now run the bot instead of the SPA!

