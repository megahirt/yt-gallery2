# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube channel video fetcher using the YouTube Data API v3. Three standalone scripts form a pipeline:

1. `login.py` — One-time local OAuth browser flow, saves `token.json`
2. `fetch_videos.py` — Fetches all videos + playlists from the authenticated channel, writes `videos_full.json` and `playlists_full.json`
3. `make_simple_video_list.py` — Transforms raw API output into simplified `videos.json`

## Commands

```bash
uv sync                          # Install dependencies
uv run login.py                  # OAuth login (local only, opens browser)
uv run fetch_videos.py           # Fetch videos + playlists from YouTube API
uv run make_simple_video_list.py # Generate simplified videos.json
```

Uses `uv` for dependency management (Python 3.14). No test suite or linter configured.

## Architecture

- All scripts use `Path(__file__).parent` (`HERE`) to resolve file paths relative to the script location
- `fetch_videos.py` auto-refreshes expired OAuth tokens using the refresh token in `token.json`
- Playlist memberships use "Strategy B" — iterating per-playlist rather than per-video to minimize API quota usage
- YouTube API responses are paginated in batches of 50 (API maximum); all pagination loops follow the same `nextPageToken` pattern
- `videos.json` field mappings are documented in `MAPPINGS.md`

## Sensitive Files (gitignored)

`client_secret.json`, `token.json`, `videos_full.json`, `playlists_full.json`, `videos.json` — never commit these.

## CI

GitHub Actions workflow at `.github/workflows/fetch-videos.yml` reconstructs credential files from secrets (`YOUTUBE_TOKEN_JSON`, `YOUTUBE_CLIENT_SECRET_JSON`) and runs the fetch pipeline.
