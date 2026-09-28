"""
tools/job_scrapers/remoteok_scraper.py
Fetches and scores jobs from the RemoteOK public API (no auth required).
"""
import requests
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent))
from config.settings import USER_PROFILE, MAX_JOBS_PER_RUN

REMOTEOK_API = "https://remoteok.com/api"
HEADERS      = {"User-Agent": "PersonalJobAgent/1.0"}

# Skill aliases — maps user skill to keywords to search for in job listings
SKILL_ALIASES = {
    "python":     ["python", "django", "fastapi", "flask"],
    "javascript": ["javascript", "js", "node", "nodejs", "react", "next", "vue", "angular"],
    "typescript": ["typescript", "ts"],
    "react":      ["react", "reactjs", "next.js", "nextjs"],
    "node.js":    ["node", "nodejs", "express"],
    "sql":        ["sql", "postgresql", "mysql", "database", "postgres"],
    "databases":  ["sql", "postgresql", "mysql", "mongodb", "database"],
}


def compute_score(tags: list, title: str, desc: str):
    """Score a job 0-100 based on skill keyword matches."""
    user_skills = [s.lower() for s in USER_PROFILE["skills"]]
    text = " ".join([" ".join(tags), title or "", (desc or "")[:500]]).lower()

    matched = []
    score   = 0.0
    for skill in user_skills:
        aliases = SKILL_ALIASES.get(skill.lower(), [skill.lower()])
        if any(alias in text for alias in aliases):
            matched.append(skill)
            score += 100 / len(user_skills)

    return round(score, 1), matched


def fetch_jobs() -> list:
    """Fetch jobs from RemoteOK, score them, and return sorted results."""
    try:
        resp = requests.get(REMOTEOK_API, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[RemoteOK] Error: {e}")
        return []

    # First element is a legal notice dict — skip it
    jobs_raw = [j for j in data if isinstance(j, dict) and "position" in j]
    results  = []

    for job in jobs_raw:
        title = job.get("position", "")
        tags  = job.get("tags", []) or []
        desc  = job.get("description", "")
        score, matched = compute_score(tags, title, desc)

        if score < 20:
            continue  # Skip irrelevant jobs

        results.append({
            "title":          title,
            "company":        job.get("company", "Unknown"),
            "location":       job.get("location", "Remote"),
            "job_type":       "remote",
            "salary":         job.get("salary", "Not specified"),
            "skills_matched": ", ".join(matched),
            "url":            job.get("url", f"https://remoteok.com/remote-jobs/{job.get('id','')}"),
            "source":         "RemoteOK",
            "description":    desc[:1000],
            "score":          score,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:MAX_JOBS_PER_RUN]


if __name__ == "__main__":
    jobs = fetch_jobs()
    print(f"Found {len(jobs)} matching jobs")
    for j in jobs[:5]:
        print(f"  [{j['score']}%] {j['title']} @ {j['company']} | {j['skills_matched']}")
