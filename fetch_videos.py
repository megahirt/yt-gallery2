import json
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"]

HERE = Path(__file__).parent
TOKEN_FILE = HERE / "token.json"
OUTPUT_FILE = HERE / "videos_full.json"
PLAYLISTS_FILE = HERE / "playlists_full.json"


def get_credentials():
    if not TOKEN_FILE.exists():
        raise FileNotFoundError(
            f"Token file not found: {TOKEN_FILE}\n"
            "Run `uv run login.py` locally first to generate token.json."
        )
    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds.valid and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_FILE.write_text(creds.to_json())
    return creds


def get_uploads_playlist_id(youtube):
    response = youtube.channels().list(part="contentDetails", mine=True).execute()
    return response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]


def get_all_video_ids(youtube, playlist_id):
    video_ids = []
    next_page_token = None
    while True:
        params = {"playlistId": playlist_id, "part": "contentDetails", "maxResults": 50}
        if next_page_token:
            params["pageToken"] = next_page_token
        response = youtube.playlistItems().list(**params).execute()
        for item in response["items"]:
            video_ids.append(item["contentDetails"]["videoId"])
        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break
    return video_ids


def get_video_details(youtube, video_ids):
    all_videos = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        response = youtube.videos().list(
            id=",".join(batch),
            part="snippet,contentDetails,statistics,status",
        ).execute()
        all_videos.extend(response["items"])
    return all_videos


def get_all_playlists(youtube):
    """Return raw playlist objects for all playlists owned by the authenticated user."""
    playlists = []
    next_page_token = None
    while True:
        params = {"mine": True, "part": "snippet", "maxResults": 50}
        if next_page_token:
            params["pageToken"] = next_page_token
        response = youtube.playlists().list(**params).execute()
        playlists.extend(response["items"])
        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break
    return playlists


def get_playlist_memberships(youtube, playlists):
    """
    For each playlist, fetch all its items and return a flat list of membership rows:
      [{"playlist_id": ..., "playlist_title": ..., "video_id": ...}, ...]

    Uses Strategy B (iterate by playlist, not by video) to minimise quota usage.
    """
    memberships = []
    for playlist in playlists:
        playlist_id = playlist["id"]
        playlist_title = playlist["snippet"]["title"]
        next_page_token = None
        while True:
            params = {
                "playlistId": playlist_id,
                "part": "snippet",
                "maxResults": 50,
            }
            if next_page_token:
                params["pageToken"] = next_page_token
            response = youtube.playlistItems().list(**params).execute()
            for item in response["items"]:
                resource = item["snippet"]["resourceId"]
                if resource.get("kind") == "youtube#video":
                    memberships.append({
                        "playlist_id": playlist_id,
                        "playlist_title": playlist_title,
                        "video_id": resource["videoId"],
                    })
            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break
    return memberships


def main():
    creds = get_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    print("Fetching channel info...")
    uploads_playlist_id = get_uploads_playlist_id(youtube)

    print("Fetching video IDs...")
    video_ids = get_all_video_ids(youtube, uploads_playlist_id)
    print(f"Found {len(video_ids)} videos. Fetching metadata...")

    videos = get_video_details(youtube, video_ids)
    OUTPUT_FILE.write_text(json.dumps(videos, indent=2))
    print(f"Wrote {len(videos)} videos to {OUTPUT_FILE}")

    print("Fetching playlists...")
    playlists = get_all_playlists(youtube)
    print(f"Found {len(playlists)} playlists. Fetching playlist memberships...")

    memberships = get_playlist_memberships(youtube, playlists)
    PLAYLISTS_FILE.write_text(json.dumps(
        {"playlists": playlists, "memberships": memberships},
        indent=2,
    ))
    print(f"Wrote {len(playlists)} playlists and {len(memberships)} memberships to {PLAYLISTS_FILE}")


if __name__ == "__main__":
    main()
