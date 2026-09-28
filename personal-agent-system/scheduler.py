"""
scheduler.py - Daily Job Agent Scheduler

Usage:
  python scheduler.py          - Start daily scheduler (runs at 8:00 AM)
  python scheduler.py --now    - Run once immediately right now
"""
import sys
import argparse
import pathlib

BASE_DIR = pathlib.Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))

from agents.orchestrator import run_job_search
from config.settings import SEARCH_HOUR, SEARCH_MINUTE


def start_scheduler():
    """Start the APScheduler to run daily at configured time."""
    from apscheduler.schedulers.blocking import BlockingScheduler

    scheduler = BlockingScheduler()
    scheduler.add_job(
        run_job_search,
        trigger="cron",
        hour=SEARCH_HOUR,
        minute=SEARCH_MINUTE,
        id="daily_job_search",
    )
    print(f"Scheduler started! Runs daily at {SEARCH_HOUR:02d}:{SEARCH_MINUTE:02d}")
    print("Press Ctrl+C to stop.\n")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\nScheduler stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Personal Job Agent Scheduler")
    parser.add_argument("--now", action="store_true", help="Run search immediately")
    args = parser.parse_args()

    if args.now:
        print("Running job search NOW...")
        run_job_search()
    else:
        start_scheduler()
