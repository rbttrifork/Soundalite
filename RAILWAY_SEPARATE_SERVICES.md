# Railway Setup: Separate Services (Bot + SPA)

This guide assumes you have **two separate Railway services**:
1. **Bot Service** - Runs your Discord bot (`index.js`)
2. **SPA Service** - Runs the invite page (`server.js`)

---

## Current Setup

✅ `railway.json` is now configured for the **SPA service** with `npm run serve`

---

## Bot Service Configuration

Since Railway reads from `railway.json` and the field is read-only, we have a few options:

### Option A: Rename Config Files Per Service (Recommended)

1. **For SPA Service:** Keep `railway.json` (already has `npm run serve`) ✅
2. **For Bot Service:** 
   - In Railway dashboard, go to Bot Service → Settings
   - If Railway allows you to specify a config file, point it to `railway-bot.json`
   - OR rename `railway.json` to `railway-spa.json` and `railway-bot.json` to `railway.json` temporarily, then switch back
   - OR use Railway's service-specific settings if available

### Option B: Use Railway Service Settings Override

1. Go to your **Bot Service** in Railway
2. Settings → Deploy
3. Check if there's a way to override the config file or start command
4. Some Railway setups allow service-level overrides even if the field shows as read-only

### Option C: Different Branches (If Needed)

If both services must use different configs from the same repo:
- Bot service: Use `main` branch with `railway-bot.json` renamed to `railway.json`
- SPA service: Use a different branch or configure separately

---

## SPA Service Configuration

✅ Already configured! The `railway.json` file has `npm run serve`

**Environment Variables needed:**
- ✅ `CLIENT_ID` - Your Discord bot's client ID
- ❌ **DO NOT** add `TOKEN` - The SPA doesn't need it!

---

## Verification

### Bot Service should show:
```
Bot started successfully
```

### SPA Service should show:
```
🎮 Retro invite page running on http://localhost:3000
📡 Make sure CLIENT_ID is set in your .env file
```

---

## If Both Services Use Same Repo

If both services are connected to the same GitHub repository:

1. **SPA Service** will use `railway.json` (with `npm run serve`) ✅
2. **Bot Service** needs to override the start command:
   - Go to Bot Service → Settings → Deploy
   - Try to override the start command to `npm start`
   - If it's read-only, you may need to:
     - Use a different branch for the bot service, OR
     - Create a separate `railway-bot.json` and configure Railway to use it

---

## Quick Checklist

- [ ] SPA Service: `railway.json` has `npm run serve` ✅
- [ ] SPA Service: Has `CLIENT_ID` environment variable
- [ ] SPA Service: Does NOT have `TOKEN` variable
- [ ] Bot Service: Uses `npm start` (either via override or default)
- [ ] Bot Service: Has `TOKEN` and `CLIENT_ID` variables
- [ ] Both services are deployed and running

---

## Troubleshooting

**SPA Service shows TokenInvalid error?**
- Make sure it's using `npm run serve`, not `npm start`
- Check that `railway.json` has the correct start command
- Verify the service is reading from the updated `railway.json`

**Bot Service not starting?**
- Make sure it's using `npm start`
- Check that `TOKEN` environment variable is set
- Verify bot service settings

