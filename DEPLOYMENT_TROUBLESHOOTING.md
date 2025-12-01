# Deployment Troubleshooting - 404 Error Fix

**Issue:** Getting `404: NOT_FOUND` when visiting the deployed Vercel app homepage

**Most Likely Cause:** Missing or incorrect environment variables (especially NextAuth configuration)

---

## ✅ Step-by-Step Fix

### Step 1: Verify Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### Check These Variables Exist:

**Auto-added by Storage (should already be there):**
- ✅ `POSTGRES_URL` - From Postgres database
- ✅ `BLOB_READ_WRITE_TOKEN` - From Blob storage

**Manually add these if missing:**

1. **NEXTAUTH_URL**
   - Value: `https://your-actual-vercel-domain.vercel.app`
   - **CRITICAL:** Must match your exact Vercel domain
   - Example: `https://tpi-dam.vercel.app` or `https://tpi-dam-matthewboylenow.vercel.app`
   - Environment: Production, Preview, Development (select all three)

2. **NEXTAUTH_SECRET**
   - Generate locally by running:
     ```bash
     openssl rand -base64 32
     ```
   - Copy the output (will look like: `d0xwmY1mgxGn6oHKJpavpSBE...`)
   - Paste as the value
   - Environment: Production, Preview, Development (select all three)

3. **REGISTRATION_CODE** (Optional)
   - Value: `TPIDAMREG2025`
   - Environment: Production, Preview, Development

---

### Step 2: Redeploy After Adding Variables

**Important:** Environment variables only take effect on new deployments!

1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the **︙** (three dots) menu
4. Click **"Redeploy"**
5. Wait for deployment to complete (~2-3 minutes)

---

### Step 3: Test the Homepage

Visit your Vercel URL: `https://your-app.vercel.app`

**Expected Result:**
- ✅ See the landing page with "Taylor Media Hub" title
- ✅ See "Log In" and "Register" buttons
- ✅ No 404 error

**If still getting 404:**
- Check the exact URL matches what you set in `NEXTAUTH_URL`
- Check Vercel deployment logs for errors (Functions tab)

---

### Step 4: Initialize Production Database

**Only do this AFTER the app loads successfully!**

#### Method A: Via Vercel Dashboard (Recommended)

1. Go to **Storage** → Click your **Postgres** database
2. Click **"Query"** tab
3. Copy the ENTIRE contents of `/workspaces/tpi-dam/scripts/init-db.sql`
4. Paste into the query editor
5. Click **"Run Query"**
6. Verify you see: `CREATE TABLE` success messages

#### Method B: Via Command Line

```bash
# Pull production environment variables
vercel env pull .env.production

# Run initialization script
npm run init-db

# Verify it worked (should show 4 tables)
# Check in Vercel Dashboard → Storage → Postgres → Data tab
```

**Expected Tables:**
- ✅ `users`
- ✅ `media_assets`
- ✅ `tags`
- ✅ `media_tags`

---

### Step 5: Create Production Admin User

**Method A: Via SQL Query in Vercel**

1. First, generate a password hash locally:
   ```bash
   node -e "require('bcryptjs').hash('YourSecurePassword', 10).then(h => console.log(h))"
   ```

2. Copy the hash (starts with `$2a$10$...`)

3. In Vercel Postgres → Query tab, run:
   ```sql
   INSERT INTO users (email, name, password_hash, role)
   VALUES (
     'admin@taylorproducts.com',
     'Admin User',
     '$2a$10$YourHashHere',  -- Paste your hash
     'admin'
   );
   ```

**Method B: Via Command Line**

```bash
# Make sure you have production env vars
vercel env pull .env.production

# Create admin user
npm run quick-setup admin@taylorproducts.com "Admin User" "YourSecurePassword"
```

---

### Step 6: Test Full Application

1. **Homepage** - `https://your-app.vercel.app`
   - ✅ Should load without errors

2. **Login** - Click "Log In" or visit `/login`
   - ✅ Should show login form
   - Use: `admin@taylorproducts.com` / `YourSecurePassword`

3. **Dashboard** - After logging in
   - ✅ Should redirect to `/dashboard`
   - ✅ Should show "My Media Library"

4. **Upload Test** - Click "Upload Media"
   - ✅ Should show upload form
   - Try uploading a small test image

5. **Admin** - Visit `/admin`
   - ✅ Should show "Admin – All Media"
   - ✅ Should show any uploaded media

---

## 🔍 Additional Troubleshooting

### If Homepage Still Shows 404:

1. **Check Vercel Logs:**
   - Deployments → Latest deployment → View Function Logs
   - Look for errors mentioning NextAuth, environment, or database

2. **Check Build Logs:**
   - Make sure build completed successfully
   - Look for "✓ Compiled successfully" message

3. **Verify Domain:**
   - Make sure you're visiting the correct Vercel URL
   - Check Settings → Domains for the exact URL

### If Login Fails:

1. **Check NEXTAUTH_SECRET is set:**
   - Settings → Environment Variables
   - Should be a long random string

2. **Check database tables exist:**
   - Storage → Postgres → Data tab
   - Should see `users` table

3. **Check admin user exists:**
   - Storage → Postgres → Query tab
   - Run: `SELECT * FROM users WHERE role = 'admin';`

### If Upload Fails:

1. **Check BLOB_READ_WRITE_TOKEN:**
   - Settings → Environment Variables
   - Should start with `vercel_blob_rw_`

2. **Check Blob storage exists:**
   - Storage → Should see your Blob store listed

---

## 📋 Quick Checklist

When you return, verify these in order:

- [ ] All environment variables are set in Vercel
- [ ] `NEXTAUTH_URL` matches your exact Vercel domain
- [ ] `NEXTAUTH_SECRET` is generated and set
- [ ] Redeployed after adding variables
- [ ] Homepage loads without 404
- [ ] Database initialized (4 tables exist)
- [ ] Admin user created
- [ ] Can log in successfully
- [ ] Can upload media
- [ ] Admin dashboard works

---

## 🆘 If Nothing Works

Check these files for any syntax errors:
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Homepage
- `lib/auth/authOptions.ts` - NextAuth config

Or share the Vercel Function Logs and I can help debug further!

---

## 📝 Summary of What I Did

1. ✅ Created this troubleshooting guide
2. ✅ Identified missing environment variables as likely cause
3. ✅ Provided step-by-step fix instructions
4. ✅ Added database initialization steps
5. ✅ Added testing checklist

**Next Action When You Return:**
Start with Step 1 - Check and add the environment variables in Vercel, then redeploy!
