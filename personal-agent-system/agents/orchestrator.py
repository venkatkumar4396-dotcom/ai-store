"""
agents/orchestrator.py - Master Coordinator Agent
Runs the full pipeline: scrape → save → notify → log
"""
import sys
import pathlib
import datetime

BASE_DIR = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from tools.job_scrapers.remoteok_scraper import fetch_jobs as fetch_remoteok
from tools.db_manager import init_db, save_job, get_new_jobs, log_search_run, get_stats
from tools.whatsapp_notifier import send_whatsapp, format_job_summary
from config.settings import MAX_JOBS_PER_RUN

try:
    from rich.console import Console
    from rich.table import Table
    from rich import print as rprint
    console = Console()
    USE_RICH = True
except ImportError:
    USE_RICH = False
    console = None


def log(msg):
    if USE_RICH:
        rprint(msg)
    else:
        print(msg)


def run_job_search() -> dict:
    """Main orchestration function — one full search cycle."""
    init_db()
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log(f"\n{'='*60}")
    log(f"[bold cyan]Job Agent — Search Cycle[/bold cyan]  {timestamp}" if USE_RICH else f"Job Agent — {timestamp}")
    log(f"{'='*60}")

    # Step 1: Scrape job boards
    log("\n[Step 1] Scraping job boards...")
    all_jobs = []

    remoteok_jobs = fetch_remoteok()
    all_jobs.extend(remoteok_jobs)
    log(f"  RemoteOK: {len(remoteok_jobs)} jobs found")

    # Step 2: Save new jobs to DB
    log("\n[Step 2] Saving to database...")
    new_count = 0
    for job in all_jobs:
        if save_job(job):
            new_count += 1
    dupes = len(all_jobs) - new_count
    log(f"  {new_count} new jobs saved | {dupes} duplicates skipped")

    # Step 3: Get top matches
    top_jobs = get_new_jobs(limit=5)

    # Step 4: Print summary table
    log("\n[Step 3] Top Matches:")
    for job in top_jobs:
        log(f"  [{job['score']}%] {job['title']} @ {job['company']} | {job['skills_matched']}")

    # Step 5: Send WhatsApp notification
    log("\n[Step 4] Sending WhatsApp notification...")
    stats    = get_stats()
    notified = 0
    if top_jobs:
        msg      = format_job_summary(top_jobs, stats["new"])
        notified = 1 if send_whatsapp(msg) else 0
    else:
        log("  No new jobs to notify about.")

    # Step 6: Log the run
    log_search_run(new_count, notified)

    log(f"\nDone! {new_count} new jobs found. Total in DB: {stats['total']}\n")
    return {"new_jobs": new_count, "total": stats["total"], "top": top_jobs}


if __name__ == "__main__":
    run_job_search()
