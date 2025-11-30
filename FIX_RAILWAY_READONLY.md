# Fix: Railway Read-Only Config - Both Services Solution

Since Railway reads from `railway.json` and you can't override it per service, we need a solution that works for both services using the same config.

## Solution: Environment Variable Wrapper

I've created a smart wrapper script that checks an environment variable to decide which service to run.

---

## What I Changed

1. ✅ Created `start.js` - Wrapper script that checks `SERVICE_TYPE` env var
2. ✅ Created `Dockerfile` - Single Dockerfile that both services can use
3. ✅ Updated both Dockerfiles to use the wrapper
4. ✅ Updated `railway.json` to use the single `Dockerfile`

---

## How It Works

The `start.js` script checks the `SERVICE_TYPE` environment variable:
- If `SERVICE_TYPE=spa` → Runs `server.js` (SPA)
- If `SERVICE_TYPE=bot` → Runs `index.js` (Bot)
- Defaults to `bot` if not set

---

## Setup in Railway

### SPA Service:
1. Go to **SPA Service** → **Variables** tab
2. Add environment variable:
   - **Key:** `SERVICE_TYPE`
   - **Value:** `spa`
3. Save

### Bot Service:
1. Go to **Bot Service** → **Variables** tab
2. Add environment variable:
   - **Key:** `SERVICE_TYPE`
   - **Value:** `bot`
3. Save (or leave unset - defaults to bot)

---

## Current Configuration

- ✅ `railway.json` points to `Dockerfile` (single file)
- ✅ `Dockerfile` runs `start.js` wrapper
- ✅ `start.js` checks `SERVICE_TYPE` env var
- ✅ Each service sets its own `SERVICE_TYPE`

---

## After Setup

**SPA Service logs should show:**
```
🚀 Starting service type: spa
📱 Starting SPA server...
🎮 Retro invite page running on http://localhost:3000
```

**Bot Service logs should show:**
```
🚀 Starting service type: bot
🤖 Starting Discord bot...
[Bot connection messages...]
```

---

## Benefits

- ✅ Both services use the same `railway.json`
- ✅ Both services use the same `Dockerfile`
- ✅ No need to override Railway's read-only settings
- ✅ Easy to maintain - one config for both

---

## Troubleshooting

**Both services running the same thing?**
- Check that `SERVICE_TYPE` environment variable is set correctly in each service
- SPA should have `SERVICE_TYPE=spa`
- Bot should have `SERVICE_TYPE=bot`

**Service not starting?**
- Check the logs to see which service type it's trying to start
- Verify the environment variable is set in Railway dashboard

