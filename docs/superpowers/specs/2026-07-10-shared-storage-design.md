# Shared Storage Design

## Goal

Make every user-created or user-updated business record consistent across Chrome, Edge, and mobile.

## Current Problem

The app stores mutable data directly in browser `localStorage`. Each browser has its own storage area, so updates made in Chrome do not appear in Edge or mobile. GitHub and Vercel only deploy the app files; they do not persist runtime edits.

## Storage Boundary

Create a single storage layer named `AppStorage`. Views and `DataStore` call this layer instead of calling `localStorage` directly for shared business data.

Shared data:
- Action status values
- Weekly upload checklist checks
- SKU favorites
- Offline sourcing visit logs
- Future notes, routines, links, and user-added records

Local-only preferences:
- Last opened view
- Sidebar collapsed state

## Remote Store

Use Supabase as the remote shared store. The first implementation uses one key-value table so the current static app can synchronize without a larger backend migration.

Table:

```sql
create table if not exists public.app_state (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
```

The app reads known shared keys on startup, keeps them in memory, writes through to local fallback storage, and writes to Supabase when configured.

## Fallback Behavior

If Supabase config is missing or the network write fails, the app still works with local fallback storage. This keeps the dashboard usable while remote credentials are being added or while offline.

## Configuration

Add `js/storage-config.js` with a public Supabase URL and anon key later. Until those values are present, the app uses local fallback only.

## Success Criteria

- No shared business data path calls `localStorage` directly from `DataStore`.
- Shared data uses `AppStorage` cache plus fallback persistence.
- Static tests verify remote load, local fallback, action states, checklists, favorites, and visit logs.
- Existing dashboard static checks still pass.
