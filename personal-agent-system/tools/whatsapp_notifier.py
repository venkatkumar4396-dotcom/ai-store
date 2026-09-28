"""
tools/whatsapp_notifier.py
Sends WhatsApp messages via Twilio sandbox (free).
"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from config.settings import TWILIO_SID, TWILIO_AUTH, TWILIO_FROM, WHATSAPP_TO


def send_whatsapp(message: str) -> bool:
    """Send a WhatsApp message. Falls back to console print if not configured."""
    if not TWILIO_SID or TWILIO_SID == "your_twilio_account_sid":
        # Strip emoji for Windows console compatibility
        safe_msg = message.encode("ascii", "ignore").decode("ascii")
        print("\n[WhatsApp] Twilio not configured - printing to console:")
        print("=" * 60)
        print(safe_msg)
        print("=" * 60)
        return True

    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_AUTH)
        msg = client.messages.create(from_=TWILIO_FROM, to=WHATSAPP_TO, body=message)
        print(f"[WhatsApp] Sent! SID: {msg.sid}")
        return True
    except Exception as e:
        print(f"[WhatsApp] Failed: {e}")
        return False


def format_job_summary(jobs: list, total_new: int) -> str:
    """Format top jobs into a WhatsApp message."""
    lines = [
        f"*🤖 Job Agent Report*",
        f"Found *{len(jobs)}* new jobs today! Total in DB: {total_new}",
        "",
        "*Top Matches:*",
    ]
    for i, job in enumerate(jobs[:5], 1):
        lines.append(
            f"\n{i}. *{job['title']}* @ {job['company']}\n"
            f"   📊 Match: {job['score']}%\n"
            f"   🛠 Skills: {job['skills_matched']}\n"
            f"   📍 {job['location']}\n"
            f"   🔗 {job['url']}"
        )
    lines.append("\n\n📊 Dashboard: http://localhost:5000")
    return "\n".join(lines)


if __name__ == "__main__":
    send_whatsapp("Hello from your Job Agent! System is running.")
