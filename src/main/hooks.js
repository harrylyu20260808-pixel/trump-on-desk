// Installs / uninstalls / detects hooks for Claude Code and Cursor.
// Our callback is always staged as <userData>/hooks/emit.js; we match that
// path fragment (any separator) so uninstall only removes our own entries.
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MARKER_RE = /[\\/]hooks[\\/]emit\.js/;

function home() { return os.homedir(); }
function claudeSettingsPath() { return path.join(home(), '.claude', 'settings.json'); }
function cursorHooksPath() { return path.join(home(), '.cursor', 'hooks.json'); }

function readJsonSafe(file) {
  try { return { data: JSON.parse(fs.readFileSync(file, 'utf8')) }; }
  catch (_) { return { data: {} }; }
}

function writeJsonAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function copiesOwnEntry(command) {
  return typeof command === 'string' && MARKER_RE.test(command);
}

function stageEmit(userData, agent) {
  const hooksDir = path.join(userData, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  const target = path.join(hooksDir, 'emit.js');
  try {
    const src = path.join(__dirname, '..', '..', 'hooks', 'emit.js');
    fs.copyFileSync(src, target);
  } catch (_) { /* best effort; command still points here */ }
  return target;
}

function commandFor(emitJsPath) {
  return `node "${emitJsPath}"`;
}

const CLAUDE_EVENTS = [
  'SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse',
  'PostToolUse', 'PostToolUseFailure', 'Stop', 'SubagentStart',
  'SubagentStop', 'Notification',
];
const CURSOR_EVENTS = [
  'sessionStart', 'sessionEnd', 'beforeSubmitPrompt', 'onResponseStarted',
  'onResponseCompleted', 'onToolExecuting', 'onToolExecuted', 'onError',
];

function installClaude(userData) {
  const file = claudeSettingsPath();
  const emitJsPath = stageEmit(userData, 'claude');
  const { data } = readJsonSafe(file);
  data.hooks = data.hooks || {};
  for (const event of CLAUDE_EVENTS) {
    const buckets = Array.isArray(data.hooks[event]) ? data.hooks[event] : [];
    const mine = buckets.some((b) => (b.hooks || []).some((h) => copiesOwnEntry(h.command)));
    if (!mine) {
      buckets.push({
        matcher: '',
        hooks: [{ type: 'command', command: `${commandFor(emitJsPath)} claude ${event}`, timeout: 10 }],
      });
    }
    data.hooks[event] = buckets;
  }
  writeJsonAtomic(file, data);
}

function uninstallClaude() {
  const file = claudeSettingsPath();
  const { data } = readJsonSafe(file);
  if (!data.hooks) return;
  for (const event of Object.keys(data.hooks)) {
    const buckets = Array.isArray(data.hooks[event]) ? data.hooks[event] : [];
    const kept = buckets.filter((b) => !(b.hooks || []).every((h) => copiesOwnEntry(h.command)));
    if (kept.length) data.hooks[event] = kept; else delete data.hooks[event];
  }
  writeJsonAtomic(file, data);
}

function installCursor(userData) {
  const file = cursorHooksPath();
  const emitJsPath = stageEmit(userData, 'cursor');
  const { data } = readJsonSafe(file);
  data.hooks = data.hooks || {};
  for (const event of CURSOR_EVENTS) {
    const list = Array.isArray(data.hooks[event]) ? data.hooks[event] : [];
    const mine = list.some((h) => copiesOwnEntry(h.command));
    if (!mine) list.push({ command: `${commandFor(emitJsPath)} cursor ${event}` });
    data.hooks[event] = list;
  }
  writeJsonAtomic(file, data);
}

function uninstallCursor() {
  const file = cursorHooksPath();
  const { data } = readJsonSafe(file);
  if (!data.hooks) return;
  for (const event of Object.keys(data.hooks)) {
    const list = Array.isArray(data.hooks[event]) ? data.hooks[event] : [];
    const kept = list.filter((h) => !copiesOwnEntry(h.command));
    if (kept.length) data.hooks[event] = kept; else delete data.hooks[event];
  }
  writeJsonAtomic(file, data);
}

function scanActive(file, eventKeys) {
  if (!fs.existsSync(file)) return false;
  const { data } = readJsonSafe(file);
  for (const event of eventKeys) {
    const buckets = data.hooks && data.hooks[event];
    if (!Array.isArray(buckets)) continue;
    for (const b of buckets) {
      const list = Array.isArray(b) ? b : (b.hooks || [b]);
      if (list.some((h) => copiesOwnEntry(h.command))) return true;
    }
  }
  return false;
}

function detect() {
  return {
    claude: { active: scanActive(claudeSettingsPath(), CLAUDE_EVENTS), file: claudeSettingsPath() },
    cursor: { active: scanActive(cursorHooksPath(), CURSOR_EVENTS), file: cursorHooksPath() },
    codex: { active: fs.existsSync(path.join(home(), '.codex', 'sessions')) },
  };
}

function install(agent, userData) {
  if (agent === 'claude') return installClaude(userData);
  if (agent === 'cursor') return installCursor(userData);
  throw new Error(`unknown agent ${agent}`);
}
function uninstall(agent) {
  if (agent === 'claude') return uninstallClaude();
  if (agent === 'cursor') return uninstallCursor();
  throw new Error(`unknown agent ${agent}`);
}

module.exports = { install, uninstall, detect, MARKER_RE, codexSessionsDir: () => path.join(home(), '.codex', 'sessions') };
