# Personal AI Job Agent System 🤖

Your automated job search assistant — finds Software Developer jobs daily and notifies you on WhatsApp.

## Features
- 🔍 Searches RemoteOK for developer jobs daily
- ⭐ Scores & ranks jobs based on your skills (Python, JS, Node.js, React, SQL)
- 💬 Sends WhatsApp notification every morning with top matches
- 📊 Local dashboard to track all jobs & update status

---

## Quick Start

### Step 1 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 2 — Configure your details
```bash
copy .env.example .env
```
Then edit `.env` and fill in:
- `GEMINI_API_KEY` — Free from https://aistudio.google.com
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — Free sandbox from https://console.twilio.com
- `WHATSAPP_TO` — Your WhatsApp number e.g. `whatsapp:+919876543210`

Also edit `config/settings.py`:
- Set `experience_years` (your years of experience)
- Set `min_salary_lpa` (minimum salary you want)

### Step 3 — Run a job search NOW
```bash
python scheduler.py --now
```

### Step 4 — Open the Dashboard
```bash
python dashboard/api.py
```
Then open **http://localhost:5000** in your browser.

### Step 5 — Start Daily Auto-Search (runs at 8 AM every day)
```bash
python scheduler.py
```

---

## Project Structure
```
personal-agent-system/
├── agents/
│   └── orchestrator.py       # Master coordinator agent
├── tools/
│   ├── job_scrapers/
│   │   └── remoteok_scraper.py  # RemoteOK API scraper
│   ├── db_manager.py         # SQLite job storage
│   └── whatsapp_notifier.py  # WhatsApp via Twilio
├── dashboard/
│   ├── api.py                # Flask API + web server
│   ├── index.html            # Dashboard UI
│   ├── style.css             # Premium dark theme
│   └── app.js                # Frontend JavaScript
├── config/
│   └── settings.py           # Your profile & settings
├── data/
│   └── jobs.db               # SQLite DB (auto-created)
├── scheduler.py              # Daily scheduler
├── requirements.txt
└── .env.example              # API keys template
```

---

## Job Status Flow
| Status | Meaning |
|--------|---------|
| `new` | Just found, not reviewed yet |
| `interested` | You want to apply to this |
| `applied` | You've already applied |
| `rejected` | Not relevant, skip |

---

## Getting API Keys (Free)

### Gemini API Key
1. Go to https://aistudio.google.com
2. Click "Get API Key" → Create API Key
3. Copy it into your `.env` file

### Twilio WhatsApp (Free Sandbox)
1. Go to https://console.twilio.com
2. Sign up free → Go to Messaging → Try it out → WhatsApp
3. Follow the sandbox setup (send a WhatsApp message to activate)
4. Copy your Account SID and Auth Token into `.env`
5. Send `join <sandbox-word>` to the Twilio number from your WhatsApp
