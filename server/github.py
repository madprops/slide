from flask import Blueprint, request
import utils

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_URL = "https://api.github.com"

bp = Blueprint("github", __name__)


@bp.route("/login")  # type: ignore
def github_login() -> Any:
    """Step 1: Redirect user to GitHub to approve permissions."""
    scope = "gist"

    client_id = CREDS["github_client_id"]
    return redirect(f"{GITHUB_AUTH_URL}?client_id={client_id}&scope={scope}")


@bp.route("/callback")  # type: ignore
def github_callback() -> Any:
    """Step 2: Handle the code returned by GitHub."""
    code = request.args.get("code")

    payload = {
        "client_id": CREDS["github_client_id"],
        "client_secret": CREDS["github_client_secret"],
        "code": code,
    }

    headers = {"Accept": "application/json"}

    response = requests.post(
        GITHUB_TOKEN_URL, json=payload, headers=headers, timeout=20
    )

    if response.status_code == 200:
        token_data = response.json()

        if "access_token" in token_data:
            session["github_token"] = token_data["access_token"]
            session.permanent = True

            # CRITICAL FIX: Do not redirect to "/".
            # Return a script that talks to the opener and closes the popup.
            return """
            <html>
            <script>
                // Send message to the main window
                if (window.opener) {
                    window.opener.postMessage("github_authorized", window.location.origin);
                }
                // Close this popup
                window.close();
            </script>
            <body>Authorization successful. Closing...</body>
            </html>
            """

    return "Login failed", 400


@bp.route("/create_gist", methods=["POST"])  # type: ignore
def create_gist() -> Any:
    """Step 3: Proxy the request to GitHub using the stored token."""
    if "github_token" not in session:
        return jsonify({"error": "User not logged in"}), 401

    data = request.json
    content = data.get("content", "No code yet")
    filename = data.get("filename", "slide.txt")

    if not filename or not content:
        return jsonify({"error": "Filename and content are required"}), 400

    # Construct Gist payload
    gist_payload = {
        "description": "Created via My App",
        "public": False,
        "files": {filename: {"content": content}},
    }

    headers = {
        "Authorization": f"token {session['github_token']}",
        "Accept": "application/vnd.github.v3+json",
    }

    response = requests.post(
        f"{GITHUB_API_URL}/gists",
        json=gist_payload,
        headers=headers,
        timeout=20,
    )

    if response.status_code == 201:
        gist_data = response.json()

        # GitHub returns 'files' keyed by the specific filename
        raw_url = gist_data["files"][filename]["raw_url"]

        return jsonify({"raw_url": raw_url})

    # Debugging: Print why GitHub failed
    echo(f"GitHub API Error: {response.status_code}")

    return jsonify({"error": "GitHub API failed", "details": response.json()}), 400