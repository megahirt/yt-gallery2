# yt-gallery

Fetches all videos from your YouTube channel with full metadata, using the YouTube Data API v3. Designed to run locally for setup and in GitHub Actions for automation.

## How it works

| Script | Purpose |
|---|---|
| `login.py` | Run once locally — opens a browser for Google OAuth and saves `token.json` |
| `fetch_videos.py` | Fetches all your videos and playlists, writes `videos_full.json` and `playlists_full.json` |
| `make_simple_video_list.py` | Converts the raw output into a simplified `videos.json` |

---

## Data Structures

See [MAPPINGS.md](MAPPINGS.md) for full documentation of all generated JSON files, field mappings, and fields intentionally omitted.

---

## 1. Google Cloud Setup

### 1.1 Create a project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Give it a name (e.g. `yt-api-experiment`) and click **Create**
4. Make sure the new project is selected in the dropdown

### 1.2 Enable the YouTube Data API v3

1. In the left sidebar go to **APIs & Services → Library**
2. Search for **YouTube Data API v3**
3. Click it, then click **Enable**

### 1.3 Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in the required fields:
   - **App name** — anything you like (e.g. `yt-api-experiment`)
   - **User support email** — your email
   - **Developer contact information** — your email
4. Click **Save and Continue** through the Scopes and Test users screens (no changes needed)
5. On the **Test users** screen, click **Add users** and add your own Google account email
6. Click **Save and Continue**, then **Back to Dashboard**

> **Note:** While the app is in "Testing" mode, only users you add as test users can authenticate. That's fine — you only need to log in as yourself.

### 1.4 Create OAuth 2.0 credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Choose **Desktop app** as the application type
4. Give it a name (e.g. `yt-api-experiment-desktop`) → **Create**
5. Click **Download JSON** on the confirmation dialog (or use the download icon next to the credential later)
6. Save the downloaded file as **`client_secret.json`** in the root of this project (next to `login.py`)

> ⚠️ Keep `client_secret.json` out of version control — it's already in `.gitignore`.

---

## 2. Local Setup

### 2.1 Install dependencies

Requires [uv](https://docs.astral.sh/uv/getting-started/installation/).

```bash
uv sync
```

### 2.2 Log in (OAuth browser flow)

```bash
uv run login.py
```

This opens a browser window where you log in with your Google account and grant access. On success, `token.json` is written next to the script.

> ⚠️ Keep `token.json` out of version control — it's already in `.gitignore`.

### 2.3 Fetch your videos and playlists

```bash
uv run fetch_videos.py
```

This reads `token.json`, calls the YouTube API, and writes the raw API output to two files:

```
Fetching channel info...
Fetching video IDs...
Found 42 videos. Fetching metadata...
Wrote 42 videos to /path/to/videos_full.json
Fetching playlists...
Found 5 playlists. Fetching playlist memberships...
Wrote 5 playlists and 18 memberships to /path/to/playlists_full.json
```

### 2.4 Generate simplified video list

```bash
uv run make_simple_video_list.py
```

Reads `videos_full.json` and `playlists_full.json`, and writes the slimmed-down `videos.json`:

```
Simplified 42 videos → /path/to/videos.json
```

---

## 3. GitHub Actions Setup

The workflow in `.github/workflows/fetch-videos.yml` runs `fetch_videos.py` in CI without any browser interaction, by reconstructing the credential files from GitHub secrets.

### 3.1 Add secrets to your GitHub repo

Go to your repo on GitHub → **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|---|---|
| `YOUTUBE_TOKEN_JSON` | Paste the full contents of your local `token.json` |
| `YOUTUBE_CLIENT_SECRET_JSON` | Paste the full contents of your local `client_secret.json` |

### 3.2 Trigger the workflow

- **Manually:** Go to **Actions → Fetch YouTube Videos → Run workflow**
- **On a schedule:** The workflow runs daily at 04:00 UTC by default (edit the `cron` in the workflow file to change this)

### 3.3 Download the output

After the workflow completes, go to the run summary page and download the **`videos-json`** artifact — it contains `videos_full.json` and `playlists_full.json` with the raw API output.

### How the secrets are used

The workflow writes the secrets to files before running the script:

```yaml
- name: Write credentials from secrets
  run: |
    echo '${{ secrets.YOUTUBE_TOKEN_JSON }}' > token.json
    echo '${{ secrets.YOUTUBE_CLIENT_SECRET_JSON }}' > client_secret.json
```

The access token in `token.json` expires after 1 hour, but `fetch_videos.py` automatically refreshes it using the refresh token — no manual intervention needed.

---

## Files

```
.
├── login.py                          # Run locally to authenticate
├── fetch_videos.py                   # Fetches videos + playlists, writes *_full.json files
├── make_simple_video_list.py         # Converts raw output to simplified videos.json
├── pyproject.toml                    # uv project + dependencies
├── MAPPINGS.md                       # JSON field mapping reference
├── .github/
│   └── workflows/
│       └── fetch-videos.yml          # GitHub Actions workflow
├── client_secret.json                # ← you create this (gitignored)
├── token.json                        # ← generated by login.py (gitignored)
├── videos_full.json                  # ← generated by fetch_videos.py (gitignored)
├── playlists_full.json               # ← generated by fetch_videos.py (gitignored)
└── videos.json                       # ← generated by make_simple_video_list.py (gitignored)
```

## .gitignore

Make sure your `.gitignore` includes:

```
client_secret.json
token.json
videos_full.json
playlists_full.json
videos.json
.venv/
```
