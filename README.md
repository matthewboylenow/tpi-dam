# Taylor Products Digital Asset Management

A Digital Asset Management (DAM) web application for Taylor Products to upload, manage, and share photos and videos with metadata.

---

## Overview

**Taylor Products DAM** allows users to:
- Upload photos and videos with captions, client names, and tags
- Manage their personal media library
- Search and filter assets by date, client, and tags
- View and download media with full metadata

Admins can:
- View all media from all salespeople
- Filter by salesperson, client, date, and tags
- Download any asset

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Vercel Postgres (Neon)
- **Storage:** Vercel Blob
- **Authentication:** NextAuth.js with credentials
- **Validation:** Zod

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Vercel account with Postgres and Blob storage

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd tpi-dam
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

   Or pull from Vercel:
   ```bash
   vercel link
   vercel env pull .env.local
   ```

4. **Run automated setup**
   ```bash
   npm run setup
   ```

   Or manually:
   ```bash
   # Initialize database
   npm run init-db

   # Create admin user
   npm run create-admin
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Visit: http://localhost:3000

---

## Project Structure

```
taylor-products-dam/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── admin/             # Admin dashboard
│   ├── login/             # Login page
│   └── register/          # Registration page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── media/            # Media-specific components
│   └── layout/           # Layout components
├── lib/                   # Core logic
│   ├── db/               # Database client & queries
│   ├── auth/             # Authentication helpers
│   ├── blob/             # File upload helpers
│   └── validation/       # Zod schemas
├── types/                 # TypeScript types
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md
│   ├── DEV_LOG.md
│   └── DEPLOYMENT.md
└── scripts/               # Setup scripts
```

---

## Features

### Authentication
- Email/password login with NextAuth
- User registration with optional access code
- Role-based access control (sales vs admin)
- Secure password hashing

### Media Management
- Upload photos and videos (up to 100MB)
- Add captions, client names, and tags
- Real-time upload progress
- Automatic unique filename generation

### Dashboard
- Personal media library
- Responsive grid layout
- Search and filter capabilities
- Full-screen media viewer
- Download functionality

### Admin Features
- View all users' media
- Advanced filtering
- User information display
- Same capabilities as user dashboard

---

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/upload` - File upload to Blob
- `POST /api/media` - Create media record
- `GET /api/media` - List/filter media
- `GET /api/media/[id]` - Get single media
- `DELETE /api/media/[id]` - Delete media

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add Postgres and Blob storage
4. Set environment variables
5. Run database initialization
6. Create admin user

---

## Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Setup
npm run setup        # Automated setup (interactive)
npm run quick-setup  # Create admin user (non-interactive)
npm run init-db      # Initialize database tables
npm run create-admin # Create admin user (interactive)

# Utilities
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

---

## Environment Variables

```bash
# Vercel Postgres
POSTGRES_URL="postgres://..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Optional
REGISTRATION_CODE="your-code"
```

---

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture and design
- [DEV_LOG.md](docs/DEV_LOG.md) - Development changelog
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide

---

## Future Enhancements

- Microsoft 365 / Entra ID SSO
- AI-powered search and auto-tagging
- Bulk operations and downloads
- Advanced filtering
- Media editing capabilities

---

## License

Private - Taylor Products Internal Use

---

## Support

For issues or questions, see the documentation in the `docs/` directory.
