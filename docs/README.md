# Global Backend

A centralized dashboard and API for managing Next.js frontend applications.

## Architecture

- **`apps/web`**: Next.js 15 application containing the Admin Dashboard UI and the backend API (Route Handlers).
- **`packages/sdk`**: The `@global-backend/next` SDK to connect frontend applications to this backend.

## Features
1. Automated Page Discovery & Auto-Sync
2. Centralized Global Layout Management
3. Dynamic Page Content Rendering
4. Dynamic Per-Page SEO & Metadata
5. JSON-LD Schema Markup Injection
6. Automated Dynamic XML Sitemap

## Quick Start
1. `npm install`
2. Configure `.env` with your `DATABASE_URL` and `JWT_SECRET`.
3. Run `npm run db:push` to sync the Prisma schema.
4. Run `npm run dev` to start the app on `http://localhost:3000`.
