# Railway NextAuth Fix - Authorize Callback Not Called

## Problem Analysis

**Symptom:** NextAuth signIn fails in production on Railway
**Pattern:** CSRF token is present, but `authorize` callback is never called
**Environment:** Railway.app deployment with Nixpacks

## Root Cause

The `authorize` callback is not being called because NextAuth is failing **origin validation** before it reaches your authorize function. This happens when:

1. `NEXTAUTH_URL` is not set or set incorrectly in Railway environment variables
2. The request origin doesn't match the configured `NEXTAUTH_URL`
3. NextAuth silently fails CSRF validation and never calls the provider's authorize function

## Current Configuration Issues

### 1. Frontend URL Mismatch
- **Expected Frontend URL:** `https://illustrious-sparkle-production.up.railway.app`
- **Hardcoded in config:** `https://zharqynbala-production.up.railway.app` (wrong!)
- **Location:** `/home/user/ZharqynBala/frontend/next.config.ts` and `.env.example`

### 2. Required Environment Variables
Your NextAuth setup requires these variables in Railway:

```bash
# Critical for NextAuth to work on Railway
NEXTAUTH_URL=https://illustrious-sparkle-production.up.railway.app
NEXTAUTH_SECRET=<must-be-64-character-random-string>

# API Backend URL
NEXT_PUBLIC_API_URL=https://zharqynbala-production.up.railway.app
```

## Solution

### Step 1: Set Environment Variables in Railway

1. Open your **frontend service** on Railway
2. Go to **Variables** tab
3. Add these environment variables:

```bash
# NextAuth Configuration (CRITICAL!)
NEXTAUTH_URL=https://illustrious-sparkle-production.up.railway.app
NEXTAUTH_SECRET=<generate-using-command-below>

# Backend API
NEXT_PUBLIC_API_URL=https://zharqynbala-production.up.railway.app

# Node Environment
NODE_ENV=production
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 2: Verify railway.json Configuration

Your `/home/user/ZharqynBala/frontend/railway.json` is correct:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Step 3: Update Frontend Configuration Files

Update the default values to match your actual production URLs:

**File: `/home/user/ZharqynBala/frontend/next.config.ts`**
```typescript
const nextConfig: NextConfig = {
  env: {
    // Use Railway environment variable, fallback to production URL
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://zharqynbala-production.up.railway.app',
  },
  // ... rest of config
};
```

**File: `/home/user/ZharqynBala/frontend/.env.example`**
```bash
# Production URLs
NEXT_PUBLIC_API_URL=https://zharqynbala-production.up.railway.app

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://illustrious-sparkle-production.up.railway.app

# OAuth providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 4: Verify NextAuth Configuration

Your `/home/user/ZharqynBala/frontend/lib/auth.ts` already has the correct configuration:

✅ **trustHost: true** - Critical for Railway proxy support
✅ **No custom cookie config** - Lets NextAuth handle cookies automatically
✅ **Debug mode enabled** - Helps with troubleshooting
✅ **Comprehensive logging** - All callbacks have logging

## Why This Happens on Railway

### Railway-Specific Issues

1. **Nixpacks Auto-Detection**
   - Nixpacks automatically detects Next.js apps
   - Environment variables must be set in Railway UI, not just in `.env` files
   - Build-time vs runtime environment variable differences

2. **Reverse Proxy Headers**
   - Railway uses a reverse proxy (like Nginx)
   - NextAuth needs `trustHost: true` to accept `X-Forwarded-Host` headers
   - Without this, NextAuth thinks requests come from `localhost`

3. **Dynamic URLs**
   - Railway generates random URLs like `illustrious-sparkle-production.up.railway.app`
   - These must be explicitly set in `NEXTAUTH_URL`
   - NextAuth does NOT auto-detect the production URL on Railway

## Verification Steps

### 1. Check Environment Variables in Railway

```bash
# In Railway frontend service Variables tab, verify:
echo $NEXTAUTH_URL
# Should output: https://illustrious-sparkle-production.up.railway.app

echo $NEXTAUTH_SECRET
# Should output: <your-64-character-secret>

echo $NEXT_PUBLIC_API_URL
# Should output: https://zharqynbala-production.up.railway.app
```

### 2. Check Debug Endpoint

After redeploying, visit:
```
https://illustrious-sparkle-production.up.railway.app/api/debug/config
```

Expected response:
```json
{
  "timestamp": "2026-01-06T...",
  "environment": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_API_URL": "https://zharqynbala-production.up.railway.app",
    "NEXTAUTH_URL": "https://illustrious-sparkle-production.up.railway.app",
    "NEXTAUTH_SECRET": "SET (hidden)"
  }
}
```

### 3. Check Railway Deployment Logs

After setting environment variables and redeploying, check logs for:

```
========== NextAuth Configuration ==========
[NextAuth] API_URL: https://zharqynbala-production.up.railway.app
[NextAuth] NEXTAUTH_URL: https://illustrious-sparkle-production.up.railway.app
[NextAuth] NEXTAUTH_SECRET: SET (hidden)
[NextAuth] NODE_ENV: production
============================================
```

### 4. Test Login Flow

1. Open: `https://illustrious-sparkle-production.up.railway.app/login`
2. Open browser DevTools → Console
3. Enter credentials and click "Войти"
4. Watch for these log messages:

```
[LoginPage:onSubmit] ========== Login Started ==========
[LoginPage:onSubmit] CSRF token: present
[LoginPage:onSubmit] Calling signIn...
```

Then on the server side (Railway logs), you should see:
```
[NextAuth:authorize] ========== Starting authorize ==========
[NextAuth:authorize] Credentials received: email present
[NextAuth:authorize] API URL: https://zharqynbala-production.up.railway.app/api/v1/auth/login
```

## Common Mistakes to Avoid

### ❌ Don't Do This
```bash
# Wrong - using localhost
NEXTAUTH_URL=http://localhost:3000

# Wrong - using wrong domain
NEXTAUTH_URL=https://zharqynbala-production.up.railway.app

# Wrong - no protocol
NEXTAUTH_URL=illustrious-sparkle-production.up.railway.app

# Wrong - trailing slash
NEXTAUTH_URL=https://illustrious-sparkle-production.up.railway.app/
```

### ✅ Do This
```bash
# Correct - exact production URL, no trailing slash
NEXTAUTH_URL=https://illustrious-sparkle-production.up.railway.app

# Correct - strong random secret
NEXTAUTH_SECRET=d9c3b4a5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4
```

## Additional Railway Configuration

### OAuth Providers Setup

If using Google or Mail.ru OAuth, add these to Railway Variables:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Mail.ru OAuth
MAILRU_CLIENT_ID=your-mailru-client-id
MAILRU_CLIENT_SECRET=your-mailru-client-secret
```

**Important:** Update OAuth redirect URIs in Google/Mail.ru console:
```
https://illustrious-sparkle-production.up.railway.app/api/auth/callback/google
https://illustrious-sparkle-production.up.railway.app/api/auth/callback/mailru
```

## Deployment Checklist

- [ ] Set `NEXTAUTH_URL` in Railway frontend variables
- [ ] Set `NEXTAUTH_SECRET` in Railway frontend variables (use `openssl rand -base64 32`)
- [ ] Set `NEXT_PUBLIC_API_URL` in Railway frontend variables
- [ ] Set `NODE_ENV=production` in Railway frontend variables
- [ ] Redeploy frontend service on Railway
- [ ] Check deployment logs for correct environment variables
- [ ] Test `/api/debug/config` endpoint
- [ ] Test login with credentials
- [ ] Check Railway logs for `[NextAuth:authorize]` messages

## If Still Not Working

### Enable Detailed Logging

The auth configuration already has `debug: true` and comprehensive logging. Check Railway logs for:

1. **CSRF validation errors:**
```
[NextAuth:logger:error] CSRF_TOKEN_MISMATCH
```

2. **Origin mismatch:**
```
[NextAuth:logger:warn] NEXTAUTH_URL_MISMATCH
```

3. **Cookie issues:**
```
[NextAuth:logger:error] NO_SECRET
```

### Manual CSRF Token Check

Visit: `https://illustrious-sparkle-production.up.railway.app/api/auth/csrf`

Expected response:
```json
{
  "csrfToken": "some-long-token-string"
}
```

If this fails, `NEXTAUTH_URL` or `NEXTAUTH_SECRET` is not set correctly.

## Technical Deep Dive

### Why Authorize Callback Isn't Called

NextAuth flow:
1. Client submits credentials to `/api/auth/callback/credentials`
2. NextAuth validates CSRF token (**fails here if NEXTAUTH_URL wrong**)
3. NextAuth validates origin matches NEXTAUTH_URL (**fails here if mismatch**)
4. NextAuth calls provider's `authorize` function (**never reached if steps 2-3 fail**)

Railway complication:
- Railway proxies all requests through their edge network
- Requests have `X-Forwarded-Host: illustrious-sparkle-production.up.railway.app`
- NextAuth needs `trustHost: true` to trust this header (✅ already set)
- NextAuth needs `NEXTAUTH_URL` to validate the origin (❌ missing!)

### Why trustHost Alone Isn't Enough

`trustHost: true` tells NextAuth to trust the proxy headers, but it still needs to know what the expected origin is. Without `NEXTAUTH_URL`, NextAuth doesn't know if the request is legitimate or an attack.

## Next.js + Railway Specific Notes

### Nixpacks vs Dockerfile

- **Backend (Dockerfile):** Environment variables are available at build time
- **Frontend (Nixpacks):** Environment variables must be set in Railway UI

### Build vs Runtime Variables

Next.js has two types of variables:
- `NEXT_PUBLIC_*`: Embedded in client-side code at **build time**
- `NEXTAUTH_*`: Used server-side at **runtime**

Railway Nixpacks handles both correctly, but you MUST set them in Railway Variables.

## Success Criteria

After applying the fix, you should see in Railway logs:

```
========== NextAuth Configuration ==========
[NextAuth] API_URL: https://zharqynbala-production.up.railway.app
[NextAuth] NEXTAUTH_URL: https://illustrious-sparkle-production.up.railway.app
[NextAuth] NEXTAUTH_SECRET: SET (hidden)
[NextAuth] NODE_ENV: production
============================================
[NextAuth] Total providers registered: 1
[NextAuth] Provider IDs: ['credentials']

[NextAuth:authorize] ========== Starting authorize ==========
[NextAuth:authorize] Credentials received: email present
[NextAuth:authorize] Making fetch request...
[NextAuth:authorize] Response status: 200
[NextAuth:authorize] Returning user object: { id: '...', email: '...' }

[NextAuth:jwt] ========== JWT Callback ==========
[NextAuth:jwt] Initial sign in - processing user data

[NextAuth:session] ========== Session Callback ==========
[NextAuth:session] Final session user: { id: '...', email: '...' }

[NextAuth:signIn] ========== SignIn Callback ==========
[NextAuth:signIn] Credentials sign in - allowing

[NextAuth:redirect] ========== Redirect Callback ==========
[NextAuth:redirect] Redirecting to: https://illustrious-sparkle-production.up.railway.app/dashboard
```

## Resources

- [NextAuth.js Railway Deployment](https://next-auth.js.org/deployment#railway)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**Last Updated:** 2026-01-06
**Status:** Ready for deployment
