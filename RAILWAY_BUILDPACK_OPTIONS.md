# Railway Buildpack Options for Separate Services

## Current Situation

Railway uses **Nixpacks** by default, which reads from `railway.json`. Since the start command field is read-only when set in the config file, both services would use the same command.

## Solution Options

### Option 1: Use Dockerfiles (Recommended for Different Commands)

Dockerfiles give you full control and allow different start commands per service.

#### For SPA Service:
1. Create `Dockerfile` (or `Dockerfile.spa`) in your repo
2. In Railway SPA service → Settings → Build
3. Set **Dockerfile Path** to: `Dockerfile.spa` (or just `Dockerfile` if you rename it)
4. Railway will use the Dockerfile instead of Nixpacks

#### For Bot Service:
1. Create `Dockerfile.bot` in your repo  
2. In Railway Bot service → Settings → Build
3. Set **Dockerfile Path** to: `Dockerfile.bot`
4. Each service can now have completely different start commands!

**Files created:**
- ✅ `Dockerfile.spa` - For SPA service (runs `npm run serve`)
- ✅ `Dockerfile.bot` - For Bot service (runs `npm start`)

---

### Option 2: Environment Variable Wrapper Script

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

2. Update `railway.json` to use: `node start.js`
3. Set `SERVICE_TYPE=spa` in SPA service environment variables
4. Set `SERVICE_TYPE=bot` in Bot service environment variables (or leave unset)

---

### Option 3: Use Railway's Service-Specific Overrides

Some Railway setups allow you to:
1. Go to Service → Settings → Deploy
2. Override the start command even if it shows as read-only
3. Or use Railway's CLI to set per-service configs

---

### Option 4: Separate Repositories/Branches

- SPA service: Point to a branch with `railway.json` set to `npm run serve`
- Bot service: Point to main branch with `railway.json` set to `npm start`

---

## Recommended: Dockerfile Approach

**Why Dockerfiles?**
- ✅ Full control over each service
- ✅ Different start commands per service
- ✅ More predictable builds
- ✅ Better for production

**Steps:**
1. I've created `Dockerfile.spa` and `Dockerfile.bot` for you
2. In Railway:
   - **SPA Service**: Settings → Build → Dockerfile Path → `Dockerfile.spa`
   - **Bot Service**: Settings → Build → Dockerfile Path → `Dockerfile.bot`
3. Remove or ignore `railway.json` (or keep it for reference)

---

## Quick Setup with Dockerfiles

### SPA Service:
1. Settings → Build
2. Dockerfile Path: `Dockerfile.spa`
3. Environment Variables: `CLIENT_ID` (no TOKEN needed)

### Bot Service:
1. Settings → Build  
2. Dockerfile Path: `Dockerfile.bot`
3. Environment Variables: `TOKEN`, `CLIENT_ID`, etc.

---

## About "Railpack"

Railway's build system is called **Nixpacks** (not Railpack). However:
- Railway does support custom start commands via environment variables in some setups
- Dockerfiles are the most reliable way to have different commands per service
- Railway's newer features may allow more per-service customization

---

## Which Should You Use?

**Use Dockerfiles if:**
- You need different start commands per service ✅
- You want more control
- You're comfortable with Docker

**Use Environment Variable Wrapper if:**
- You want to keep using Nixpacks
- You don't mind a small wrapper script
- You want a simpler solution

**Recommendation:** Go with **Dockerfiles** - it's the cleanest solution for your use case!

