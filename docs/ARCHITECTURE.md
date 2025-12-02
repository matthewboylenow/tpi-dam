# Taylor Products Digital Asset Management - Architecture

## Overview

Taylor Products Digital Asset Management is a modern web application built for managing photos and videos with rich metadata, folders, starring, and advanced organization features.

---

## Tech Stack

### Core Framework
- **Next.js 14.2.18**: App Router, server components, and API routes
- **TypeScript**: Full type safety across the application
- **React 18**: UI components and hooks

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Brand Colors**:
  - Primary: `#1C4E80` (deep blue)
  - Primary Light: `#2F6FB2`
  - Accent: `#00A3A3` (teal)
  - Background: `#0F172A` (dark slate)

### Data & Storage
- **Vercel Postgres (Neon)**: PostgreSQL database via `@vercel/postgres`
- **Vercel Blob**: Cloud object storage for media files via `@vercel/blob`

### Authentication
- **NextAuth.js v4**: Authentication framework
- **Credentials Provider**: Username/password authentication
- **bcryptjs**: Password hashing
- **Future**: Microsoft 365 / Entra ID SSO (designed for easy integration)

### Key Libraries
- **Zod**: Schema validation for API inputs
- **clsx**: Utility for conditional CSS classes
- **@dnd-kit**: Drag-and-drop functionality
- **react-dropzone**: File upload with drag-and-drop
- **react-easy-crop**: Image editing (crop and rotate)

---

## Data Model

### Complete Database Schema

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales', -- 'sales' or 'admin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media assets table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  caption TEXT,
  client_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Media tags junction table
CREATE TABLE IF NOT EXISTS media_tags (
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, tag_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_media_owner ON media_assets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_media_folder ON media_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_starred ON media_assets(is_starred);
CREATE INDEX IF NOT EXISTS idx_media_created ON media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_used ON invitations(used_at);
```

### Relationships
- Users own media assets (one-to-many)
- Folders contain media assets (one-to-many)
- Media assets have many tags (many-to-many via `media_tags`)
- Invitations track who invited whom (many-to-one with users)

---

## Authentication Flow

### Credentials-based Auth
1. **Registration** (`/register/[token]`):
   - Token-based registration (invite-only)
   - Validates invitation token (not expired, not used)
   - User provides email, name, password
   - Password hashed with bcryptjs
   - User stored in database with role from invitation
   - Token marked as used

2. **Login** (`/login`):
   - NextAuth Credentials Provider
   - Verify email + password against database
   - Create JWT session with user info + role

3. **Session Management**:
   - JWT strategy for session storage
   - Session includes: id, email, name, role
   - Server-side session validation in protected routes

4. **Route Protection**:
   - `/dashboard`: Requires authentication (sales or admin)
   - `/admin`: Requires authentication + admin role
   - Redirects to `/login` if not authenticated

### Future: Microsoft 365 Integration
- Add Azure AD provider to NextAuth configuration
- Map M365 user email to existing user records
- Maintain backward compatibility with credentials auth

---

## Media Upload Flow

1. User selects files in `BulkMediaUploadForm` component
2. Frontend validates files (type, size)
3. For each file:
   - Frontend requests signed upload URL from `/api/upload`
   - Uploads file directly to Vercel Blob storage
   - On success, creates media record via `/api/media` POST
4. API creates `media_assets` record with metadata
5. UI updates to show new asset in grid

**Upload Limits:**
- Max file size: 200MB
- Supported formats:
  - Images: JPEG, PNG, GIF, WebP, HEIC
  - Videos: MP4, MOV, M4V, MPEG

---

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth handlers (login, logout, session)
- `POST /api/auth/register` - Token-based registration

### Invitations (Admin Only)
- `POST /api/invitations` - Create invitation
- `GET /api/invitations` - List all invitations
- `DELETE /api/invitations/[id]` - Revoke invitation

### Folders
- `GET /api/folders` - List all folders with media counts
- `POST /api/folders` - Create folder (admin only)
- `PATCH /api/folders/[id]` - Update folder (admin only)
- `DELETE /api/folders/[id]` - Delete folder (admin only)

### Media Management
- `POST /api/upload` - Upload file to Vercel Blob, return URL
- `POST /api/media` - Create media asset metadata
- `GET /api/media` - List/filter media assets
  - Query params: `scope`, `owner`, `client`, `tag`, `from`, `to`, `search`, `folder_id`, `sort_by`, `sort_order`
  - `scope=mine`: Current user's assets only
  - `scope=all`: All assets (admin only)
- `GET /api/media/[id]` - Get single media asset
- `PATCH /api/media/[id]` - Update media asset (edited image URL, etc.)
- `DELETE /api/media/[id]` - Delete media asset (owner or admin)
- `PATCH /api/media/[id]/star` - Toggle starred status (admin only)
- `PATCH /api/media/[id]/move` - Move media to folder (admin only)

### Tags (Optional)
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag

---

## Project Structure

```
tpi-dam/
  app/
    layout.tsx                    # Root layout with global styles
    page.tsx                      # Landing page with login/register links
    login/page.tsx                # Login form
    register/
      [token]/page.tsx            # Token-based registration form
    dashboard/
      page.tsx                    # User dashboard (server component)
      DashboardClient.tsx         # Client-side dashboard logic
    admin/
      page.tsx                    # Admin dashboard (server component)
      AdminClient.tsx             # Client-side admin logic
    api/
      auth/
        [...nextauth]/route.ts    # NextAuth config
        register/route.ts         # Registration endpoint
      invitations/
        route.ts                  # List/create invitations
        [id]/route.ts             # Delete invitation
      media/
        route.ts                  # Media CRUD operations
        [id]/
          route.ts                # Single media operations (get, patch, delete)
          star/route.ts           # Toggle starred status
          move/route.ts           # Move to folder
      folders/
        route.ts                  # Folder CRUD operations
        [id]/route.ts             # Single folder operations
      upload/route.ts             # Blob upload endpoint
      tags/route.ts               # Tag operations

  components/
    layout/
      Shell.tsx                   # App shell with navbar
    ui/                           # Reusable UI components
      Button.tsx
      Input.tsx
      Textarea.tsx
      Badge.tsx
      Card.tsx
      ContextMenu.tsx             # Right-click context menu
    media/                        # Media-specific components
      MediaCard.tsx               # Thumbnail card with metadata
      MediaGrid.tsx               # Responsive grid layout
      DraggableMediaGrid.tsx      # Drag-and-drop enabled grid
      MediaFilters.tsx            # Search and filter controls
      SortControls.tsx            # Sort dropdown
      BulkMediaUploadForm.tsx     # Complete upload workflow
      MediaDetailModal.tsx        # Full-size media viewer
      StarredMediaSection.tsx     # Pinned assets section
      ImageEditor.tsx             # Image crop/rotate editor
      BulkActionToolbar.tsx       # Multi-select toolbar
    folders/                      # Folder-specific components
      FolderList.tsx              # Folder sidebar
      DroppableFolderList.tsx     # Drag-drop enabled sidebar
      FolderCard.tsx              # Folder display card
      FolderCreateModal.tsx       # Create folder form
      FolderSelector.tsx          # Dropdown for uploads
    upload/                       # Upload-specific components
      DropzoneUpload.tsx          # Drag-drop upload zone
      iPhoneRecordingHelp.tsx     # iPhone recording tips
    admin/                        # Admin-specific components
      InvitationForm.tsx          # Create invitation form
      InvitationList.tsx          # List invitations
      StorageStats.tsx            # Storage usage stats

  lib/
    db/
      client.ts                   # Postgres client
      queries.ts                  # Database query helpers
    auth/
      authOptions.ts              # NextAuth configuration
      getCurrentUser.ts           # Session helper for server components
    blob/
      upload.ts                   # Blob storage helpers
    validation/
      mediaSchemas.ts             # Zod schemas for validation

  types/
    media.ts                      # TypeScript types for media assets
    user.ts                       # TypeScript types for users
    folder.ts                     # TypeScript types for folders

  docs/
    ARCHITECTURE.md               # This file
    FEATURE_SUMMARY.md            # Complete features documentation
    DEV_LOG.md                    # Development changelog
    AI_IMAGE_SEARCH.md            # AI search implementation guide
```

---

## UI/UX Design Principles

### Visual Design
- Clean, modern, B2B-focused aesthetic
- Industrial feel with subtle gradients
- Mobile-first responsive design
- Clear typography with good legibility

### Layout
- Top navigation bar with branding and user menu
- Max-width containers on large screens (`max-w-6xl`)
- Full-width on mobile devices
- Responsive grid for media cards:
  - Mobile: 2 columns
  - Tablet: 3 columns
  - Desktop: 4-5 columns

### Components
- Rounded corners (`rounded-2xl`) for cards
- Soft shadows (`shadow-md`)
- Hover states for interactive elements
- Badge/pill style for tags
- Modal/drawer for media detail view
- Context menus for quick actions

### Organization Hierarchy (All Media View)
1. **Pinned Assets** - Starred media section
2. **Folders** - Folder cards with counts
3. **Files** - Media not in any folder

---

## Deployment

### Prerequisites
- Vercel account
- Vercel Postgres (Neon) database
- Vercel Blob storage

### Environment Variables

```bash
# Database (auto-set by Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Storage (auto-set by Vercel Blob)
BLOB_READ_WRITE_TOKEN=

# NextAuth Configuration (required)
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl>

# Optional
REGISTRATION_CODE=your-secret-code
```

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to vercel.com → New Project
   - Import your repository
   - Framework: Next.js (auto-detected)

3. **Add Storage**
   - In Vercel project → Storage tab
   - Create Postgres database
   - Create Blob storage
   - Environment variables auto-added

4. **Set Environment Variables**
   - Add `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
   - Generate secret: `openssl rand -base64 32`

5. **Initialize Database**
   - Option A: Run `/scripts/init-db.sql` via Vercel Postgres Query tab
   - Option B: Use Vercel CLI to run locally against production DB
     ```bash
     vercel env pull .env.local
     npm run init-db
     ```

6. **Create Admin User**
   ```sql
   INSERT INTO users (email, name, password_hash, role)
   VALUES (
     'admin@taylorproducts.com',
     'Admin User',
     '<bcrypt-hash>',  -- Generate with bcryptjs
     'admin'
   );
   ```

   Generate hash:
   ```bash
   node -e "require('bcryptjs').hash('YOUR_PASSWORD', 10).then(h => console.log(h))"
   ```

7. **Deploy**
   - Vercel automatically deploys on push
   - Or manually trigger: `vercel --prod`

### Post-Deployment Verification

- [ ] Database tables created
- [ ] Admin user can log in
- [ ] Test user registration with invitation
- [ ] Test media upload (photo and video)
- [ ] Test media filtering and sorting
- [ ] Verify mobile responsiveness
- [ ] Check production logs for errors

---

## Performance Considerations

### Database
- Indices on frequently queried columns (owner_id, folder_id, created_at, is_starred)
- Efficient SQL queries with proper joins
- Connection pooling via Vercel Postgres

### Media Files
- Direct upload to Blob storage (bypasses server)
- Lazy loading for grid images
- Image optimization via Next.js Image component
- Sequential uploads to avoid server overload

### Frontend
- Server-side rendering for initial page load
- Client-side state management for filters
- React 18 concurrent features
- Minimal JavaScript bundle size

### Scalability
- Blob storage handles large files efficiently
- Pagination recommended for >500 media items
- Consider CDN for faster media delivery at scale

---

## Security

### Authentication & Authorization
- Admin-only operations enforced server-side
- Invitation tokens expire after 7 days
- Tokens are single-use (marked as used)
- JWT session with secure secret
- Role-based access control (admin, sales)

### File Handling
- File type validation on both client and server
- File size limits enforced (200MB)
- Supported file types whitelist
- No executable file uploads

### Database
- SQL injection prevented (parameterized queries)
- Password hashing with bcrypt (10 rounds)
- Cascade deletes for referential integrity

### Frontend
- XSS protection (React escapes by default)
- CORS properly configured for blob storage
- No sensitive data in client-side state

---

## Cost Estimates

### Vercel Blob Storage
- Storage: ~$0.15/GB/month
- Bandwidth: ~$0.15/GB

**Examples:**
- 50 videos @ 150MB = 7.5GB = **$1.13/month**
- 200 videos @ 100MB = 20GB = **$3.00/month**
- 500 videos @ 150MB = 75GB = **$11.25/month**

### Vercel Postgres
- Free tier: 256MB storage, 60 hours compute/month
- Pro: $20/month for more resources

### Bandwidth
- Charged on downloads/views
- Typical: $0.15/GB egress

---

## Browser Support

**Fully Tested:**
- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)

**Features:**
- Drag-drop: Desktop only (mobile uses native file picker)
- HEIC support: Safari, Chrome 108+, Edge 108+
- MOV support: All major browsers
- Touch gestures: iOS Safari, Chrome Mobile

---

## Future Enhancements

### Planned Features
1. **Microsoft 365 SSO** - Azure AD integration via NextAuth
2. **AI-powered Search** - OpenAI Vision for image tagging (see AI_IMAGE_SEARCH.md)
3. **Bulk Download** - Multi-file ZIP download
4. **Star Folders** - Pin important folders
5. **Advanced Filtering** - Date ranges, complex queries
6. **Collections/Albums** - Virtual groupings (different from folders)
7. **Activity Log** - Track uploads, views, downloads
8. **Version History** - Keep original when editing images
9. **Video Compression** - Server-side compression for large videos
10. **Pagination** - For libraries with >500 items

### Technical Debt
- Consider React Query for data fetching
- Add end-to-end tests (Playwright)
- Implement proper error boundaries
- Add Sentry for error tracking
- Consider Redis for session storage at scale

---

## Troubleshooting

### Database Issues
- **Connection errors:** Verify `POSTGRES_URL` is set correctly
- **Table not found:** Run init-db.sql to create schema
- **Slow queries:** Check indices on frequently queried columns

### Upload Issues
- **Upload fails:** Verify `BLOB_READ_WRITE_TOKEN` is set
- **File too large:** Check 200MB limit
- **Invalid format:** Verify file type is supported
- **Network error:** Check Vercel Blob storage status

### Authentication Issues
- **Can't login:** Verify user exists and password hash is correct
- **Session expired:** Check `NEXTAUTH_SECRET` is set
- **Redirect loop:** Verify `NEXTAUTH_URL` matches domain

### Performance Issues
- **Slow page load:** Consider pagination for large libraries
- **Upload timeout:** Sequential uploads may take time for many files
- **High costs:** Check storage usage in admin dashboard

---

## Contact & Support

For questions or issues:
1. Check logs in Vercel dashboard (Runtime Logs)
2. Review `docs/FEATURE_SUMMARY.md` for feature details
3. Review `docs/DEV_LOG.md` for implementation history
4. Check GitHub issues or create new issue

---

**Last Updated:** December 2, 2025
**Version:** 1.0
**Status:** Production Ready ✅
