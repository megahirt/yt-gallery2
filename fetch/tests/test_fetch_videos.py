"""
Unit tests for fetch_videos.py.

External Google API dependencies are fully mocked so no network access or
credentials are required. Run with:
  python3 -m pytest fetch/tests/  (from repo root)
"""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, call

import pytest

# ---------------------------------------------------------------------------
# Mock Google SDK modules BEFORE importing fetch_videos so the module-level
# `from google... import ...` statements succeed without the real packages.
# ---------------------------------------------------------------------------

for _mod in [
    "google",
    "google.auth",
    "google.auth.transport",
    "google.auth.transport.requests",
    "google.oauth2",
    "google.oauth2.credentials",
    "googleapiclient",
    "googleapiclient.discovery",
]:
    sys.modules.setdefault(_mod, MagicMock())

sys.path.insert(0, str(Path(__file__).parent.parent))

import fetch_videos  # noqa: E402 (must come after sys.modules patching)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_youtube_mock():
    """Return a MagicMock that mimics the YouTube API client object."""
    return MagicMock()


def paginate(pages):
    """
    Given a list of page-dicts (each with an "items" key), wire up the
    nextPageToken chain so that successive .execute() calls return each page.
    """
    for i, page in enumerate(pages):
        if i < len(pages) - 1:
            page["nextPageToken"] = f"token_{i}"
        else:
            page.pop("nextPageToken", None)
    return pages


# ---------------------------------------------------------------------------
# Tests: get_credentials
# ---------------------------------------------------------------------------

class TestGetCredentials:
    def test_raises_if_token_file_missing(self, tmp_path, monkeypatch):
        monkeypatch.setattr(fetch_videos, "TOKEN_FILE", tmp_path / "nonexistent_token.json")
        with pytest.raises(FileNotFoundError, match="token.json"):
            fetch_videos.get_credentials()

    def test_returns_valid_credentials_without_refresh(self, tmp_path, monkeypatch):
        token_path = tmp_path / "token.json"
        token_path.write_text('{"token": "fake"}')
        monkeypatch.setattr(fetch_videos, "TOKEN_FILE", token_path)

        mock_creds = MagicMock()
        mock_creds.valid = True
        mock_creds.expired = False

        with patch("fetch_videos.Credentials") as MockCreds:
            MockCreds.from_authorized_user_file.return_value = mock_creds
            result = fetch_videos.get_credentials()

        assert result is mock_creds
        # No refresh should have been triggered
        mock_creds.refresh.assert_not_called()

    def test_refreshes_expired_credentials_and_saves_token(self, tmp_path, monkeypatch):
        token_path = tmp_path / "token.json"
        token_path.write_text('{"token": "old"}')
        monkeypatch.setattr(fetch_videos, "TOKEN_FILE", token_path)

        mock_creds = MagicMock()
        mock_creds.valid = False
        mock_creds.expired = True
        mock_creds.refresh_token = "some_refresh_token"
        mock_creds.to_json.return_value = '{"token": "refreshed"}'

        with patch("fetch_videos.Credentials") as MockCreds, \
             patch("fetch_videos.Request") as MockRequest:
            MockCreds.from_authorized_user_file.return_value = mock_creds
            fetch_videos.get_credentials()

        mock_creds.refresh.assert_called_once()
        assert token_path.read_text() == '{"token": "refreshed"}'

    def test_does_not_refresh_when_no_refresh_token(self, tmp_path, monkeypatch):
        token_path = tmp_path / "token.json"
        token_path.write_text('{"token": "fake"}')
        monkeypatch.setattr(fetch_videos, "TOKEN_FILE", token_path)

        mock_creds = MagicMock()
        mock_creds.valid = False
        mock_creds.expired = True
        mock_creds.refresh_token = None

        with patch("fetch_videos.Credentials") as MockCreds:
            MockCreds.from_authorized_user_file.return_value = mock_creds
            result = fetch_videos.get_credentials()

        mock_creds.refresh.assert_not_called()


# ---------------------------------------------------------------------------
# Tests: get_uploads_playlist_id
# ---------------------------------------------------------------------------

class TestGetUploadsPlaylistId:
    def test_returns_uploads_playlist_id(self):
        youtube = make_youtube_mock()
        youtube.channels().list().execute.return_value = {
            "items": [{
                "contentDetails": {
                    "relatedPlaylists": {"uploads": "UUxxxxxx"}
                }
            }]
        }
        result = fetch_videos.get_uploads_playlist_id(youtube)
        assert result == "UUxxxxxx"


# ---------------------------------------------------------------------------
# Tests: get_all_video_ids
# ---------------------------------------------------------------------------

class TestGetAllVideoIds:
    def _make_page(self, video_ids, next_token=None):
        page = {
            "items": [
                {"contentDetails": {"videoId": vid}} for vid in video_ids
            ]
        }
        if next_token:
            page["nextPageToken"] = next_token
        return page

    def test_single_page_no_pagination(self):
        youtube = make_youtube_mock()
        youtube.playlistItems().list().execute.return_value = self._make_page(
            ["vid1", "vid2", "vid3"]
        )
        result = fetch_videos.get_all_video_ids(youtube, "PLxxxxxxx")
        assert result == ["vid1", "vid2", "vid3"]

    def test_multiple_pages_are_concatenated(self):
        youtube = make_youtube_mock()
        page1 = self._make_page(["vid1", "vid2"], next_token="token1")
        page2 = self._make_page(["vid3", "vid4"])

        youtube.playlistItems().list().execute.side_effect = [page1, page2]

        result = fetch_videos.get_all_video_ids(youtube, "PLxxxxxxx")
        assert result == ["vid1", "vid2", "vid3", "vid4"]

    def test_three_pages(self):
        youtube = make_youtube_mock()
        page1 = self._make_page(["vid1"], next_token="t1")
        page2 = self._make_page(["vid2"], next_token="t2")
        page3 = self._make_page(["vid3"])

        youtube.playlistItems().list().execute.side_effect = [page1, page2, page3]

        result = fetch_videos.get_all_video_ids(youtube, "PLxxxxxxx")
        assert result == ["vid1", "vid2", "vid3"]

    def test_empty_playlist_returns_empty_list(self):
        youtube = make_youtube_mock()
        youtube.playlistItems().list().execute.return_value = {"items": []}
        result = fetch_videos.get_all_video_ids(youtube, "PLxxxxxxx")
        assert result == []


# ---------------------------------------------------------------------------
# Tests: get_video_details
# ---------------------------------------------------------------------------

class TestGetVideoDetails:
    def _make_response(self, video_ids):
        return {"items": [{"id": vid, "snippet": {"title": f"Title {vid}"}} for vid in video_ids]}

    def test_empty_video_ids_returns_empty(self):
        youtube = make_youtube_mock()
        result = fetch_videos.get_video_details(youtube, [])
        assert result == []
        youtube.videos().list.assert_not_called()

    def test_single_batch_under_50(self):
        youtube = make_youtube_mock()
        ids = [f"vid{i}" for i in range(10)]
        # Use .return_value chaining to avoid polluting call counts
        youtube.videos.return_value.list.return_value.execute.return_value = self._make_response(ids)

        result = fetch_videos.get_video_details(youtube, ids)

        assert len(result) == 10
        # Only one API call (one batch)
        youtube.videos.return_value.list.assert_called_once()
        call_kwargs = youtube.videos.return_value.list.call_args[1]
        assert call_kwargs["id"] == ",".join(ids)

    def test_exactly_50_videos_single_batch(self):
        youtube = make_youtube_mock()
        ids = [f"vid{i}" for i in range(50)]
        youtube.videos.return_value.list.return_value.execute.return_value = self._make_response(ids)

        result = fetch_videos.get_video_details(youtube, ids)
        assert len(result) == 50
        youtube.videos.return_value.list.assert_called_once()

    def test_51_videos_uses_two_batches(self):
        youtube = make_youtube_mock()
        ids = [f"vid{i}" for i in range(51)]
        batch1_response = self._make_response(ids[:50])
        batch2_response = self._make_response(ids[50:])

        youtube.videos.return_value.list.return_value.execute.side_effect = [
            batch1_response, batch2_response
        ]

        result = fetch_videos.get_video_details(youtube, ids)
        assert len(result) == 51
        assert youtube.videos.return_value.list.call_count == 2

    def test_100_videos_uses_two_batches(self):
        youtube = make_youtube_mock()
        ids = [f"vid{i}" for i in range(100)]
        batch1_response = self._make_response(ids[:50])
        batch2_response = self._make_response(ids[50:])

        youtube.videos().list().execute.side_effect = [batch1_response, batch2_response]

        result = fetch_videos.get_video_details(youtube, ids)
        assert len(result) == 100


# ---------------------------------------------------------------------------
# Tests: get_all_playlists
# ---------------------------------------------------------------------------

class TestGetAllPlaylists:
    def _make_page(self, playlist_ids, next_token=None):
        page = {
            "items": [
                {"id": pid, "snippet": {"title": f"Playlist {pid}"}}
                for pid in playlist_ids
            ]
        }
        if next_token:
            page["nextPageToken"] = next_token
        return page

    def test_single_page(self):
        youtube = make_youtube_mock()
        youtube.playlists().list().execute.return_value = self._make_page(["PL1", "PL2"])

        result = fetch_videos.get_all_playlists(youtube)
        assert len(result) == 2
        assert result[0]["id"] == "PL1"

    def test_multiple_pages(self):
        youtube = make_youtube_mock()
        page1 = self._make_page(["PL1", "PL2"], next_token="tok1")
        page2 = self._make_page(["PL3"])
        youtube.playlists().list().execute.side_effect = [page1, page2]

        result = fetch_videos.get_all_playlists(youtube)
        assert len(result) == 3
        assert result[2]["id"] == "PL3"

    def test_no_playlists_returns_empty(self):
        youtube = make_youtube_mock()
        youtube.playlists().list().execute.return_value = {"items": []}

        result = fetch_videos.get_all_playlists(youtube)
        assert result == []


# ---------------------------------------------------------------------------
# Tests: get_playlist_memberships
# ---------------------------------------------------------------------------

class TestGetPlaylistMemberships:
    def _make_video_item(self, video_id):
        return {
            "snippet": {
                "resourceId": {"kind": "youtube#video", "videoId": video_id}
            }
        }

    def _make_non_video_item(self):
        """An item that is not a video (e.g. a playlist reference)."""
        return {
            "snippet": {
                "resourceId": {"kind": "youtube#playlist", "playlistId": "PLother"}
            }
        }

    def _make_playlist(self, playlist_id, title):
        return {"id": playlist_id, "snippet": {"title": title}}

    def test_single_playlist_single_video(self):
        youtube = make_youtube_mock()
        youtube.playlistItems().list().execute.return_value = {
            "items": [self._make_video_item("vid1")]
        }
        playlists = [self._make_playlist("PL1", "My Playlist")]

        result = fetch_videos.get_playlist_memberships(youtube, playlists)

        assert len(result) == 1
        assert result[0] == {
            "playlist_id": "PL1",
            "playlist_title": "My Playlist",
            "video_id": "vid1",
        }

    def test_non_video_items_are_filtered_out(self):
        youtube = make_youtube_mock()
        youtube.playlistItems().list().execute.return_value = {
            "items": [
                self._make_video_item("vid1"),
                self._make_non_video_item(),
                self._make_video_item("vid2"),
            ]
        }
        playlists = [self._make_playlist("PL1", "My Playlist")]

        result = fetch_videos.get_playlist_memberships(youtube, playlists)

        # Only the two video items should appear
        assert len(result) == 2
        assert all(r["video_id"] in ("vid1", "vid2") for r in result)

    def test_multiple_playlists(self):
        youtube = make_youtube_mock()
        # Each playlist gets its own items response
        youtube.playlistItems().list().execute.side_effect = [
            {"items": [self._make_video_item("vid1")]},
            {"items": [self._make_video_item("vid2"), self._make_video_item("vid3")]},
        ]
        playlists = [
            self._make_playlist("PL1", "Playlist One"),
            self._make_playlist("PL2", "Playlist Two"),
        ]

        result = fetch_videos.get_playlist_memberships(youtube, playlists)

        assert len(result) == 3
        pl1_rows = [r for r in result if r["playlist_id"] == "PL1"]
        pl2_rows = [r for r in result if r["playlist_id"] == "PL2"]
        assert len(pl1_rows) == 1
        assert len(pl2_rows) == 2

    def test_pagination_within_playlist(self):
        youtube = make_youtube_mock()
        page1 = {
            "items": [self._make_video_item("vid1")],
            "nextPageToken": "token1",
        }
        page2 = {
            "items": [self._make_video_item("vid2")],
        }
        youtube.playlistItems().list().execute.side_effect = [page1, page2]

        playlists = [self._make_playlist("PL1", "Paginated Playlist")]
        result = fetch_videos.get_playlist_memberships(youtube, playlists)

        assert len(result) == 2
        assert {r["video_id"] for r in result} == {"vid1", "vid2"}

    def test_empty_playlist_produces_no_memberships(self):
        youtube = make_youtube_mock()
        youtube.playlistItems().list().execute.return_value = {"items": []}

        playlists = [self._make_playlist("PL1", "Empty Playlist")]
        result = fetch_videos.get_playlist_memberships(youtube, playlists)
        assert result == []

    def test_no_playlists_returns_empty(self):
        youtube = make_youtube_mock()
        result = fetch_videos.get_playlist_memberships(youtube, [])
        assert result == []
        youtube.playlistItems().list.assert_not_called()

    def test_video_in_multiple_playlists_creates_multiple_rows(self):
        """The same video_id appearing in two playlists → two membership rows."""
        youtube = make_youtube_mock()
        youtube.playlistItems().list().execute.side_effect = [
            {"items": [self._make_video_item("shared_vid")]},
            {"items": [self._make_video_item("shared_vid")]},
        ]
        playlists = [
            self._make_playlist("PL1", "First"),
            self._make_playlist("PL2", "Second"),
        ]

        result = fetch_videos.get_playlist_memberships(youtube, playlists)
        assert len(result) == 2
        assert result[0]["video_id"] == "shared_vid"
        assert result[1]["video_id"] == "shared_vid"
        assert result[0]["playlist_id"] != result[1]["playlist_id"]
