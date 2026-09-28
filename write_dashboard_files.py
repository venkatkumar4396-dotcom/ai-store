"""
write_dashboard_files.py - One-time script to write dashboard CSS, JS, and README
Run: python write_dashboard_files.py
"""
import os

BASE = r"c:\work\personal-agent-system"

# ── style.css ──────────────────────────────────────────────────────────────────
CSS = r"""/* dashboard/style.css - Premium Dark Dashboard */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #0d1117;
  --bg2:       #161b22;
  --bg3:       #1f2937;
  --border:    #30363d;
  --text:      #e6edf3;
  --muted:     #8b949e;
  --accent:    #58a6ff;
  --green:     #3fb950;
  --yellow:    #d29922;
  --orange:    #f0883e;
  --red:       #f85149;
  --purple:    #bc8cff;
}

body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding-bottom: 3rem; }

header { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 2rem; background: var(--bg2); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px); }
.logo { display: flex; align-items: center; gap: 1rem; }
.logo-icon { font-size: 2rem; }
.logo h1 { font-size: 1.4rem; font-weight: 700; color: var(--accent); }
.logo p  { font-size: 0.8rem; color: var(--muted); }
.btn-run { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.4rem; background: var(--accent); color: #0d1117; border: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.btn-run:hover { background: #79bbff; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(88,166,255,0.3); }
.btn-run:disabled { opacity: 0.6; cursor: not-allowed; }

.stats-bar { display: flex; gap: 1rem; padding: 1.5rem 2rem; overflow-x: auto; }
.stat-card { flex: 1; min-width: 120px; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 1.2rem 1.5rem; cursor: pointer; transition: all 0.2s; text-align: center; }
.stat-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.stat-card.active { border-color: var(--accent); background: rgba(88,166,255,0.08); }
.stat-card.new .stat-value        { color: var(--accent); }
.stat-card.interested .stat-value { color: var(--yellow); }
.stat-card.applied .stat-value    { color: var(--green); }
.stat-card.rejected .stat-value   { color: var(--red); }
.stat-value { font-size: 2rem; font-weight: 700; }
.stat-label { font-size: 0.8rem; color: var(--muted); margin-top: 0.3rem; text-transform: uppercase; letter-spacing: 0.05em; }

.filter-bar { display: flex; align-items: center; gap: 0.6rem; padding: 0 2rem 1.2rem; flex-wrap: wrap; }
.filter-btn { padding: 0.45rem 1rem; background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; color: var(--muted); font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
.filter-btn:hover, .filter-btn.active { background: var(--accent); border-color: var(--accent); color: #0d1117; font-weight: 600; }
#searchInput { margin-left: auto; padding: 0.45rem 1rem; background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; color: var(--text); font-size: 0.85rem; width: 220px; outline: none; transition: border-color 0.2s; }
#searchInput:focus { border-color: var(--accent); }

.jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.2rem; padding: 0 2rem; }

.job-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; padding: 1.4rem; transition: all 0.25s; position: relative; overflow: hidden; animation: fadeIn 0.3s ease; }
.job-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); opacity: 0; transition: opacity 0.2s; }
.job-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.job-card:hover::before { opacity: 1; }

.job-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.8rem; }
.job-title { font-size: 1rem; font-weight: 600; color: var(--text); flex: 1; }
.job-score { background: rgba(88,166,255,0.15); color: var(--accent); border-radius: 20px; padding: 0.2rem 0.7rem; font-size: 0.78rem; font-weight: 600; white-space: nowrap; }
.job-score.high { background: rgba(63,185,80,0.15);  color: var(--green); }
.job-score.mid  { background: rgba(210,153,34,0.15); color: var(--yellow); }
.job-score.low  { background: rgba(248,81,73,0.15);  color: var(--red); }

.job-company { color: var(--muted); font-size: 0.88rem; margin-bottom: 0.5rem; }
.job-company span { color: var(--text); font-weight: 500; }
.job-meta { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
.badge { background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; padding: 0.2rem 0.6rem; font-size: 0.75rem; color: var(--muted); }

.skills-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1rem; }
.skill-tag { background: rgba(88,166,255,0.1); color: var(--accent); border-radius: 4px; padding: 0.15rem 0.5rem; font-size: 0.72rem; font-weight: 500; }

.job-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.action-btn { flex: 1; padding: 0.5rem 0.7rem; border: 1px solid var(--border); border-radius: 8px; background: transparent; color: var(--muted); font-size: 0.78rem; cursor: pointer; transition: all 0.2s; text-align: center; }
.action-btn:hover      { background: var(--bg3); color: var(--text); }
.action-btn.interested { border-color: var(--yellow); color: var(--yellow); }
.action-btn.applied    { border-color: var(--green);  color: var(--green); }
.action-btn.rejected   { border-color: var(--red);    color: var(--red); }
.action-btn.link       { border-color: var(--accent);  color: var(--accent); }

.status-badge { position: absolute; top: 1rem; right: 1rem; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.status-new        { background: rgba(88,166,255,0.15); color: var(--accent); }
.status-interested { background: rgba(210,153,34,0.15); color: var(--yellow); }
.status-applied    { background: rgba(63,185,80,0.15);  color: var(--green); }
.status-rejected   { background: rgba(248,81,73,0.15);  color: var(--red); }

.empty-state { grid-column: 1/-1; text-align: center; padding: 5rem 2rem; color: var(--muted); }
.empty-state h2 { margin: 1rem 0 0.5rem; color: var(--text); }

.toast { position: fixed; bottom: 2rem; right: 2rem; background: var(--bg2); border: 1px solid var(--green); color: var(--green); padding: 0.8rem 1.5rem; border-radius: 10px; font-size: 0.9rem; z-index: 999; animation: fadeIn 0.3s; }
.toast.error { border-color: var(--red); color: var(--red); }
.hidden { display: none !important; }

.spinner { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

@media (max-width: 600px) {
  header { padding: 1rem; }
  .stats-bar, .jobs-grid { padding: 1rem; }
  .filter-bar { padding: 0 1rem 1rem; }
  #searchInput { width: 100%; margin-left: 0; }
}
"""

# ── app.js ─────────────────────────────────────────────────────────────────────
JS = """// dashboard/app.js - Job Agent Dashboard Logic
let allJobs = [];
let currentFilter = '';

async function loadStats() {
  const res = await fetch('/api/stats');
  const s = await res.json();
  document.getElementById('statTotal').textContent     = s.total     || 0;
  document.getElementById('statNew').textContent       = s.new       || 0;
  document.getElementById('statInterested').textContent = s.interested || 0;
  document.getElementById('statApplied').textContent   = s.applied   || 0;
  document.getElementById('statRejected').textContent  = s.rejected  || 0;
}

async function loadJobs(status = '') {
  const url = status ? `/api/jobs?status=${status}` : '/api/jobs';
  const res  = await fetch(url);
  allJobs    = await res.json();
  renderCards(allJobs);
}

function renderCards(jobs) {
  const grid  = document.getElementById('jobsGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '';

  if (!jobs.length) {
    grid.appendChild(empty);
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.dataset.id = job.id;

    const score = job.score || 0;
    const scoreClass = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
    const skills = (job.skills_matched || '').split(',').filter(Boolean);
    const skillTags = skills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join('');
    const date = job.found_at ? new Date(job.found_at).toLocaleDateString('en-IN') : '';

    card.innerHTML = `
      <div class="status-badge status-${job.status}">${job.status}</div>
      <div class="job-header">
        <div class="job-title">${escHtml(job.title)}</div>
        <div class="job-score ${scoreClass}">${score}%</div>
      </div>
      <div class="job-company">Company: <span>${escHtml(job.company || 'Unknown')}</span></div>
      <div class="job-meta">
        <span class="badge">📍 ${escHtml(job.location || 'Remote')}</span>
        <span class="badge">💼 ${escHtml(job.job_type || 'Full-time')}</span>
        ${job.salary && job.salary !== 'Not specified' ? `<span class="badge">💰 ${escHtml(job.salary)}</span>` : ''}
        ${date ? `<span class="badge">📅 ${date}</span>` : ''}
      </div>
      ${skillTags ? `<div class="skills-row">${skillTags}</div>` : ''}
      <div class="job-actions">
        <button class="action-btn interested" onclick="setStatus(${job.id}, 'interested')">⭐ Interested</button>
        <button class="action-btn applied"    onclick="setStatus(${job.id}, 'applied')">✅ Applied</button>
        <button class="action-btn rejected"   onclick="setStatus(${job.id}, 'rejected')">❌ Skip</button>
        <a class="action-btn link" href="${escHtml(job.url || '#')}" target="_blank">🔗 View</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

async function setStatus(id, status) {
  await fetch(`/api/job/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  showToast(`Marked as ${status}!`);
  await loadStats();
  await loadJobs(currentFilter);
}

async function runNow() {
  const btn = document.getElementById('runNowBtn');
  const spinner = document.getElementById('spinner');
  btn.disabled = true;
  spinner.classList.remove('hidden');
  showToast('Running job search... this may take 30 seconds.');
  try {
    const res = await fetch('/api/run-now', { method: 'POST' });
    const data = await res.json();
    showToast(`Done! Found ${data.new_jobs} new jobs.`);
    await loadStats();
    await loadJobs(currentFilter);
  } catch (e) {
    showToast('Error running search. Check console.', true);
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
  }
}

function filterCards() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allJobs.filter(j =>
    (j.title || '').toLowerCase().includes(q) ||
    (j.company || '').toLowerCase().includes(q) ||
    (j.skills_matched || '').toLowerCase().includes(q)
  );
  renderCards(filtered);
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// Filter buttons
document.querySelectorAll('.filter-btn, .stat-card').forEach(btn => {
  btn.addEventListener('click', async () => {
    const f = btn.dataset.filter ?? '';
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.stat-card').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    await loadJobs(f);
  });
});

// Init
(async () => {
  await loadStats();
  await loadJobs();
  // Auto-refresh every 60 seconds
  setInterval(async () => { await loadStats(); await loadJobs(currentFilter); }, 60000);
})();
"""

# ── README.md ──────────────────────────────────────────────────────────────────
README = """# Personal AI Job Agent System

Your automated job search assistant that finds software developer jobs daily and notifies you on WhatsApp.

## Features
- Searches RemoteOK for Software Developer / Engineer jobs daily
- Scores and ranks jobs based on your skills (Python, JS, Node.js, React, SQL)
- Sends WhatsApp notification with top matches every morning
- Local dashboard to track all jobs and mark status

## Quick Start

### 1. Setup environment
```bash
cd c:\\work\\personal-agent-system
pip install -r requirements.txt
```

### 2. Configure your details
Copy `.env.example` to `.env` and fill in:
- `GEMINI_API_KEY` — Free from https://aistudio.google.com
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — Free sandbox from https://console.twilio.com
- `WHATSAPP_TO` — Your WhatsApp number e.g. `whatsapp:+919876543210`

Also update `config/settings.py`:
- Set your `experience_years`
- Set your `min_salary_lpa`

### 3. Run once immediately
```bash
python scheduler.py --now
```

### 4. Open the dashboard
```bash
python dashboard/api.py
# Then open http://localhost:5000
```

### 5. Start the daily scheduler
```bash
python scheduler.py
# Runs every day at 8:00 AM automatically
```

## Project Structure
```
personal-agent-system/
├── agents/
│   └── orchestrator.py       # Master coordinator
├── tools/
│   ├── job_scrapers/
│   │   └── remoteok_scraper.py
│   ├── db_manager.py         # SQLite storage
│   └── whatsapp_notifier.py  # WhatsApp via Twilio
├── dashboard/
│   ├── api.py                # Flask API + server
│   ├── index.html            # Dashboard UI
│   ├── style.css             # Dark theme styles
│   └── app.js                # Frontend logic
├── config/
│   └── settings.py           # Your profile & settings
├── data/
│   └── jobs.db               # Auto-created SQLite DB
├── scheduler.py              # Daily scheduler
└── requirements.txt
```

## Job Status Flow
- **new** — Just found, not reviewed
- **interested** — You want to apply
- **applied** — You've applied
- **rejected** — Not relevant, skip
"""

files = {
    os.path.join(BASE, "dashboard", "style.css"): CSS,
    os.path.join(BASE, "dashboard", "app.js"): JS,
    os.path.join(BASE, "README.md"): README,
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Written: {path}")

print("\nAll files written successfully!")
