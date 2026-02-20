# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family video gallery: a YouTube channel video fetcher (Python) + a static gallery UI (SvelteKit).

### Repo Structure

- `fetch/` — Python scripts for YouTube Data API v3
- `gallery/` — SvelteKit static site (Skeleton UI v4 + Tailwind CSS v4)
- `.github/workflows/` — CI/CD (fetch-videos.yml, deploy.yml)

## Commands

### Fetch pipeline (Python)

```bash
cd fetch
uv sync                          # Install dependencies
uv run login.py                  # OAuth login (local only, opens browser)
uv run fetch_videos.py           # Fetch videos + playlists from YouTube API
uv run make_simple_video_list.py # Generate simplified videos.json
```

### Gallery (SvelteKit)

```bash
cd gallery
npm install                      # Install dependencies
npm run dev                      # Dev server (http://localhost:5173)
npm run build                    # Static build → gallery/build/
npm run preview                  # Preview production build
```

Uses `uv` for Python (3.14) and `npm` for the gallery.

## Architecture

### Fetch Pipeline

- All scripts use `Path(__file__).parent` (`HERE`) to resolve file paths relative to the script location
- `fetch_videos.py` auto-refreshes expired OAuth tokens using the refresh token in `token.json`
- Playlist memberships use "Strategy B" — iterating per-playlist rather than per-video to minimize API quota usage
- YouTube API responses are paginated in batches of 50 (API maximum); all pagination loops follow the same `nextPageToken` pattern
- `videos.json` field mappings are documented in `MAPPINGS.md`

### Gallery

- SvelteKit with `adapter-static` — builds to pure static files
- Skeleton UI v4 with Cerberus theme (`data-theme="cerberus"` on `<html>`)
- `ssr = false` + `prerender = true` — client-side SPA that fetches `/videos.json` at runtime
- Videos loaded via `fetch('/videos.json', { cache: 'no-store' })` on page load
- Search filters across title, description, tags, and playlist names
- Playlist filter buttons extracted from video data

### CI/CD

- **fetch-videos.yml**: Runs daily + manual trigger. Fetches from YouTube API, uploads `videos-json` artifact.
- **deploy.yml**: Triggered on push to main OR after successful fetch workflow. Downloads latest `videos-json` artifact, builds gallery, deploys to GitHub Pages.

## Sensitive Files (gitignored)

`client_secret.json`, `token.json`, `videos_full.json`, `playlists_full.json`, `videos.json` — never commit these.
`gallery/static/videos.json` — local dev sample, also gitignored.
