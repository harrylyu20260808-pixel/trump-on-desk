// Zero-dep unit tests: node test/run-tests.js
'use strict';
const assert = require('node:assert');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const { EVENTS, normalize, CLAUDE_MAP } = require('../src/shared/protocol');
const { StateMachine, STATES } = require('../src/main/state-machine');
const hooks = require('../src/main/hooks');
const codex = require('../src/main/codex-poll');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok', name); }
  catch (e) { console.error('  FAIL', name, '\n   ', e.message); process.exitCode = 1; }
}

test('claude PreToolUse -> tool_start', () => {
  const r = normalize('claude', { hook_event_name: 'PreToolUse', session_id: 's1' });
  assert.strictEqual(r.event, EVENTS.TOOL_START);
});
test('cursor beforeSubmitPrompt -> user_prompt', () => {
  const r = normalize('cursor', { event: 'beforeSubmitPrompt' });
  assert.strictEqual(r.event, EVENTS.USER_PROMPT);
});
test('unknown event falls back to thinking', () => {
  const r = normalize('claude', { hook_event_name: 'Whatever' });
  assert.strictEqual(r.event, EVENTS.THINKING);
});
test('tool_start beats thinking', () => {
  const sm = new StateMachine({ sleepAfterMs: 60000 });
  sm.ingest({ agent: 'claude', event: EVENTS.USER_PROMPT, sessionId: 'a', ts: Date.now() });
  sm.ingest({ agent: 'claude', event: EVENTS.TOOL_START, sessionId: 'a', ts: Date.now() });
  assert.strictEqual(sm.current, STATES.WORKING);
  sm.destroy();
});
test('error outranks working', () => {
  const sm = new StateMachine({ sleepAfterMs: 60000 });
  sm.ingest({ agent: 'claude', event: EVENTS.TOOL_START, sessionId: 'a', ts: Date.now() });
  sm.ingest({ agent: 'claude', event: EVENTS.TOOL_ERROR, sessionId: 'a', ts: Date.now() });
  assert.strictEqual(sm.current, STATES.ERROR);
  sm.destroy();
});
test('user interaction override wins then restores', () => {
  const sm = new StateMachine({ sleepAfterMs: 60000 });
  sm.ingest({ agent: 'claude', event: EVENTS.USER_PROMPT, sessionId: 'a', ts: Date.now() });
  sm.userInteraction('cola', 3000);
  assert.strictEqual(sm.current, 'cola');
  sm.overrideUntil = Date.now() - 1;
  sm.recompute();
  assert.strictEqual(sm.current, STATES.THINKING);
  sm.destroy();
});
test('session_end removes session', () => {
  const sm = new StateMachine({ sleepAfterMs: 60000 });
  sm.ingest({ agent: 'claude', event: EVENTS.TOOL_START, sessionId: 'a', ts: Date.now() });
  sm.ingest({ agent: 'claude', event: EVENTS.SESSION_END, sessionId: 'a', ts: Date.now() });
  assert.strictEqual(sm.sessions.size, 0);
  sm.destroy();
});
test('idle then sleep after timeout', () => {
  const sm = new StateMachine({ sleepAfterMs: 50 });
  sm.lastActivityAt = Date.now() - 1000;
  sm.recompute();
  assert.strictEqual(sm.current, STATES.SLEEP);
  sm.destroy();
});
test('codex classify: output before call', () => {
  assert.strictEqual(codex.classifyLine('{"type":"user_message"}'), EVENTS.USER_PROMPT);
  assert.strictEqual(codex.classifyLine('{"type":"function_call"}'), EVENTS.TOOL_START);
  assert.strictEqual(codex.classifyLine('{"type":"function_call_output"}'), EVENTS.TOOL_END);
  assert.strictEqual(codex.classifyLine('not json'), null);
});

const fakeHome = path.join(os.tmpdir(), 'tod-test-' + Date.now());
fs.mkdirSync(path.join(fakeHome, '.claude'), { recursive: true });
const realHome = os.homedir;
os.homedir = () => fakeHome;
try {
  test('claude install is idempotent + detected', () => {
    const ud = path.join(fakeHome, 'userdata');
    hooks.install('claude', ud);
    hooks.install('claude', ud);
    const cfg = JSON.parse(fs.readFileSync(path.join(fakeHome, '.claude', 'settings.json'), 'utf8'));
    assert.strictEqual(cfg.hooks.UserPromptSubmit.length, 1);
    assert.ok(hooks.detect().claude.active);
    hooks.uninstall('claude');
    assert.ok(!hooks.detect().claude.active);
  });
} finally {
  os.homedir = realHome;
}

console.log(`\n${passed} tests passed`);
