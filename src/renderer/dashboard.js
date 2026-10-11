'use strict';
let T = {}, lang = 'zh', settings = {}, hooksState = {}, remindersList = [];
const $ = (id) => document.getElementById(id);
const t = (k) => T[k] || k;

document.querySelectorAll('#tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab').forEach((s) => s.classList.remove('active'));
    $(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

function applyStrings() {
  $('title').textContent = T.appName || 'Trump on Desk';
  $('subtitle').textContent = T.appSub || '';
  document.querySelector('[data-tab=sessions]').textContent = t('tabSessions');
  document.querySelector('[data-tab=agents]').textContent = t('tabAgents');
  document.querySelector('[data-tab=settings]').textContent = t('tabSettings');
  document.querySelector('[data-tab=reminders]').textContent = t('tabReminders');
  $('langBtn').textContent = lang === 'zh' ? 'EN' : '中文';
  $('sessionsTitle').textContent = t('tabSessions');
  $('logTitle').textContent = t('recentEvents');
  $('noSessions').textContent = t('noSessions');
  $('agentsHint').textContent = t('agentsHint');
  $('remTitle').textContent = t('addReminder');
  $('remAdd').textContent = t('addReminder');
  $('remText').placeholder = t('reminderText');
  $('lblLanguage').textContent = t('language');
  $('lblStyle').textContent = t('petStyle');
  $('lblSize').textContent = t('petSize');
  $('lblTop').textContent = t('alwaysOnTop');
  $('lblSleep').textContent = t('autoSleep');
  $('lblVisible').textContent = t('petVisible');
  renderAgents();
}

function stateLabel(s) {
  const map = { idle: t('stateIdle'), thinking: t('stateThinking'), working: t('stateWorking'),
    celebrate: t('stateCelebrate'), error: t('stateError'), sleep: t('stateSleep'),
    notification: t('stateNotification'), subagent: t('stateHappy') };
  return map[s] || s;
}

function renderSessions(snap) {
  $('sessionsHead').innerHTML = `<th>${t('colAgent')}</th><th>${t('colFolder')}</th><th>${t('colState')}</th><th>${t('colLastEvent')}</th><th>${t('colEvents')}</th>`;
  const body = $('sessionsBody'); body.innerHTML = '';
  const list = (snap && snap.sessions) || [];
  $('noSessions').style.display = list.length ? 'none' : 'block';
  for (const s of list) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><b>${s.agent}</b></td><td>${s.cwd || '—'}</td><td><span class="pill ${s.state}">${stateLabel(s.state)}</span></td><td>${s.lastEvent || '—'}</td><td>${s.events}</td>`;
    body.appendChild(tr);
  }
  const log = $('eventLog'); log.innerHTML = '';
  for (const ev of ((snap && snap.log) || []).slice(0, 15)) {
    const li = document.createElement('li');
    li.innerHTML = `<span><b>${ev.agent}</b> ${ev.event}</span><span>${new Date(ev.ts).toLocaleTimeString()}</span>`;
    log.appendChild(li);
  }
}

const AGENTS = [
  { id: 'claude', descKey: 'claudeDesc' },
  { id: 'codex', descKey: 'codexDesc' },
  { id: 'cursor', descKey: 'cursorDesc' },
];

function renderAgents() {
  const wrap = $('agentCards'); wrap.innerHTML = '';
  for (const a of AGENTS) {
    const st = hooksState[a.id] || {};
    const badge = st.active ? `<span class="status ok">${t('installed')}</span>` : `<span class="status warn">${t('notInstalled')}</span>`;
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.innerHTML = `<div><h3>${a.id}</h3><p>${t(a.descKey)}</p></div>
      <div style="display:flex;gap:8px;align-items:center">${badge}
      <button class="small">${st.active ? t('uninstall') : t('install')}</button></div>`;
    card.querySelector('button').addEventListener('click', async (e) => {
      e.target.disabled = true;
      try {
        hooksState = st.active ? await window.api.hooksUninstall(a.id) : await window.api.hooksInstall(a.id);
      } finally { renderAgents(); }
    });
    wrap.appendChild(card);
  }
}

function renderSettings() {
  $('optTop').checked = !!settings.alwaysOnTop;
  $('optSleep').checked = !!settings.autoSleep;
  $('optVisible').checked = !!settings.petVisible;
  $('sizePicker').innerHTML = '';
  for (const s of [0.8, 1, 1.2, 1.4]) {
    const b = document.createElement('button');
    b.textContent = s;
    if (Math.abs(settings.petScale - s) < 0.01) b.classList.add('active');
    b.addEventListener('click', () => update({ petScale: s }));
    $('sizePicker').appendChild(b);
  }
  $('langPicker').innerHTML = '';
  for (const l of ['zh', 'en']) {
    const b = document.createElement('button');
    b.textContent = l === 'zh' ? t('languageZh') : t('languageEn');
    if (lang === l) b.classList.add('active');
    b.addEventListener('click', () => update({ language: l }));
    $('langPicker').appendChild(b);
  }
  $('stylePicker').innerHTML = '';
  for (const s of ['cartoon', 'pixel']) {
    const b = document.createElement('button');
    b.textContent = s === 'cartoon' ? t('styleCartoon') : t('stylePixel');
    if ((settings.petStyle || 'cartoon') === s) b.classList.add('active');
    b.addEventListener('click', () => update({ petStyle: s }));
    $('stylePicker').appendChild(b);
  }
}

async function update(patch) {
  settings = await window.api.updateSettings(patch);
  location.reload();
}

function renderReminders() {
  $('remList').innerHTML = '';
  for (const r of remindersList) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${r.text} · ${new Date(r.fireAt).toLocaleString()}</span>`;
    const btn = document.createElement('button');
    btn.className = 'small'; btn.textContent = '×';
    btn.addEventListener('click', async () => { remindersList = await window.api.removeReminder(r.id); renderReminders(); });
    li.appendChild(btn); $('remList').appendChild(li);
  }
  if (!remindersList.length) { const li = document.createElement('li'); li.textContent = t('noReminders'); $('remList').appendChild(li); }
}

function wireReminders() {
  const mins = [1, 5, 10, 30, 60];
  const wrap = $('quickMins');
  let chosen = 5;
  for (const m of mins) {
    const b = document.createElement('button');
    b.className = 'small' + (m === chosen ? ' active' : '');
    b.textContent = lang === 'zh' ? `${m} 分钟` : `${m} min`;
    b.addEventListener('click', () => {
      chosen = m;
      wrap.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    });
    wrap.appendChild(b);
  }
  $('remAdd').addEventListener('click', async () => {
    const text = $('remText').value.trim();
    if (!text) return;
    remindersList = await window.api.addReminder(text, chosen);
    $('remText').value = ''; renderReminders();
  });
}

async function boot() {
  const all = await window.api.getAll();
  settings = all.settings; T = all.i18n || {}; lang = settings.language;
  hooksState = all.hooks || {}; remindersList = all.reminders || [];
  applyStrings(); renderSettings(); renderReminders(); wireReminders();
  window.api.onSnapshot((snap) => renderSessions(snap));
  renderSessions({ sessions: [], log: [] });
}
boot();
