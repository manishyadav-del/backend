# Global Backend — Unified Next.js Architecture (JavaScript)

## Overview

Build a **single Next.js 15 application** that serves as both the **admin dashboard** (UI pages) and the **backend API** (Route Handlers under `app/api/`). This eliminates the need for a separate Express server — Next.js handles everything. The SDK package connects external Next.js frontends to this central system.

---

## Why Next.js for Backend?

| Benefit | Detail |
|---------|--------|
| **Unified codebase** | Dashboard UI + API in one app, no CORS issues |
| **Route Handlers** | Native `app/api/` routes replace Express entirely |
| **Server Components** | Dashboard pages can fetch DB directly — no API round-trip for admin views |
| **Built-in middleware** | `middleware.js` handles auth, redirects, and API key validation |
| **Single deployment** | One Vercel/Railway/VPS deployment instead of two |
| **Shared Prisma** | Both UI and API share the same Prisma client instance |

---

## Monorepo Structure (Turborepo)

```
gobal-backend/
├── turbo.json
├── package.json                     # Root workspace config
├── .env.example
├── .gitignore
│
├── apps/
│   └── web/                         # Next.js 15 — Dashboard + API
│       ├── package.json
│       ├── jsconfig.json
│       ├── next.config.mjs
│       ├── middleware.js             # Auth guard (JWT + API key routing)
│       ├── prisma/
│       │   └── schema.prisma        # Database schema
│       └── src/
│           ├── app/
│           │   ├── layout.jsx               # Root layout
│           │   ├── page.jsx                 # Landing → redirect to dashboard
│           │   ├── globals.css              # Design system tokens
│           │   │
│           │   ├── (auth)/                  # Auth pages (unprotected)
│           │   │   ├── login/page.jsx
│           │   │   └── layout.jsx
│           │   │
│           │   ├── (dashboard)/             # Admin dashboard (JWT protected)
│           │   │   ├── layout.jsx           # Sidebar + Topbar shell
│           │   │   ├── page.jsx             # Dashboard overview
│           │   │   ├── projects/
│           │   │   │   ├── page.jsx                 # List all projects
│           │   │   │   └── [projectId]/
│           │   │   │       ├── page.jsx             # Project overview
│           │   │   │       ├── pages/
│           │   │   │       │   ├── page.jsx         # All synced pages
│           │   │   │       │   └── [pageId]/
│           │   │   │       │       └── page.jsx     # Page editor
│           │   │   │       ├── global-settings/
│           │   │   │       │   └── page.jsx         # Header/Footer/Analytics
│           │   │   │       └── sitemap/
│           │   │   │           └── page.jsx         # Sitemap preview
│           │   │
│           │   └── api/                     # ← ALL BACKEND API ROUTES
│           │       ├── auth/
│           │       │   ├── login/route.js           # POST — login, returns JWT
│           │       │   └── me/route.js              # GET — current user
│           │       ├── projects/
│           │       │   ├── route.js                 # GET (list) / POST (create)
│           │       │   └── [id]/
│           │       │       ├── route.js             # GET / PUT / DELETE
│           │       │       └── regenerate-key/
│           │       │           └── route.js         # POST — new API key
│           │       ├── sync/
│           │       │   ├── pages/route.js           # POST — receive manifest
│           │       │   └── status/route.js          # GET — sync status
│           │       ├── pages/
│           │       │   ├── route.js                 # GET — list pages
│           │       │   └── [slug]/route.js          # GET — page content + SEO
│           │       ├── pages-by-id/
│           │       │   └── [id]/route.js            # PUT / DELETE — update/archive
│           │       ├── global-settings/
│           │       │   └── route.js                 # GET / PUT
│           │       ├── seo/
│           │       │   ├── [slug]/route.js          # GET — SEO for page
│           │       │   └── [id]/route.js            # PUT — update SEO
│           │       └── sitemap/
│           │           └── route.js                 # GET — published pages list
│           │
│           ├── components/
│           │   ├── ui/                      # Design system primitives
│           │   │   ├── Button.jsx
│           │   │   ├── Input.jsx
│           │   │   ├── Card.jsx
│           │   │   ├── Badge.jsx
│           │   │   ├── Modal.jsx
│           │   │   ├── Table.jsx
│           │   │   ├── Sidebar.jsx
│           │   │   ├── Topbar.jsx
│           │   │   └── Toast.jsx
│           │   ├── pages/                   # Page management components
│           │   │   ├── PageEditor.jsx
│           │   │   ├── SeoForm.jsx
│           │   │   ├── ContentBlockEditor.jsx
│           │   │   └── SchemaEditor.jsx
│           │   ├── settings/               # Global settings components
│           │   │   ├── HeaderBuilder.jsx
│           │   │   ├── FooterBuilder.jsx
│           │   │   └── AnalyticsConfig.jsx
│           │   └── projects/               # Project components
│           │       ├── ProjectCard.jsx
│           │       └── SyncStatus.jsx
│           │
│           ├── lib/
│           │   ├── prisma.js               # Singleton Prisma client
│           │   ├── auth.js                 # JWT sign/verify helpers
│           │   ├── apiKey.js               # API key validation helper
│           │   └── constants.js
│           │
│           ├── hooks/
│           │   ├── usePages.js
│           │   ├── useProject.js
│           │   └── useGlobalSettings.js
│           │
│           └── context/
│               └── AppContext.js
│
├── packages/
│   └── sdk/                             # @global-backend/next SDK
│       ├── package.json
│       └── src/
│           ├── index.js                 # Public API exports
│           ├── client.js                # GlobalBackendClient class
│           ├── sync.js                  # Route scanner + manifest sender
│           ├── hooks/
│           │   ├── usePageContent.js
│           │   └── useGlobalSettings.js
│           └── components/
│               ├── GlobalBackendProvider.jsx
│               ├── DynamicRenderer.jsx
│               └── SchemaScript.jsx
│
└── docs/
    ├── README.md
    ├── api-reference.md
    └── sdk-guide.md
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Monorepo** | Turborepo | Fast builds, shared configs, workspace management |
| **App (API + UI)** | Next.js 15 (App Router, JavaScript) | Unified backend + dashboard in one app |
| **ORM** | Prisma | Auto-generated client, migrations, introspection |
| **Database** | SQL | Relational data with JSON column support |
| **Styling** | Vanilla CSS (custom design system) | Full control, no framework dependency |
| **SDK** | JavaScript library | Lightweight, framework-agnostic core |
| **Auth** | API Key + JWT | API keys for SDK, JWT for dashboard sessions |

---

## Database Schema (Prisma)

```prisma
model Project {
  id            String          @id @default(cuid())
  name          String
  slug          String          @unique
  domain        String?
  apiKey        String          @unique @default(cuid())
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  pages          Page[]
  globalSettings GlobalSettings?
}

model Page {
  id            String      @id @default(cuid())
  projectId     String
  project       Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  slug          String               // e.g. "/about", "/blog/[slug]"
  title         String      @default("Untitled")
  status        PageStatus  @default(DRAFT)
  isDynamic     Boolean     @default(false)

  // SEO fields
  metaTitle     String?
  metaDesc      String?
  canonicalUrl  String?
  ogImage       String?
  jsonLdSchema  Json?                // Raw JSON-LD object

  // Content blocks
  contentBlocks Json?                // Array of layout blocks

  lastSyncedAt  DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([projectId, slug])
}

model GlobalSettings {
  id            String   @id @default(cuid())
  projectId     String   @unique
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Header config
  headerConfig  Json?    // { logo, navLinks[], sticky, style }

  // Footer config
  footerConfig  Json?    // { columns[], copyright, socialLinks[] }

  // Analytics
  gaTrackingId       String?
  clarityTrackingId  String?
  customHeadScripts  String?    // Raw HTML/script tags

  // General
  siteName      String?
  favicon       String?
  primaryColor  String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum PageStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## API Route Handlers (Next.js `app/api/`)

All API logic lives inside Next.js Route Handlers. Each `route.js` file exports named functions matching HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).

### How it works (example)

```javascript
// app/api/pages/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/apiKey';

export async function GET(request) {
  const project = await validateApiKey(request);
  if (!project) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pages = await prisma.page.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ pages });
}
```

### Authentication Flow

| Route Pattern | Auth Method | How |
|--------------|-------------|-----|
| `/api/sync/*` | API Key | `x-api-key` header → lookup `Project.apiKey` |
| `/api/pages/*` (GET) | API Key | Same as above |
| `/api/global-settings` (GET) | API Key | Same as above |
| `/api/sitemap` | API Key | Same as above |
| `/api/pages-by-id/*` (PUT/DELETE) | JWT | `Authorization: Bearer <token>` |
| `/api/projects/*` | JWT | Same as above |
| `/api/auth/*` | Public | No auth needed |
| `(dashboard)/*` pages | JWT Cookie | `middleware.js` redirects to login |

### Middleware (`middleware.js`)

```javascript
// middleware.js — runs on every request
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes — check for JWT cookie
  if (pathname.startsWith('/projects') || pathname === '/') {
    const token = request.cookies.get('auth-token');
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
```

### Endpoints Map

| Method | Route Handler Path | Description | Auth |
|--------|-------------------|-------------|------|
| **Auth** | | | |
| `POST` | `api/auth/login/route.js` | Login, returns JWT | Public |
| `GET` | `api/auth/me/route.js` | Get current user | JWT |
| **Sync** | | | |
| `POST` | `api/sync/pages/route.js` | Receive route manifest from SDK | API Key |
| `GET` | `api/sync/status/route.js` | Sync timestamp & page count | API Key |
| **Pages** | | | |
| `GET` | `api/pages/route.js` | List all pages for a project | API Key / JWT |
| `GET` | `api/pages/[slug]/route.js` | Page content + SEO payload | API Key |
| `PUT` | `api/pages-by-id/[id]/route.js` | Update page content/SEO/status | JWT |
| `DELETE` | `api/pages-by-id/[id]/route.js` | Archive a page | JWT |
| **Global Settings** | | | |
| `GET/PUT` | `api/global-settings/route.js` | Fetch or update global config | API Key (GET) / JWT (PUT) |
| **SEO** | | | |
| `GET` | `api/seo/[slug]/route.js` | SEO metadata for a page | API Key |
| **Sitemap** | | | |
| `GET` | `api/sitemap/route.js` | Published pages array | API Key |
| **Projects** | | | |
| `GET/POST` | `api/projects/route.js` | List / create projects | JWT |
| `GET/PUT/DELETE` | `api/projects/[id]/route.js` | Project CRUD | JWT |
| `POST` | `api/projects/[id]/regenerate-key/route.js` | New API key | JWT |

---

## Feature Module Mapping

### 1. Automated Page Discovery & Auto-Sync

**SDK Side** (`packages/sdk/src/sync.js`):
- Scans the Next.js `app/` directory recursively
- Builds a JSON manifest of all routes with metadata (dynamic/static, route params)
- Sends manifest via `POST /api/sync/pages`
- Triggered via CLI command: `npx global-backend sync` or as a `postbuild` hook

**API Side** (`api/sync/pages/route.js`):
- Receives the manifest
- Upserts pages — new routes get `DRAFT` status, existing routes are updated
- Removes pages that no longer exist in the manifest (marks as `ARCHIVED`)
- Stores `lastSyncedAt` timestamp

### 2. Centralized Global Layout Management

**API Side** (`api/global-settings/route.js`):
- `GET` returns the full config object (header, footer, analytics)
- `PUT` updates header/footer/analytics configuration

**Dashboard** (`(dashboard)/projects/[projectId]/global-settings/page.jsx`):
- **Header Builder**: Visual editor for logo, nav links, sticky behavior
- **Footer Builder**: Column-based editor with social links
- **Analytics Config**: Input fields for GA ID, Clarity ID, custom scripts

### 3. Dynamic Page Content Rendering

**API Side** (`api/pages/[slug]/route.js`):
- Returns `contentBlocks` JSON array for the requested slug
- Each block has a `type` (hero, text, image, cta, banner, gallery) and `props`

**SDK Side** (`components/DynamicRenderer.jsx`):
- Maps block types to React components
- Renders the page dynamically from the JSON payload

### 4. Dynamic Per-Page SEO & Metadata

**API Side** (`api/seo/[slug]/route.js`):
- Returns `metaTitle`, `metaDesc`, `canonicalUrl`, `ogImage` for a given slug

**SDK Side** (consumed in `app/[...slug]/page.jsx`):
- Maps backend SEO response to Next.js `generateMetadata()` API

### 5. JSON-LD Schema Markup Injection

**Dashboard** (`SchemaEditor.jsx`):
- Raw JSON editor with validation for JSON-LD input

**SDK Side** (`components/SchemaScript.jsx`):
- Renders `<script type="application/ld+json">` with the schema data

### 6. Automated Dynamic XML Sitemap

**API Side** (`api/sitemap/route.js`):
- Returns all `PUBLISHED` pages with `slug`, `updatedAt`, `domain`

**SDK Side** (consumed in `sitemap.js`):
- Next.js `sitemap.js` fetches from the backend and returns structured sitemap

### 7. SDK / NPM Wrapper Package

**Package** (`packages/sdk/`):
- `GlobalBackendClient` class for API communication
- `sync()` function for route scanning
- React components: `DynamicRenderer`, `SchemaScript`, `GlobalBackendProvider`
- React hooks: `usePageContent`, `useGlobalSettings`
- JSDoc annotations for IDE autocompletion (no TypeScript needed)

---

## Execution Phases

### Phase 1: Foundation (Completed)
- [x] Scaffold Turborepo monorepo with root `package.json` + `turbo.json`
- [x] Initialize `apps/web` with Next.js 15 (JavaScript, App Router)
- [x] Set up Prisma with schema + singleton client
- [x] Create all API route handler files (skeleton with TODO comments)
- [x] Create all dashboard page files (placeholder UI)
- [x] Create all component files (empty exports)
- [x] Create `middleware.js` skeleton
- [x] Create lib helpers (`prisma.js`, `auth.js`, `apiKey.js`)
- [x] Initialize `packages/sdk` structure
- [x] Create `docs/` with README

### Phase 2: Backend API Implementation (Completed)
- [x] Implement auth (login + JWT + API key validation)
- [x] Implement sync endpoint (page discovery & upsert)
- [x] Implement pages CRUD
- [x] Implement global settings CRUD
- [x] Implement SEO endpoints
- [x] Implement sitemap endpoint
- [x] Implement project management

### Phase 3: Dashboard Integration & UI Polish (Current Step)
- [x] Build design system (CSS tokens + UI primitives)
- [x] Build design system (CSS tokens + UI primitives)
- [x] Build sidebar navigation + dashboard layout
- [x] Build project list/detail views
- [x] Build page list + page editor (content blocks, SEO, schema)
- [x] Build global settings editors (header, footer, analytics)
- [x] Build sitemap preview

### Phase 4: SDK Development
- [ ] Build API client class
- [ ] Build route scanner / sync script
- [ ] Build React components (DynamicRenderer, SchemaScript)
- [ ] Build React hooks
- [ ] Build CLI tool for sync

### Phase 5: Integration & Testing
- [ ] End-to-end sync flow test
- [ ] Dashboard ↔ API integration
- [ ] SDK ↔ API integration
- [ ] Documentation

---

## User Review Required

> [!IMPORTANT]
> **Implementation Scope**: The underlying API endpoints and database schemas for all requested features (Admin Access, Blogs, Media Library, Testimonials, SEO, etc.) have already been successfully scaffolded! The next massive phase is building the **Dashboard UI Pages** for each of these features.

> [!WARNING]
> Building the complete Dashboard UI for over 25 distinct modules is a substantial task. To ensure high quality and beautiful aesthetics as requested, I will break this down into smaller, focused tasks using a `task.md` file after you approve this plan.

## Proposed Dashboard UI Architecture

We will implement the following UI modules inside `apps/web/src/app/(dashboard)/projects/[projectId]/`. Each module will consist of a list view (table/grid) and detail/edit views with modern styling, micro-animations, and dynamic interactions.

### 1. Content & Pages
- **Page Management**: Edit Sections, Content, Add/Remove Sections, Banners, Draft/Publish.
- **Service Management**: Add/Edit/Delete Service, Upload Images, FAQs, Sort Order.
- **Blog / Resources**: Add/Edit/Delete Blog, Categories, Author, Draft/Publish, Schedule, SEO.
- **Testimonials**: Add/Edit/Delete, Client Name, Image, Rating, Sort Order.
- **FAQ Management**: Add/Edit/Delete, Assign to Page, Sort Order, Schema.
- **Team Section**: Add/Edit/Delete Member, Photo, Bio, Social Links.
- **Legal Pages**: Privacy Policy, Terms, Cookie Policy, Disclaimer.

### 2. Marketing & SEO
- **SEO Management**: SEO Title, Meta Desc, URL Slug, Canonical, OG Image, Robots.txt, Schema.
- **Analytics & Tracking**: GA, Tag Manager, Clarity, Meta Pixel, LinkedIn Tag.
- **CTA / Lead Capture**: Edit Text/Link, Popups, Newsletter, Lead Magnets.
- **Lead Management**: Contact Info, Service Interest, Source Page, Status, Export.
- **Live Visitor Dashboard**: Live Visitors, Pages Viewed, Location, Device Info.

### 3. Media & Assets
- **Media Library**: Upload/Replace/Delete, Alt Text, Compress Images, Folder Management.

### 4. Settings & Configuration
- **Contact Details**: Phone, Email, Office Address, WhatsApp, Google Maps, Business Hours.
- **Contact Forms**: View Submissions, Change Email, Auto Reply, Spam Protection.
- **Website Settings**: Logo, Favicon, Brand Colors, Header/Footer Settings, Maintenance Mode.
- **Header Builder**: Logo Control, Menu Selection, CTA Button, Sticky Toggle, Multi Layouts.
- **Footer Builder**: Layout, Columns, Quick Links, Newsletter Form.
- **Navigation / Menus**: Main Menu, Footer Menu, Reorder, Dropdowns.
- **Email Settings**: SMTP Setup, Auto Reply Template, Admin Alerts.

### 5. System & Admin
- **Admin Access & Roles**: Add/Remove Users, Assign Roles, 2FA, Activity Log, Login History (Already partially done in `(dashboard)/users`).
- **Security Controls**: Rate Limiting Config, Session Timeout, Audit Logs, IP Blocking.
- **Backup & Restore**: Database Backup, Media Backup, Manual Download.
- **Performance**: Lazy Loading config, Error Logs.
- **404 & Redirects**: Custom 404, 301/302 Redirects, URL Mapping.
- **Compliance**: Cookie Consent, Privacy Acceptance, Data Deletion.
- **Notifications**: Dashboard Alerts, New Lead Alerts.
- **Dev/Admin Tools**: API Keys, Integration Keys, Env Settings.

## Verification Plan

### Manual UI Verification
1. I will implement a responsive, premium sidebar navigation to access all these modules.
2. I will implement the UI for a batch of features, verify they connect to the scaffolded API routes correctly.
3. I will provide a Walkthrough artifact for you to review the UI implementation in stages, ensuring the design aesthetics (vibrant colors, glassmorphism, dynamic animations) meet your standard of excellence.

