# config/settings.py — User Profile & Configuration
import os
import pathlib
from dotenv import load_dotenv

load_dotenv()

# ── User Profile ──────────────────────────────────────────────
USER_PROFILE = {
    "name":             "Venkat",
    "role":             "Software Developer / Engineer",
    "skills":           ["Python", "JavaScript", "TypeScript", "Node.js", "React", "Next.js", "SQL", "Databases"],
    "location":         "India",
    "experience_years": 2,      # ← Update this
    "min_salary_lpa":   6,      # ← Minimum salary (Lakhs Per Annum)
    "job_types":        ["full-time", "remote", "hybrid"],
}

# ── Search Keywords ───────────────────────────────────────────
SEARCH_KEYWORDS = [
    "software developer python",
    "javascript developer india",
    "react developer remote",
    "node.js developer india",
    "fullstack developer india",
    "software engineer remote india",
]

# ── API Keys (loaded from .env) ───────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
TWILIO_SID     = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH    = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM    = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
WHATSAPP_TO    = os.getenv("WHATSAPP_TO", "whatsapp:+91XXXXXXXXXX")  # ← Your number

# ── Scheduler — daily at 8:00 AM ─────────────────────────────
SEARCH_HOUR   = 8
SEARCH_MINUTE = 0

# ── Database path ─────────────────────────────────────────────
BASE_DIR = pathlib.Path(__file__).parent.parent
DB_PATH  = str(BASE_DIR / "data" / "jobs.db")

# ── Limits ────────────────────────────────────────────────────
MAX_JOBS_PER_RUN = 20
