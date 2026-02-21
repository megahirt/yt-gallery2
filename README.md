# yt-gallery

A private family video gallery that displays YouTube videos in a clean, browsable interface. Built with SvelteKit + Skeleton UI, deployed to GitHub Pages, with video metadata fetched from the YouTube Data API v3.

## Repository structure

```
├── fetch/                        # Python fetch pipeline
│   ├── login.py                  # One-time OAuth login (local only)
│   ├── fetch_videos.py           # Fetch videos + playlists from YouTube API
│   ├── make_simple_video_list.py # Generate simplified videos.json
│   └── pyproject.toml
├── gallery/                      # SvelteKit static site
│   ├── src/
│   │   ├── routes/               # Pages (/, /admin)
│   │   └── lib/                  # Components, types
│   └── static/
├── .github/workflows/
│   ├── fetch-videos.yml          # Fetch pipeline (daily + manual)
│   └── deploy.yml                # Build & deploy to GitHub Pages
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for setup, deployment details, and how to access the site.

## Data structures

See [MAPPINGS.md](MAPPINGS.md) for full documentation of all generated JSON files and field mappings.

---

## Fetch pipeline setup

### 1. Google Cloud Setup

#### 1.1 Create a project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Give it a name (e.g. `yt-api-experiment`) and click **Create**
4. Make sure the new project is selected in the dropdown

#### 1.2 Enable the YouTube Data API v3

1. In the left sidebar go to **APIs & Services → Library**
2. Search for **YouTube Data API v3**
3. Click it, then click **Enable**

#### 1.3 Configure the OAuth consent screen

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

#### 1.4 Create OAuth 2.0 credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Choose **Desktop app** as the application type
4. Give it a name (e.g. `yt-api-experiment-desktop`) → **Create**
5. Click **Download JSON** on the confirmation dialog (or use the download icon next to the credential later)
6. Save the downloaded file as **`client_secret.json`** in the `fetch/` directory

> ⚠️ Keep `client_secret.json` out of version control — it's already in `.gitignore`.

---

### 2. Local usage

Requires [uv](https://docs.astral.sh/uv/getting-started/installation/).

```bash
cd fetch
uv sync                          # Install dependencies
uv run login.py                  # OAuth login (opens browser, saves token.json)
uv run fetch_videos.py           # Fetch videos + playlists from YouTube API
uv run make_simple_video_list.py # Generate simplified videos.json
```

---

### 3. GitHub Actions setup

The workflow in `.github/workflows/fetch-videos.yml` runs the fetch pipeline in CI by reconstructing credential files from GitHub secrets.

#### 3.1 Add secrets to your GitHub repo

Go to your repo on GitHub → **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|---|---|
| `YOUTUBE_TOKEN_JSON` | Paste the full contents of your local `fetch/token.json` |
| `YOUTUBE_CLIENT_SECRET_JSON` | Paste the full contents of your local `fetch/client_secret.json` |

#### 3.2 Trigger the workflow

- **Manually:** Go to **Actions → Fetch YouTube Videos → Run workflow**
- **On a schedule:** The workflow runs daily at 04:00 UTC by default (edit the `cron` in the workflow file to change this)

The access token in `token.json` expires after 1 hour, but `fetch_videos.py` automatically refreshes it using the refresh token — no manual intervention needed.

---

## Gallery local development

```bash
cd gallery
npm install                      # Install dependencies
npm run dev                      # Dev server at http://localhost:5173
npm run build                    # Static build → gallery/build/
```

Place a `videos.json` file in `gallery/static/` for local development (this file is gitignored).
