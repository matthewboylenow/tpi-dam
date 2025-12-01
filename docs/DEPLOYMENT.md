# Taylor Media Hub - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- A Vercel account (sign up at vercel.com)
- Access to Vercel Postgres (Neon) database
- Access to Vercel Blob storage

## Step 1: Set Up Vercel Project

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to vercel.com and click "New Project"
3. Import your repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

## Step 2: Configure Vercel Postgres

1. In your Vercel project dashboard, go to the **Storage** tab
2. Click **Create Database** and select **Postgres**
3. Follow the prompts to create a new Postgres database
4. Vercel will automatically add the following environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

## Step 3: Configure Vercel Blob

1. In your Vercel project dashboard, go to the **Storage** tab
2. Click **Create Database** and select **Blob**
3. Vercel will automatically add:
   - `BLOB_READ_WRITE_TOKEN`

## Step 4: Add Environment Variables

In your Vercel project settings, add these additional environment variables:

### Required Variables

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-a-random-string>

# Optional: Registration Access Control
REGISTRATION_CODE=your-secret-code
```

### Generating NEXTAUTH_SECRET

Run this command locally to generate a secure secret:
```bash
openssl rand -base64 32
```

Or use this Node.js one-liner:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 5: Initialize the Database

After deployment, you need to run the database initialization script:

### Option A: Run via Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link to your project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

4. Run the initialization script locally (it will connect to production database):
   ```bash
   npm run init-db
   ```

### Option B: Manual SQL Execution

1. Go to your Vercel Postgres database in the Vercel dashboard
2. Open the **Query** tab
3. Copy and paste the contents of `scripts/init-db.sql`
4. Execute the SQL to create all tables and indices

## Step 6: Create Admin User

You'll need to create at least one admin user manually:

1. Connect to your Vercel Postgres database
2. Run this SQL (replace with your details):

```sql
-- First, create the admin user
INSERT INTO users (email, name, password_hash, role)
VALUES (
  'admin@taylorproducts.com',
  'Admin User',
  -- This is bcrypt hash of 'password123' - CHANGE THIS!
  '$2a$10$YourBcryptHashHere',
  'admin'
);
```

To generate a bcrypt hash, you can use this Node.js script:

```javascript
// hash-password.js
const bcrypt = require('bcryptjs');
const password = process.argv[2] || 'password123';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

Run it:
```bash
node -e "require('bcryptjs').hash('YOUR_PASSWORD', 10).then(h => console.log(h))"
```

## Step 7: Verify Deployment

1. Visit your deployed site: `https://your-project.vercel.app`
2. Try to register a new user (if registration code is set, use it)
3. Log in with your credentials
4. Test uploading a photo or video
5. Verify the media appears in your dashboard
6. If you created an admin user, test the admin dashboard

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | Auto-set by Vercel Postgres |
| `BLOB_READ_WRITE_TOKEN` | Yes | Auto-set by Vercel Blob |
| `NEXTAUTH_URL` | Yes | Your production URL |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing |
| `REGISTRATION_CODE` | No | Optional code to restrict registration |

## Local Development

To run the project locally:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in values:
   ```bash
   cp .env.example .env.local
   ```

4. Pull production environment variables (if linked to Vercel):
   ```bash
   vercel env pull .env.local
   ```

5. Initialize the database (if needed):
   ```bash
   npm run init-db
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open http://localhost:3000

## Troubleshooting

### Database connection errors
- Verify `POSTGRES_URL` is set correctly
- Check Vercel Postgres dashboard for database status
- Ensure tables are created (run init-db script)

### Image upload fails
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Vercel Blob storage limits
- Ensure file size is under 100MB

### Authentication issues
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set and not empty
- Clear cookies and try again

### "Unauthorized" errors
- User may not be logged in
- Session may have expired
- Check browser console for errors

## Post-Deployment Checklist

- [ ] Database initialized with tables
- [ ] At least one admin user created
- [ ] Test user registration
- [ ] Test user login
- [ ] Test media upload (photo)
- [ ] Test media upload (video)
- [ ] Test media filtering
- [ ] Test admin dashboard access
- [ ] Verify mobile responsiveness
- [ ] Check production logs for errors

## Future Enhancements

See `docs/ARCHITECTURE.md` for planned features:
- Microsoft 365 / Entra ID SSO
- AI-powered search and auto-tagging
- Bulk operations and downloads
- Advanced filtering and date ranges
- Media editing capabilities

## Support

For issues or questions:
1. Check the logs in Vercel dashboard
2. Review `docs/ARCHITECTURE.md` for system details
3. Check `docs/DEV_LOG.md` for implementation notes
