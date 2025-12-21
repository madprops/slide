from flask import Flask  # type: ignore

from github import bp as github_bp
from auto import bp as auto_bp

app = Flask(__name__)
app.register_blueprint(github_bp, url_prefix="/github")
app.register_blueprint(auto_bp, url_prefix="/")
