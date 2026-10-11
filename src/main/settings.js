// Whitelisted settings persisted to userData/settings.json (atomic write).
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = Object.freeze({
  language: 'zh',
  petStyle: 'cartoon',
  petScale: 1,
  alwaysOnTop: true,
  autoSleep: true,
  petVisible: true,
  sleepAfterMs: 90_000,
});

const ALLOWED = new Set(Object.keys(DEFAULTS));

function load(file) {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) { /* missing/corrupt -> defaults */ }
  const out = { ...DEFAULTS };
  if (data && typeof data === 'object') {
    for (const key of ALLOWED) {
      if (key in data) out[key] = data[key];
    }
  }
  return out;
}

function save(file, settings) {
  const tmp = file + '.tmp';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(settings, null, 2));
  fs.renameSync(tmp, file);
}

function applyPatch(current, patch) {
  const next = { ...current };
  for (const [k, v] of Object.entries(patch || {})) {
    if (ALLOWED.has(k)) next[k] = v;
  }
  return next;
}

module.exports = { DEFAULTS, ALLOWED, load, save, applyPatch };
