// dashboard/app.js - Job Agent Dashboard Logic
let allJobs = [];
let currentFilter = '';

async function loadStats() {
  const s = await (await fetch('/api/stats')).json();
  document.getElementById('statTotal').textContent      = s.total      || 0;
  document.getElementById('statNew').textContent        = s.new        || 0;
  document.getElementById('statInterested').textContent = s.interested || 0;
  document.getElementById('statApplied').textContent    = s.applied    || 0;
  document.getElementById('statRejected').textContent   = s.rejected   || 0;
}

async function loadJobs(status = '') {
  const url = status ? `/api/jobs?status=${status}` : '/api/jobs';
  allJobs = await (await fetch(url)).json();
  renderCards(allJobs);
}

function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
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
    const score  = job.score || 0;
    const sc     = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
    const skills = (job.skills_matched || '').split(',').filter(Boolean)
      .map(s => `<span class="skill-tag">${esc(s.trim())}</span>`).join('');
    const date   = job.found_at ? new Date(job.found_at).toLocaleDateString('en-IN') : '';

    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="status-badge status-${esc(job.status)}">${esc(job.status)}</div>
      <div class="job-header">
        <div class="job-title">${esc(job.title)}</div>
        <div class="job-score ${sc}">${score}%</div>
      </div>
      <div class="job-company">Company: <span>${esc(job.company || 'Unknown')}</span></div>
      <div class="job-meta">
        <span class="badge">📍 ${esc(job.location || 'Remote')}</span>
        <span class="badge">💼 ${esc(job.job_type || 'Full-time')}</span>
        ${job.salary && job.salary !== 'Not specified' ? `<span class="badge">💰 ${esc(job.salary)}</span>` : ''}
        ${date ? `<span class="badge">📅 ${date}</span>` : ''}
      </div>
      ${skills ? `<div class="skills-row">${skills}</div>` : ''}
      <div class="job-actions">
        <button class="action-btn interested" onclick="setStatus(${job.id},'interested')">⭐ Interested</button>
        <button class="action-btn applied"    onclick="setStatus(${job.id},'applied')">✅ Applied</button>
        <button class="action-btn rejected"   onclick="setStatus(${job.id},'rejected')">❌ Skip</button>
        <a class="action-btn link" href="${esc(job.url || '#')}" target="_blank">🔗 View</a>
      </div>`;
    grid.appendChild(card);
  });
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
  btn.disabled = true;
  document.getElementById('spinner').classList.remove('hidden');
  showToast('Running job search... ~30 seconds.');
  try {
    const data = await (await fetch('/api/run-now', { method: 'POST' })).json();
    showToast(`Done! Found ${data.new_jobs} new jobs.`);
    await loadStats();
    await loadJobs(currentFilter);
  } catch (e) {
    showToast('Search failed. Check terminal.', true);
  } finally {
    btn.disabled = false;
    document.getElementById('spinner').classList.add('hidden');
  }
}

function filterCards() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  renderCards(allJobs.filter(j =>
    (j.title || '').toLowerCase().includes(q) ||
    (j.company || '').toLowerCase().includes(q) ||
    (j.skills_matched || '').toLowerCase().includes(q)
  ));
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '');
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3500);
}

// Filter buttons & stat cards
document.querySelectorAll('.filter-btn, .stat-card').forEach(btn => {
  btn.addEventListener('click', async () => {
    currentFilter = btn.dataset.filter ?? '';
    document.querySelectorAll('.filter-btn, .stat-card').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    await loadJobs(currentFilter);
  });
});

// Init on load
(async () => {
  await loadStats();
  await loadJobs();
  // Auto-refresh every 60s
  setInterval(async () => {
    await loadStats();
    await loadJobs(currentFilter);
  }, 60000);
})();
