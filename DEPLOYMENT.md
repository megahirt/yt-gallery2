# Deployment

## How deployment works

The gallery is deployed as a static site to **GitHub Pages** via the `deploy.yml` workflow.

### Automatic triggers

The deploy workflow runs automatically when:

1. **Code is pushed to `main`** — rebuilds and redeploys the site
2. **The `Fetch YouTube Videos` workflow completes successfully** — redeploys with fresh video data

This means video metadata updates are deployed without any manual intervention once the fetch workflow runs (daily at 04:00 UTC or via manual trigger).

### What the workflow does

1. Checks out the repo
2. Installs Node.js dependencies in `gallery/`
3. Downloads the latest `videos-json` artifact from the most recent fetch workflow run (falls back to an empty `[]` if no artifact exists yet)
4. Builds the SvelteKit static site
5. Deploys the build output to GitHub Pages

---

## First-time setup

### 1. Enable GitHub Pages

1. Go to **Settings → Pages** in your GitHub repo
2. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")

### 2. Run the fetch workflow

The site won't show any videos until the fetch workflow has produced a `videos-json` artifact:

1. Go to **Actions → Fetch YouTube Videos → Run workflow**
2. Once it completes, the deploy workflow triggers automatically

### 3. Access the site

After the deploy workflow completes, the site is available at:

**https://megahirt.github.io/yt-gallery/**

To use a custom domain (e.g. `videos.hirtfamily.net`), configure it in **Settings → Pages → Custom domain**.

---

## Refreshing video data

Two options:

- **Automatic:** The fetch workflow runs daily at 04:00 UTC via its cron schedule
- **Manual:** Go to **Actions → Fetch YouTube Videos → Run workflow**, or use the "Refresh Video Data" button on the `/admin` page (links to the same Actions page)

After the fetch completes, the deploy workflow picks up the new `videos-json` artifact and redeploys.
