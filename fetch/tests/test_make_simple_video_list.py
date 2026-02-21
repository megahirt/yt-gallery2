"""
Unit tests for make_simple_video_list.py.

Run with: python3 -m pytest fetch/tests/ (from repo root)
         or: python3 -m pytest (from fetch/ directory)
"""

import json
import sys
from pathlib import Path

import pytest

# Add the fetch/ directory to the path so we can import the module under test
sys.path.insert(0, str(Path(__file__).parent.parent))

from make_simple_video_list import build_membership_lookup, simplify_video


# ---------------------------------------------------------------------------
# Helpers / shared fixtures
# ---------------------------------------------------------------------------

def make_membership(video_id, playlist_id, playlist_title):
    return {
        "video_id": video_id,
        "playlist_id": playlist_id,
        "playlist_title": playlist_title,
    }


def make_raw_video(
    video_id="vid1",
    title="Test Video",
    description="A test description",
    published_at="2024-01-15T10:00:00Z",
    tags=None,
    privacy_status="public",
    channel_id="UCchannel123",
    category_id="22",
    view_count="100",
    high_thumb=None,
    standard_thumb=None,
):
    """Build a minimal raw YouTube API video resource."""
    thumbnails = {}
    if high_thumb is not None:
        thumbnails["high"] = high_thumb
    if standard_thumb is not None:
        thumbnails["standard"] = standard_thumb

    video = {
        "id": video_id,
        "snippet": {
            "title": title,
            "description": description,
            "publishedAt": published_at,
            "channelId": channel_id,
            "thumbnails": thumbnails,
        },
        "status": {
            "privacyStatus": privacy_status,
        },
        "statistics": {
            "viewCount": view_count,
        },
    }
    if tags is not None:
        video["snippet"]["tags"] = tags
    if category_id is not None:
        video["snippet"]["categoryId"] = category_id

    return video


THUMB_HIGH = {"url": "https://i.ytimg.com/vi/vid1/hqdefault.jpg", "width": 480, "height": 360}
THUMB_STANDARD = {"url": "https://i.ytimg.com/vi/vid1/sddefault.jpg", "width": 640, "height": 480}


# ---------------------------------------------------------------------------
# Tests for build_membership_lookup
# ---------------------------------------------------------------------------

class TestBuildMembershipLookup:
    def test_empty_memberships(self):
        result = build_membership_lookup({"memberships": []})
        assert result == {}

    def test_single_membership(self):
        memberships = [make_membership("vid1", "PL1", "My Playlist")]
        result = build_membership_lookup({"memberships": memberships})
        assert result["vid1"] == [{"id": "PL1", "title": "My Playlist"}]

    def test_video_in_multiple_playlists(self):
        memberships = [
            make_membership("vid1", "PL1", "Playlist One"),
            make_membership("vid1", "PL2", "Playlist Two"),
        ]
        result = build_membership_lookup({"memberships": memberships})
        assert len(result["vid1"]) == 2
        assert {"id": "PL1", "title": "Playlist One"} in result["vid1"]
        assert {"id": "PL2", "title": "Playlist Two"} in result["vid1"]

    def test_multiple_videos_in_different_playlists(self):
        memberships = [
            make_membership("vid1", "PL1", "Playlist One"),
            make_membership("vid2", "PL2", "Playlist Two"),
        ]
        result = build_membership_lookup({"memberships": memberships})
        assert result["vid1"] == [{"id": "PL1", "title": "Playlist One"}]
        assert result["vid2"] == [{"id": "PL2", "title": "Playlist Two"}]

    def test_video_not_in_lookup_returns_empty_list(self):
        memberships = [make_membership("vid1", "PL1", "Playlist One")]
        result = build_membership_lookup({"memberships": memberships})
        # A video not in any playlist should not be in the lookup
        assert result.get("vid_missing") is None
        # The defaultdict behavior: accessing missing key returns []
        assert result["vid_missing"] == []

    def test_preserves_playlist_title(self):
        title = "Family & Friends — Summer 2024"
        memberships = [make_membership("vid1", "PL99", title)]
        result = build_membership_lookup({"memberships": memberships})
        assert result["vid1"][0]["title"] == title


# ---------------------------------------------------------------------------
# Tests for simplify_video
# ---------------------------------------------------------------------------

class TestSimplifyVideo:
    def test_full_data_produces_correct_output(self):
        raw = make_raw_video(
            video_id="abc123",
            title="My Great Video",
            description="A thorough description.",
            published_at="2024-03-01T14:00:00Z",
            tags=["tutorial", "python"],
            privacy_status="public",
            channel_id="UCxyz",
            category_id="28",
            view_count="4321",
            high_thumb=THUMB_HIGH,
            standard_thumb=THUMB_STANDARD,
        )
        lookup = {"abc123": [{"id": "PL1", "title": "Tech Talks"}]}

        result = simplify_video(raw, lookup)

        assert result["id"] == "abc123"
        assert result["url"] == "https://www.youtube.com/watch?v=abc123"
        assert result["title"] == "My Great Video"
        assert result["description"] == "A thorough description."
        assert result["uploadDate"] == "2024-03-01T14:00:00Z"
        assert result["tags"] == ["tutorial", "python"]
        assert result["privacyStatus"] == "public"
        assert result["thumbnails"]["high"] == THUMB_HIGH
        assert result["thumbnails"]["standard"] == THUMB_STANDARD
        assert result["channelId"] == "UCxyz"
        assert result["categoryId"] == "28"
        assert result["viewCount"] == "4321"
        assert result["playlists"] == [{"id": "PL1", "title": "Tech Talks"}]

    def test_url_constructed_from_video_id(self):
        raw = make_raw_video(video_id="dQw4w9WgXcQ")
        result = simplify_video(raw, {})
        assert result["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    def test_missing_tags_defaults_to_empty_list(self):
        raw = make_raw_video(tags=None)
        result = simplify_video(raw, {})
        assert result["tags"] == []

    def test_missing_statistics_view_count_defaults_to_zero(self):
        raw = make_raw_video()
        del raw["statistics"]
        result = simplify_video(raw, {})
        assert result["viewCount"] == "0"

    def test_zero_view_count_in_statistics(self):
        raw = make_raw_video(view_count="0")
        del raw["statistics"]["viewCount"]
        result = simplify_video(raw, {})
        assert result["viewCount"] == "0"

    def test_standard_thumbnail_used_when_present(self):
        raw = make_raw_video(high_thumb=THUMB_HIGH, standard_thumb=THUMB_STANDARD)
        result = simplify_video(raw, {})
        assert result["thumbnails"]["standard"] == THUMB_STANDARD
        assert result["thumbnails"]["high"] == THUMB_HIGH

    def test_standard_thumbnail_falls_back_to_high(self):
        """When standard thumbnail is absent, standard in output should be same as high."""
        raw = make_raw_video(high_thumb=THUMB_HIGH, standard_thumb=None)
        result = simplify_video(raw, {})
        assert result["thumbnails"]["high"] == THUMB_HIGH
        # standard falls back to high when not present
        assert result["thumbnails"]["standard"] == THUMB_HIGH

    def test_both_thumbnails_absent(self):
        raw = make_raw_video(high_thumb=None, standard_thumb=None)
        result = simplify_video(raw, {})
        assert result["thumbnails"]["high"] is None
        assert result["thumbnails"]["standard"] is None

    def test_no_playlists_returns_empty_list(self):
        raw = make_raw_video(video_id="lonely_vid")
        result = simplify_video(raw, {})
        assert result["playlists"] == []

    def test_playlists_attached_from_lookup(self):
        raw = make_raw_video(video_id="vid1")
        lookup = {
            "vid1": [
                {"id": "PLA", "title": "Alpha"},
                {"id": "PLB", "title": "Beta"},
            ]
        }
        result = simplify_video(raw, lookup)
        assert len(result["playlists"]) == 2
        assert {"id": "PLA", "title": "Alpha"} in result["playlists"]

    def test_privacy_status_preserved(self):
        for status in ("public", "unlisted", "private"):
            raw = make_raw_video(privacy_status=status)
            result = simplify_video(raw, {})
            assert result["privacyStatus"] == status

    def test_empty_description(self):
        raw = make_raw_video(description="")
        result = simplify_video(raw, {})
        assert result["description"] == ""

    def test_missing_description_defaults_to_empty_string(self):
        raw = make_raw_video()
        del raw["snippet"]["description"]
        result = simplify_video(raw, {})
        assert result["description"] == ""

    def test_category_id_none_when_absent(self):
        # make_raw_video(category_id=None) already omits the key from snippet
        raw = make_raw_video(category_id=None)
        assert "categoryId" not in raw["snippet"]
        result = simplify_video(raw, {})
        assert result["categoryId"] is None


# ---------------------------------------------------------------------------
# Integration-style test for main() using tmp_path
# ---------------------------------------------------------------------------

class TestMainIntegration:
    def test_main_reads_inputs_and_writes_outputs(self, tmp_path, monkeypatch):
        """main() should read videos_full.json + playlists_full.json,
        split public/private, and write both output files."""
        import make_simple_video_list as msl

        # Redirect all Path constants to tmp_path
        videos_full = [
            make_raw_video(video_id="pub1", privacy_status="public", high_thumb=THUMB_HIGH),
            make_raw_video(video_id="pub2", privacy_status="unlisted", high_thumb=THUMB_HIGH),
            make_raw_video(video_id="priv1", privacy_status="private", high_thumb=THUMB_HIGH),
        ]
        playlists_full = {
            "playlists": [],
            "memberships": [
                make_membership("pub1", "PL1", "My Playlist"),
            ],
        }

        videos_full_path = tmp_path / "videos_full.json"
        playlists_full_path = tmp_path / "playlists_full.json"
        output_path = tmp_path / "videos.json"
        private_path = tmp_path / "videos_private.json"

        videos_full_path.write_text(json.dumps(videos_full))
        playlists_full_path.write_text(json.dumps(playlists_full))

        monkeypatch.setattr(msl, "VIDEOS_FULL_FILE", videos_full_path)
        monkeypatch.setattr(msl, "PLAYLISTS_FULL_FILE", playlists_full_path)
        monkeypatch.setattr(msl, "OUTPUT_FILE", output_path)
        monkeypatch.setattr(msl, "PRIVATE_FILE", private_path)

        msl.main()

        public_videos = json.loads(output_path.read_text())
        private_videos = json.loads(private_path.read_text())

        # public + unlisted → 2 videos in output
        assert len(public_videos) == 2
        assert all(v["privacyStatus"] != "private" for v in public_videos)

        # 1 private video
        assert len(private_videos) == 1
        assert private_videos[0]["privacyStatus"] == "private"

        # Playlist membership attached to pub1
        pub1 = next(v for v in public_videos if v["id"] == "pub1")
        assert pub1["playlists"] == [{"id": "PL1", "title": "My Playlist"}]

    def test_main_raises_if_videos_full_missing(self, tmp_path, monkeypatch):
        import make_simple_video_list as msl

        # Use the real filename so the error message contains "videos_full.json"
        monkeypatch.setattr(msl, "VIDEOS_FULL_FILE", tmp_path / "videos_full.json")
        monkeypatch.setattr(msl, "PLAYLISTS_FULL_FILE", tmp_path / "playlists_full.json")

        with pytest.raises(FileNotFoundError, match="videos_full.json"):
            msl.main()

    def test_main_raises_if_playlists_full_missing(self, tmp_path, monkeypatch):
        import make_simple_video_list as msl

        videos_full_path = tmp_path / "videos_full.json"
        videos_full_path.write_text("[]")

        monkeypatch.setattr(msl, "VIDEOS_FULL_FILE", videos_full_path)
        # Use the real filename so the error message contains "playlists_full.json"
        monkeypatch.setattr(msl, "PLAYLISTS_FULL_FILE", tmp_path / "playlists_full.json")

        with pytest.raises(FileNotFoundError, match="playlists_full.json"):
            msl.main()
