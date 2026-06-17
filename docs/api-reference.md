# API Reference

All backend functionality is exposed via Next.js Route Handlers.

## Authentication Endpoints

### `POST /api/auth/login`
- **Desc:** Logs a user in and sets a JWT cookie
- **Body:** `{ email, password }`
- **Auth:** Public

### `GET /api/auth/me`
- **Desc:** Returns the currently authenticated user
- **Auth:** JWT Cookie

## SDK Endpoints (Require `x-api-key` header)

### `POST /api/sync/pages`
- **Desc:** Submits a manifest of discovered Next.js routes
- **Body:** `{ routes: [{ slug, isDynamic }] }`

### `GET /api/pages/[slug]`
- **Desc:** Fetch content blocks for a specific page slug

### `GET /api/seo/[slug]`
- **Desc:** Fetch SEO metadata for a specific page slug

### `GET /api/global-settings`
- **Desc:** Fetch header, footer, and analytics config

### `GET /api/sitemap`
- **Desc:** Returns array of published pages for XML sitemap generation
