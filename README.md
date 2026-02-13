# Smart Bookmarks

A modern, real-time bookmark manager built with Next.js 16, Supabase, and Tailwind CSS. Organize your bookmarks with tags, share collections publicly, and sync instantly across all your browser tabs.

## What is This?

Smart Bookmarks solves the problem of managing bookmarks across devices and sharing curated link collections with others. Unlike browser bookmarks that are locked to one browser, this app:

- **Syncs in real-time** across all open tabs and devices
- **Organizes with tags** instead of rigid folder hierarchies
- **Shares collections** via public links anyone can view
- **Works everywhere** through a web interface

## Features

### Core Features
- **Google OAuth Authentication** - Sign in securely with your Google account
- **Add Bookmarks with Auto-Title** - Paste a URL and the title is automatically fetched
- **Real-time Cross-Tab Sync** - Add a bookmark in one tab, see it instantly in another
- **Search** - Quickly find bookmarks by title or URL

### Organization
- **Tags with Custom Colors** - Create colored tags to categorize bookmarks
- **Filter by Tags** - Click a tag to filter bookmarks
- **Multi-tag Support** - Each bookmark can have multiple tags

### Sharing
- **Shareable Collections** - Create public collections of bookmarks
- **Unique Share Links** - Each collection gets a `/shared/[slug]` URL
- **Public View** - Anyone with the link can view (but not edit) your collection

### UI/UX
- **Dark/Light Theme** - Toggle between themes with persistence
- **Responsive Design** - Works on desktop and mobile
- **Favicon Display** - Shows website favicons for visual recognition
- **Clean, Modern UI** - Minimal design focused on usability

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

## Problems Encountered & Solutions

### 1. Real-time Not Syncing Across Tabs (Same Account)

**Problem:** When opening the app in two browser tabs with the same account, adding a bookmark in one tab didn't appear in the other tab, even though Supabase Realtime was configured.

**Root Cause:** Supabase Realtime relies on WebSocket connections, and sometimes events can be missed or delayed due to:
- Connection timing issues
- Channel subscription conflicts with duplicate naming
- RLS policies not being properly configured for Realtime

**Solution:** Implemented a dual-sync approach:
1. **BroadcastChannel API** - Native browser API for instant same-origin cross-tab communication
2. **Supabase Realtime** as backup for cross-device sync

```typescript
// When a bookmark is added, broadcast to other tabs immediately
const broadcastChannel = new BroadcastChannel('bookmarks-sync')
broadcastChannel.postMessage({
  type: 'BOOKMARK_CHANGED',
  userId,
  action: 'insert',
  bookmark: insertedBookmark
})
```

This ensures instant updates across tabs without network latency.

### 2. npm Naming Restrictions with Capital Letters

**Problem:** `create-next-app` failed because the folder name contained capital letters ("Abstrabit-OA").

**Solution:** Created the project in a subdirectory with a lowercase name, then moved files to the root folder.

### 3. Supabase Realtime Subscription Not Receiving Updates

**Problem:** Even with Realtime enabled, the subscription callback never fired.

**Solutions Applied:**
1. Added table to publication: `ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;`
2. Ensured RLS policies allow SELECT for the user's own data
3. Used unique channel names with timestamps to avoid conflicts: `bookmarks-realtime-${userId}-${Date.now()}`
4. Removed filter from subscription and filter client-side (RLS with filters can be problematic)

### 4. Auth State Mismatch Between Server and Client

**Problem:** Occasional hydration mismatches where server rendered "logged out" but client was logged in.

**Solution:** Used `@supabase/ssr` package with middleware that:
- Refreshes expired sessions automatically
- Syncs auth cookies between server and client
- Handles the callback flow properly

### 5. OAuth Redirect Failing on Production

**Problem:** Google OAuth worked locally but failed after Vercel deployment.

**Solution:** Updated URLs in multiple places:
- **Supabase Dashboard** → Site URL: `https://your-app.vercel.app`
- **Supabase Dashboard** → Redirect URLs: Added production callback URLs
- **Google Cloud Console** → Added production domain to authorized origins

### 6. Favicon Loading Errors

**Problem:** Some websites don't have favicons, causing image errors and broken UI.

**Solution:** Used error handling with fallback:
```tsx
<Image
  src={faviconUrl}
  onError={() => setFaviconError(true)}
  // ...
/>
{faviconError && <FallbackIcon />}
```

### 7. Title Auto-fetch Being Overwritten

**Problem:** When manually editing a bookmark title, fetching a new URL would overwrite the manual title.

**Solution:** Added a `titleManuallyEdited` state flag that prevents auto-fetch from overwriting user input.

### 8. Shared Collections Not Showing Bookmarks

**Problem:** When visiting a public shared collection link (`/shared/[slug]`), the collection loaded but the bookmarks inside were empty.

**Root Cause:** Row Level Security (RLS) on the `bookmarks` table only allowed users to view their own bookmarks. When an anonymous user viewed a public collection, the RLS policy blocked access to the bookmarks even though the collection was public.

**Solution:** Added a new RLS policy on the `bookmarks` table that allows viewing bookmarks if they belong to a public shared collection:

```sql
CREATE POLICY "Bookmarks in public collections are viewable"
  ON public.bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collection_bookmarks cb
      JOIN public.shared_collections sc ON sc.id = cb.collection_id
      WHERE cb.bookmark_id = id AND sc.is_public = true
    )
  );
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Google Cloud project for OAuth

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd smart-bookmark-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your Project URL and `anon` public key
3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
   ```

### 3. Create Database Schema

Run these SQL files in order in your Supabase SQL Editor:

1. `supabase/schema.sql` - Core bookmarks table
2. `supabase/tags-schema.sql` - Tags feature
3. `supabase/share-links-schema.sql` - Sharing feature

### 4. Enable Realtime

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Under "supabase_realtime" publication, ensure `bookmarks` table is listed
3. If not, run: `ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;`

### 5. Configure Google OAuth

#### In Google Cloud Console:
1. Create a new project at [console.cloud.google.com](https://console.cloud.google.com)
2. Go to **APIs & Services → Credentials**
3. Click **Create Credentials → OAuth client ID**
4. Select **Web application**
5. Add Authorized redirect URI: `https://<your-project-id>.supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret

#### In Supabase Dashboard:
1. Go to **Authentication → Providers → Google**
2. Enable Google provider
3. Paste the Client ID and Client Secret
4. Set Site URL to `http://localhost:3000`

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── callback/route.ts       # OAuth callback
│   ├── (protected)/
│   │   └── dashboard/page.tsx      # Main bookmarks view
│   ├── api/
│   │   ├── auth/google/route.ts    # Google auth endpoint
│   │   └── fetch-title/route.ts    # URL title fetcher
│   ├── shared/[slug]/page.tsx      # Public collection view
│   ├── layout.tsx
│   └── page.tsx                    # Landing page
├── components/
│   ├── auth/                       # Auth components
│   ├── bookmarks/                  # Bookmark CRUD components
│   ├── share/                      # Sharing components
│   ├── tags/                       # Tag components
│   └── theme/                      # Theme toggle
├── lib/
│   ├── hooks/
│   │   ├── useBookmarks.ts         # Real-time bookmark hook
│   │   └── useTags.ts              # Tags hook
│   └── supabase/
│       ├── client.ts               # Browser client
│       └── server.ts               # Server client
├── types/
│   └── database.types.ts           # TypeScript types
└── middleware.ts                   # Auth middleware
```

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Post-Deployment

Update these URLs:

**Supabase Dashboard (Authentication → URL Configuration):**
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/callback`

**Google Cloud Console:**
- Add production domain to Authorized JavaScript origins
- Add production callback to Authorized redirect URIs

## License

MIT
