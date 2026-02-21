Family Video Gallery – Project Specification & Decisions Summary

Project Overview

This project is a private family-friendly video gallery that displays unlisted YouTube videos from the owner's channel.
It will:
	•	Provide a clean, kid-friendly interface for browsing videos
	•	Allow search, filtering, and browsing by playlist/facets
	•	Include an /admin area for owner-only features like:
	•	Links to edit videos in YouTube Studio
	•	A button to refresh video metadata from YouTube
	•	Be hosted as a static site on GitHub Pages
	•	Fetch its video metadata at runtime from a JSON file

No backend server is required—only static assets + an optional serverless hook to trigger GitHub Actions.

⸻

Repository Structure

```
yt-gallery/
├── fetch/                    # Python fetch pipeline
│   ├── login.py              # OAuth login (local only)
│   ├── fetch_videos.py       # Fetch from YouTube API
│   ├── make_simple_video_list.py  # Generate simplified videos.json
│   ├── pyproject.toml
│   └── uv.lock
├── gallery/                  # SvelteKit static site
│   ├── src/
│   │   ├── lib/
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── VideoCard.svelte
│   │   │       ├── SearchBar.svelte
│   │   │       └── PlaylistFilter.svelte
│   │   └── routes/
│   │       ├── +layout.svelte
│   │       ├── +layout.ts
│   │       ├── +page.svelte       # Main gallery
│   │       └── admin/
│   │           └── +page.svelte   # Admin page
│   ├── static/
│   │   └── videos.json       # (gitignored, placed by CI or local dev)
│   ├── svelte.config.js
│   └── package.json
├── .github/workflows/
│   ├── fetch-videos.yml      # Fetch pipeline (daily + manual)
│   └── deploy.yml            # Build & deploy to GitHub Pages
├── CLAUDE.md
├── MAPPINGS.md
└── PROJECT-SPEC.md
```

⸻

1. Technology Stack Decisions

1.1 Framework Choice

Chosen: SvelteKit
Reasoning:
	•	SvelteKit provides excellent support for static builds (via adapter-static).
	•	The project requires rich client-side interactivity (search, filters, facets, admin interactions).
	•	Skeleton UI integrates naturally with Svelte + Tailwind.
	•	Svelte is easy to learn and expressive for UI state management.

⸻

1.2 UI Library

Chosen: Skeleton UI v4 (with Tailwind CSS v4)

Reasons:
	•	Provides polished Svelte-native UI components (buttons, inputs, cards, drawers, app shell).
	•	Still allows Tailwind utility classes for layout.
	•	Modern look and feel, designed for SvelteKit.
	•	Uses Cerberus theme.

⸻

1.3 Hosting

Chosen: GitHub Pages
	•	Site will be built as static via SvelteKit + adapter-static.
	•	Deployed automatically by GitHub Actions.
	•	Can support a custom domain (e.g., videos.hirtfamily.net).

⸻

2. Data Architecture Decisions

2.1 Video Metadata Source
	•	A single JSON file videos.json will represent all video metadata.
	•	The site fetches this JSON at runtime (NOT imported at build time).
	•	This enables updating the data without rebuilding the entire application.

Path (final): `/videos.json` — placed in SvelteKit's `static/` directory by CI.

⸻

2.2 Updating the JSON Data

Workflow Summary:
	1.	**fetch-videos.yml** workflow:
	•	Runs Python scripts in `fetch/` to call the YouTube Data API
	•	Generates simplified `videos.json`
	•	Uploads as `videos-json` artifact
	2.	**deploy.yml** workflow:
	•	Triggered on push to main OR after successful fetch workflow
	•	Downloads latest `videos-json` artifact
	•	Builds SvelteKit app and deploys to GitHub Pages

⸻

2.3 Admin-Side Triggering of Data Refresh

Mode A (implemented): /admin page provides a button linking directly to the GitHub Actions "Run workflow" page.

Mode B (future): A serverless endpoint holding a GitHub PAT for true one-click refresh via repository_dispatch.

⸻

3. Application Architecture

3.1 Routing

Public Pages
	•	/ – Main gallery viewer with search, playlist filters, and responsive video card grid

Admin Pages
	•	/admin – Video table with "Edit in YouTube Studio" links + button to GHA manual trigger page

Note: No authentication required (owner-only URL by obscurity).

⸻

3.2 Data Flow
	1.	User loads the app.
	2.	SvelteKit runtime executes: `fetch('/videos.json', { cache: 'no-store' })`
	3.	Data is stored in component state.
	4.	UI filters (text search, playlist facets) filter the array in memory.
	5.	Clicking a video opens the YouTube URL in a new tab.
	6.	In /admin, each row includes an edit link to YouTube Studio.

⸻

4. UI / UX Decisions

4.1 General Look & Feel
	•	Skeleton UI v4 with Cerberus dark theme
	•	Video display as cards in a responsive grid (1-4 columns)
	•	Clean, kid-friendly navigation

4.2 Filters & Search

Search: Free-text search across title, description, tags, playlist names.
Playlist Filter: Toggle buttons for each playlist, extracted from video data.
All filters run client-side on the JSON data.

4.3 Video Card Structure

Each card displays: thumbnail, title, date, playlist badges.
Click opens YouTube in a new tab.

⸻

5. Future Extensions (Not Yet Implemented)
	•	Watch history locally in browser
	•	User favorites/tagging (localStorage)
	•	Date range filtering
	•	Embedded YouTube player
	•	One-click refresh via serverless endpoint (Mode B)
