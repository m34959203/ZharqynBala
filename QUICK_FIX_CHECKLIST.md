# ⚡ QUICK FIX - Railway NextAuth Issue

## The Problem
CSRF token present, but `authorize` callback never called = **Missing NEXTAUTH_URL**

## The Solution (5 minutes)

### 1. Open Railway Dashboard
Go to: https://railway.app

### 2. Select Frontend Service
Find: `illustrious-sparkle-production` (or your frontend service)

### 3. Add Environment Variables
Click **Variables** tab, then add:

```bash
NEXTAUTH_URL=https://illustrious-sparkle-production.up.railway.app
NEXTAUTH_SECRET=<generate-below>
NEXT_PUBLIC_API_URL=https://zharqynbala-production.up.railway.app
NODE_ENV=production
```

### 4. Generate NEXTAUTH_SECRET
Run in terminal:
```bash
openssl rand -base64 32
```
Copy the output and paste it as `NEXTAUTH_SECRET` value.

### 5. Redeploy
Railway will automatically redeploy after adding variables.
Or manually: **Settings** → **Redeploy**

### 6. Wait for Deployment
Watch the **Deployments** tab until status shows "Active"

### 7. Test Login
1. Open: https://illustrious-sparkle-production.up.railway.app/login
2. Enter credentials
3. Click "Войти"
4. Should redirect to `/dashboard` successfully

## Verification

Check logs in Railway → Deployments → View Logs:

Should see:
```
[NextAuth] NEXTAUTH_URL: https://illustrious-sparkle-production.up.railway.app
[NextAuth:authorize] ========== Starting authorize ==========
```

## If Still Failing

Check: https://illustrious-sparkle-production.up.railway.app/api/debug/config

Should show:
```json
{
  "environment": {
    "NEXTAUTH_URL": "https://illustrious-sparkle-production.up.railway.app",
    "NEXTAUTH_SECRET": "SET (hidden)"
  }
}
```

---

**Need more details?** See: [RAILWAY_NEXTAUTH_FIX.md](./RAILWAY_NEXTAUTH_FIX.md)
