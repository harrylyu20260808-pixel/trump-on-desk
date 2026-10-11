// Session-aware state machine. Resolves the highest-priority state from all
// live sessions, user interactions and idle/sleep timers.
'use strict';

const { EVENTS } = require('../shared/protocol');

const STATES = Object.freeze({
  IDLE: 'idle',
  THINKING: 'thinking',
  WORKING: 'working',
  CELEBRATE: 'celebrate',
  ERROR: 'error',
  SLEEP: 'sleep',
  NOTIFICATION: 'notification',
  SUBAGENT: 'subagent',
});

// Higher number wins.
const PRIORITY = {
  [STATES.ERROR]: 100,
  [STATES.NOTIFICATION]: 90,
  [STATES.CELEBRATE]: 80,
  [STATES.SUBAGENT]: 70,
  [STATES.WORKING]: 60,
  [STATES.THINKING]: 50,
  [STATES.IDLE]: 10,
  [STATES.SLEEP]: 0,
};

class StateMachine {
  constructor({ sleepAfterMs = 90_000 } = {}) {
    this.sleepAfterMs = sleepAfterMs;
    this.sessions = new Map(); // sessionId -> {agent, cwd, state, events, lastEvent, lastAt}
    this.log = [];
    this.current = STATES.IDLE;
    this.overrideUntil = 0;
    this.overrideState = null;
    this.celebrateUntil = 0;
    this.lastActivityAt = Date.now();
    this.listeners = new Set();
    this.timer = setInterval(() => this.recompute(), 1000);
  }

  onTick(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  ingest(ev) {
    this.lastActivityAt = Date.now();
    let s = this.sessions.get(ev.sessionId);
    if (!s) {
      s = { agent: ev.agent, cwd: ev.cwd, state: STATES.idle, events: 0, lastEvent: '', lastAt: ev.ts };
      this.sessions.set(ev.sessionId, s);
    }
    s.agent = ev.agent;
    s.cwd = ev.cwd || s.cwd;
    s.events += 1;
    s.lastEvent = ev.event;
    s.lastAt = ev.ts;

    switch (ev.event) {
      case EVENTS.USER_PROMPT: s.state = STATES.THINKING; break;
      case EVENTS.THINKING: s.state = STATES.THINKING; break;
      case EVENTS.TOOL_START: s.state = STATES.WORKING; break;
      case EVENTS.SUBAGENT: s.state = STATES.SUBAGENT; break;
      case EVENTS.TOOL_END: s.state = STATES.THINKING; break;
      case EVENTS.TOOL_ERROR: s.state = STATES.ERROR; break;
      case EVENTS.STOP:
        s.state = STATES.CELEBRATE;
        this.celebrateUntil = Date.now() + 6000;
        break;
      case EVENTS.NOTIFICATION: s.state = STATES.NOTIFICATION; break;
      case EVENTS.SESSION_END: this.sessions.delete(ev.sessionId); break;
      default: break;
    }

    this.log.push({ agent: ev.agent, event: ev.event, sessionId: ev.sessionId, ts: ev.ts });
    if (this.log.length > 100) this.log.splice(0, this.log.length - 100);
    this.recompute();
  }

  userInteraction(state, durationMs) {
    this.overrideState = state;
    this.overrideUntil = Date.now() + durationMs;
    this.recompute();
  }

  recompute() {
    const now = Date.now();
    let next = STATES.IDLE;
    for (const s of this.sessions.values()) {
      if (PRIORITY[s.state] > PRIORITY[next]) next = s.state;
    }
    if (this.celebrateUntil < now) {
      for (const s of this.sessions.values()) {
        if (s.state === STATES.CELEBRATE) s.state = STATES.THINKING;
      }
    }
    if (this.overrideUntil > now && this.overrideState) {
      next = this.overrideState;
    } else if (this.overrideUntil <= now) {
      this.overrideState = null;
    }
    if (next === STATES.IDLE && now - this.lastActivityAt > this.sleepAfterMs) {
      next = STATES.SLEEP;
    }
    if (next !== this.current) {
      this.current = next;
      for (const fn of this.listeners) fn(next, this.snapshot());
    }
  }

  snapshot() {
    return {
      state: this.current,
      sessions: [...this.sessions.values()].map((s) => ({ ...s })),
      log: [...this.log].reverse().slice(0, 20),
    };
  }

  destroy() { clearInterval(this.timer); this.listeners.clear(); }
}

module.exports = { StateMachine, STATES, PRIORITY };
