"""Run this script locally once to perform the OAuth browser flow and save token.json."""

from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"]

HERE = Path(__file__).parent
CLIENT_SECRET_FILE = HERE / "client_secret.json"
TOKEN_FILE = HERE / "token.json"


def main():
    if not CLIENT_SECRET_FILE.exists():
        raise FileNotFoundError(
            f"OAuth client credentials not found: {CLIENT_SECRET_FILE}\n"
            "Download client_secret.json from Google Cloud Console → "
            "APIs & Services → Credentials → OAuth 2.0 Client ID (Desktop app)."
        )

    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
    creds = flow.run_local_server(port=0)
    TOKEN_FILE.write_text(creds.to_json())

    print(f"Saved credentials to: {TOKEN_FILE}")
    print()
    print("Next steps:")
    print("  • Run `uv run fetch_videos.py` locally to verify it works.")
    print("  • Copy the contents of token.json into a GitHub Actions secret")
    print("    named YOUTUBE_TOKEN_JSON.")
    print("  • Copy the contents of client_secret.json into a GitHub Actions secret")
    print("    named YOUTUBE_CLIENT_SECRET_JSON.")
    print()
    print("WARNING: token.json and client_secret.json contain sensitive credentials.")
    print("Keep them out of version control (add to .gitignore).")


if __name__ == "__main__":
    main()
