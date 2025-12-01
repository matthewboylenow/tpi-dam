# Taylor Media Hub - Architecture

## Overview

Taylor Media Hub is a Digital Asset Management (DAM) web application built for Taylor Products salespeople to upload, manage, and share photos and videos with metadata like captions, client names, and tags.

## Tech Stack

### Core Framework
- **Next.js 15**: App Router, server components, and API routes
- **TypeScript**: Full type safety across the application
- **React 19**: Latest React features for UI components

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
- **Credentials Provider**: Username/password authentication for v1
- **bcryptjs**: Password hashing
- **Future**: Microsoft 365 / Entra ID SSO (designed for easy integration)

### Validation & Utilities
- **Zod**: Schema validation for API inputs
- **clsx**: Utility for conditional CSS classes

## Data Model

### Tables

#### `users`
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales', -- 'sales' or 'admin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `media_assets`
```sql
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  caption TEXT,
  client_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `tags`
```sql
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
```

#### `media_tags`
```sql
CREATE TABLE IF NOT EXISTS media_tags (
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, tag_id)
);
```

### Relationships
- Users own media assets (one-to-many)
- Media assets have many tags (many-to-many via `media_tags` junction table)
- Tags can be applied to many media assets

## Authentication Flow

### v1: Credentials-based Auth
1. **Registration** (`/register`):
   - User provides email, name, password
   - Password hashed with bcryptjs
   - User stored in database with role='sales' by default

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

## Media Upload Flow

1. User selects file in `MediaUploadForm` component
2. Frontend requests upload URL from `/api/upload-url`
3. API validates user session and generates Vercel Blob upload URL
4. Frontend uploads file directly to Blob storage
5. On success, frontend calls `/api/media` POST with:
   - blob_url (returned from Blob upload)
   - caption, client_name, tags, mime_type, file_size
6. API creates `media_assets` record and tag associations
7. UI updates to show new asset in grid

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth handlers (login, logout, session)

### Media Management
- `POST /api/upload-url` - Get Vercel Blob upload URL
- `POST /api/media` - Create media asset metadata
- `GET /api/media` - List/filter media assets
  - Query params: `owner`, `client`, `tag`, `from`, `to`, `search`, `scope`
  - `scope=mine`: Current user's assets only
  - `scope=all`: All assets (admin only)
- `GET /api/media/[id]` - Get single media asset
- `DELETE /api/media/[id]` - Delete media asset (owner or admin)

### Tags (optional)
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag

## Project Structure

```
taylor-media-hub/
  app/
    layout.tsx              # Root layout with global styles
    page.tsx                # Landing page with login/register links
    login/page.tsx          # Login form
    register/page.tsx       # Registration form
    dashboard/page.tsx      # Salesperson media library
    admin/page.tsx          # Admin dashboard
    api/
      auth/[...nextauth]/route.ts  # NextAuth config
      media/route.ts        # Media CRUD operations
      media/[id]/route.ts   # Single media operations
      upload-url/route.ts   # Blob upload URL generation
      tags/route.ts         # Tag operations

  components/
    layout/Shell.tsx        # App shell with navbar
    ui/                     # Reusable UI components
      Button.tsx
      Input.tsx
      Select.tsx
      Textarea.tsx
      Badge.tsx
      Card.tsx
    media/                  # Media-specific components
      MediaUploadForm.tsx
      MediaGrid.tsx
      MediaCard.tsx
      MediaFilters.tsx
      MediaDetailModal.tsx

  lib/
    db/
      client.ts            # Postgres client
      queries.ts           # Database query helpers
    auth/
      authOptions.ts       # NextAuth configuration
      getCurrentUser.ts    # Session helper for server components
    blob/
      upload.ts            # Blob storage helpers
    validation/
      mediaSchemas.ts      # Zod schemas for validation

  types/
    media.ts               # TypeScript types for media assets
    user.ts                # TypeScript types for users

  docs/
    ARCHITECTURE.md        # This file
    DEV_LOG.md            # Development changelog
```

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

## Future Enhancements

### Planned Features
1. **Microsoft 365 SSO**: Azure AD integration via NextAuth
2. **AI-powered Search**: Vector embeddings for semantic search
3. **AI Descriptions**: Automatic image/video captioning
4. **Bulk Operations**: Multi-select and batch download
5. **Advanced Filtering**: Date ranges, complex queries
6. **Media Editing**: Basic cropping/rotation
7. **Sharing**: Generate shareable links for assets

### Scalability Considerations
- Blob storage handles large files efficiently
- Database indices on frequently queried columns
- Pagination for large media libraries
- Lazy loading for grid images
- Server-side rendering for initial page load
