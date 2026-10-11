// Trump renderer: cartoon + pixel modes. State switching, blink, drag, clicks.
'use strict';

const BUBBLES = {
  thinking: ['Thinking…', '思考中…'],
  working: ['Working…', '写代码中…'],
  celebrate: ['Done!', '搞定！'],
  error: ['Oops', '出错了'],
  notification: ['Hi!', '嗨！'],
  cola: ['Refreshing!', '爽！'],
  thumbs: ['Great!', '真棒！'],
  rally: ['Trump on!', '冲鸭！'],
};

const svg = document.getElementById('pet');
const svgPx = document.getElementById('petPixel');
let lang = 'zh';
let style = 'cartoon';

function applyMode() {
  document.body.classList.toggle('pixel', style === 'pixel');
}

function setState(name) {
  for (const el of [svg, svgPx]) {
    for (const cls of [...el.classList].filter((c) => c.startsWith('state-'))) el.classList.remove(cls);
    el.classList.add(`state-${name}`);
  }
  const pair = BUBBLES[name];
  const text = pair ? (lang === 'zh' ? pair[1] : pair[0]) : '…';
  document.getElementById('bubbleText').textContent = text;
  document.getElementById('bubbleTextP').textContent = text;
  const showBubble = ['thinking', 'working', 'celebrate', 'error', 'notification', 'cola', 'thumbs', 'rally'].includes(name);
  document.getElementById('bubble').classList.toggle('hidden', !showBubble);
  document.getElementById('bubbleP').classList.toggle('hidden', !showBubble);
}

function blink() {
  const eyes = document.getElementById('eyes');
  const closed = document.getElementById('eyesClosed');
  const eyesP = document.getElementById('eyesP');
  const closedP = document.getElementById('eyesClosedP');
  eyes.style.display = 'none'; closed.style.display = 'inline';
  eyesP.style.display = 'none'; closedP.style.display = 'inline';
  setTimeout(() => {
    eyes.style.display = 'inline'; closed.style.display = 'none';
    eyesP.style.display = 'inline'; closedP.style.display = 'none';
  }, 150);
}

function trackPupils(e) {
  const r = svg.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const dx = Math.max(-2.5, Math.min(2.5, (e.clientX - cx) / 40));
  const dy = Math.max(-1.5, Math.min(1.5, (e.clientY - cy) / 40));
  svg.style.setProperty('--pupil-x', `${dx}px`);
  svg.style.setProperty('--pupil-y', `${dy}px`);
}

function wireDrag() {
  let down = null;
  window.addEventListener('pointerdown', (e) => { down = { x: e.screenX, y: e.screenY, moved: false }; });
  window.addEventListener('pointermove', (e) => {
    trackPupils(e);
    if (!down) return;
    const dx = e.screenX - down.x;
    const dy = e.screenY - down.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) down.moved = true;
    if (down.moved) window.api.drag(dx, dy);
  });
  window.addEventListener('pointerup', () => {
    if (down && !down.moved) window.api.interact('thumbs');
    down = null;
  });
  window.addEventListener('dblclick', () => window.api.interact('rally'));
  window.addEventListener('contextmenu', (e) => { e.preventDefault(); window.api.openMenu(); });
}

async function boot() {
  const all = await window.api.getAll();
  lang = (all.settings && all.settings.language) || 'zh';
  style = (all.settings && all.settings.petStyle) || 'cartoon';
  applyMode();
  window.api.onSnapshot((snap) => setState(snap.state));
  window.api.onSettings((s) => {
    if (s && s.petStyle) { style = s.petStyle; applyMode(); }
    if (s && s.language) { lang = s.language; setState(document.body.className.split('state-')[1] || 'idle'); }
  });
  wireDrag();
  setInterval(blink, 3600);
  setState('idle');
}

boot();
