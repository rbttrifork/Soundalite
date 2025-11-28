# Railway SPA Setup - Fix the Token Error

The error you're seeing is because Railway is trying to run your Discord bot (`index.js`) instead of the SPA server (`server.js`).

## Quick Fix in Railway Dashboard:

1. **Go to your SPA service in Railway**
2. **Click on "Settings" tab**
3. **Scroll to "Deploy" section**
4. **Change "Start Command" from:**
   ```
   npm start
   ```
   **To:**
   ```
   npm run serve
   ```
5. **Save and redeploy**

---

## Alternative: Use Railway Config File

If you want Railway to automatically use the correct command, you have two options:

### Option A: Rename the config file (if this is a separate service)

If your SPA is in a **separate Railway service**, you can:
1. Rename `railway-spa.json` to `railway.json` in that service's root
2. Railway will automatically use it

### Option B: Configure in Railway UI (Easiest)

Just set the start command in Railway dashboard as shown above.

---

## Environment Variables Needed

Make sure your SPA service has:
- ✅ `CLIENT_ID` - Your Discord bot's client ID
- ❌ **DO NOT** add `TOKEN` - The SPA doesn't need the bot token!

The SPA only needs `CLIENT_ID` to generate invite links. It doesn't need to connect to Discord.

---

## Verify It's Working

After setting the start command to `npm run serve`, you should see in the logs:
```
🎮 Retro invite page running on http://localhost:3000
📡 Make sure CLIENT_ID is set in your .env file
```

If you see the bot trying to start (TokenInvalid error), the start command is still wrong.

