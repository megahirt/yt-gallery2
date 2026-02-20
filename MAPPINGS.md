# Data Mappings

This document describes the structure of all generated JSON files and how the simplified `videos.json` is derived from the raw API output.

---

## `videos_full.json`

Raw response from the YouTube Data API [`videos.list`](https://developers.google.com/youtube/v3/docs/videos/list) endpoint. An array of video resource objects, one per video, with the following `part` values requested:

- **`snippet`** — title, description, tags, thumbnails, publish date, channel info, category
- **`contentDetails`** — duration, definition, dimension, caption, projection
- **`statistics`** — view count, like count, comment count
- **`status`** — privacy status, upload status, embeddable, madeForKids

Produced by: `fetch_videos.py`

---

## `playlists_full.json`

Raw playlist data for the authenticated user's channel. Structure:

```json
{
  "playlists": [...],
  "memberships": [...]
}
```

### `playlists`
Raw playlist objects from [`playlists.list`](https://developers.google.com/youtube/v3/docs/playlists/list) (`part=snippet`). Each object includes the playlist `id`, `snippet.title`, `snippet.description`, `snippet.publishedAt`, etc.

### `memberships`
Flat list of video-to-playlist associations, one row per (video, playlist) pair:

```json
[
  {
    "playlist_id": "PLxxxxxxxxxxxxxxxx",
    "playlist_title": "My Playlist",
    "video_id": "dQw4w9WgXcQ"
  }
]
```

Produced by: `fetch_videos.py` using Strategy B — iterating per-playlist (not per-video) to minimise API quota usage.

---

## `videos.json` — Simplified output

Produced by `make_simple_video_list.py` from `videos_full.json` + `playlists_full.json`.

### Field mappings

| Output field | Source in `videos_full.json` | Notes |
|---|---|---|
| `id` | `item["id"]` | YouTube video ID |
| `url` | — | Constructed as `https://www.youtube.com/watch?v={id}` |
| `title` | `item["snippet"]["title"]` | |
| `description` | `item["snippet"]["description"]` | |
| `uploadDate` | `item["snippet"]["publishedAt"]` | ISO 8601 datetime string |
| `tags` | `item["snippet"]["tags"]` | Defaults to `[]` if absent |
| `privacyStatus` | `item["status"]["privacyStatus"]` | `"public"`, `"unlisted"`, or `"private"` |
| `thumbnails.high` | `item["snippet"]["thumbnails"]["high"]` | Object with `url`, `width`, `height` |
| `thumbnails.standard` | `item["snippet"]["thumbnails"]["standard"]` | Falls back to `high` if `standard` is not present |
| `channelId` | `item["snippet"]["channelId"]` | |
| `categoryId` | `item["snippet"]["categoryId"]` | YouTube category ID string (e.g. `"22"` = People & Blogs) |
| `viewCount` | `item["statistics"]["viewCount"]` | String (as returned by API). Defaults to `"0"` if absent |
| `playlists` | `playlists_full.json["memberships"]` | List of `{"id": ..., "title": ...}` objects. `[]` if video belongs to no playlists |

### Example output object

```json
{
  "id": "dQw4w9WgXcQ",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "My Video Title",
  "description": "A description of the video.",
  "uploadDate": "2024-03-01T14:00:00Z",
  "tags": ["tutorial", "python"],
  "privacyStatus": "public",
  "thumbnails": {
    "high": {"url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg", "width": 480, "height": 360},
    "standard": {"url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/sddefault.jpg", "width": 640, "height": 480}
  },
  "channelId": "UCxxxxxxxxxxxxxxxxxxxxxxxx",
  "categoryId": "28",
  "viewCount": "4321",
  "playlists": [
    {"id": "PLxxxxxxxxxxxxxxxx", "title": "My Playlist"}
  ]
}
```

### Fields intentionally omitted

| Field | Reason |
|---|---|
| `snippet.channelTitle` | Redundant — it's always your own channel name |
| `snippet.localized` | Duplicates `title` / `description` in most cases |
| `snippet.liveBroadcastContent` | Not relevant for archived/uploaded videos |
| `contentDetails.*` | Duration, dimension, definition, etc. not requested for this use case |
| `statistics.likeCount`, `commentCount` | Only view count was needed |
| `status.embeddable`, `madeForKids`, etc. | Not needed for this use case |
| `kind`, `etag` | API metadata, not content |
