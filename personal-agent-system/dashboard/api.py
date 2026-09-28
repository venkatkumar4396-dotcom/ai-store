"""
dashboard/api.py - Flask API + Dashboard Server
Run: python dashboard/api.py
Then open: http://localhost:5000
"""
import sys
import pathlib

BASE_DIR = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from flask import Flask, jsonify, request, send_from_directory
from tools.db_manager import init_db, get_all_jobs, update_job_status, get_stats
from agents.orchestrator import run_job_search

app = Flask(__name__, static_folder=str(pathlib.Path(__file__).parent))


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/style.css")
def css():
    return send_from_directory(app.static_folder, "style.css")


@app.route("/app.js")
def js():
    return send_from_directory(app.static_folder, "app.js")


@app.route("/api/jobs")
def api_jobs():
    status = request.args.get("status")
    return jsonify(get_all_jobs(status=status or None))


@app.route("/api/stats")
def api_stats():
    return jsonify(get_stats())


@app.route("/api/job/<int:job_id>/status", methods=["POST"])
def api_update_status(job_id):
    data   = request.get_json()
    status = data.get("status")
    notes  = data.get("notes", "")
    if status not in ("new", "interested", "applied", "rejected"):
        return jsonify({"error": "Invalid status"}), 400
    update_job_status(job_id, status, notes)
    return jsonify({"ok": True})


@app.route("/api/run-now", methods=["POST"])
def api_run_now():
    """Trigger a manual search run from the dashboard."""
    result = run_job_search()
    return jsonify({"ok": True, "new_jobs": result["new_jobs"]})


if __name__ == "__main__":
    init_db()
    print("Dashboard running at http://localhost:5000")
    app.run(debug=True, port=5000)
