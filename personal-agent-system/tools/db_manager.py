"""
tools/db_manager.py - SQLite Database Manager
Handles all job storage, retrieval, and status updates.
"""
import sqlite3
import os
import sys
import pathlib

BASE_DIR = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))
from config.settings import DB_PATH


def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database tables."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            title          TEXT NOT NULL,
            company        TEXT,
            location       TEXT,
            job_type       TEXT,
            salary         TEXT,
            skills_matched TEXT,
            url            TEXT UNIQUE,
            source         TEXT,
            description    TEXT,
            score          REAL DEFAULT 0,
            status         TEXT DEFAULT 'new',
            found_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            applied_at     TIMESTAMP,
            notes          TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS search_runs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            ran_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            jobs_found INTEGER DEFAULT 0,
            notified   INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()
    print("Database initialized.")


def save_job(job: dict) -> bool:
    """Save a job. Returns True if new, False if duplicate."""
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO jobs (title, company, location, job_type, salary,
                              skills_matched, url, source, description, score)
            VALUES (:title, :company, :location, :job_type, :salary,
                    :skills_matched, :url, :source, :description, :score)
        """, job)
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False  # Duplicate URL
    finally:
        conn.close()


def get_new_jobs(limit: int = 20) -> list:
    """Fetch new jobs ordered by score."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM jobs WHERE status='new' ORDER BY score DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def get_all_jobs(status: str = None) -> list:
    """Fetch all jobs, optionally filtered by status."""
    conn = get_connection()
    c = conn.cursor()
    if status:
        c.execute("SELECT * FROM jobs WHERE status=? ORDER BY found_at DESC", (status,))
    else:
        c.execute("SELECT * FROM jobs ORDER BY found_at DESC")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def update_job_status(job_id: int, status: str, notes: str = None):
    """Update the status of a job."""
    conn = get_connection()
    c = conn.cursor()
    if notes:
        c.execute("UPDATE jobs SET status=?, notes=? WHERE id=?", (status, notes, job_id))
    else:
        c.execute("UPDATE jobs SET status=? WHERE id=?", (status, job_id))
    conn.commit()
    conn.close()


def log_search_run(jobs_found: int, notified: int):
    """Log a search run."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO search_runs (jobs_found, notified) VALUES (?,?)", (jobs_found, notified))
    conn.commit()
    conn.close()


def get_stats() -> dict:
    """Return aggregate stats for the dashboard."""
    conn = get_connection()
    c = conn.cursor()
    stats = {}
    for key, sql in [
        ("total",       "SELECT COUNT(*) FROM jobs"),
        ("new",         "SELECT COUNT(*) FROM jobs WHERE status='new'"),
        ("applied",     "SELECT COUNT(*) FROM jobs WHERE status='applied'"),
        ("interested",  "SELECT COUNT(*) FROM jobs WHERE status='interested'"),
        ("rejected",    "SELECT COUNT(*) FROM jobs WHERE status='rejected'"),
        ("runs",        "SELECT COUNT(*) FROM search_runs"),
    ]:
        c.execute(sql)
        stats[key] = c.fetchone()[0]
    conn.close()
    return stats


if __name__ == "__main__":
    init_db()
    print("Stats:", get_stats())
