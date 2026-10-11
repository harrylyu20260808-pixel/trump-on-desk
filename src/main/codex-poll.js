// Read-only polling of Codex CLI session JSONL files. Tail new lines,
// classify each line into a normalized event.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { EVENTS } = require('../shared/protocol');

function classifyLine(line) {
  let obj;
  try { obj = JSON.parse(line); } catch (_) { return null; }
  const keys = JSON.stringify(obj).toLowerCase();
  if (/user_message|user_input|user_prompt/i.test(keys)) return EVENTS.USER_PROMPT;
  if (/function_call_output|tool_call_output|function_output/i.test(keys)) return EVENTS.TOOL_END;
  if (/function_call|tool_call|shell_call/i.test(keys)) return EVENTS.TOOL_START;
  if (/task_complete|turn_complete|completed/i.test(keys)) return EVENTS.STOP;
  if (/error/i.test(keys)) return EVENTS.TOOL_ERROR;
  return null;
}

function start({ sessionsDir, onEvent, intervalMs = 1500 }) {
  const offsets = new Map();
  let stopped = false;

  function scan() {
    if (stopped) return;
    let files = [];
    try {
      files = fs.readdirSync(sessionsDir).filter((f) => f.endsWith('.jsonl'));
    } catch (_) { setTimeout(scan, intervalMs); return; }

    for (const file of files) {
      const full = path.join(sessionsDir, file);
      let stat;
      try { stat = fs.statSync(full); } catch (_) { continue; }
      const prev = offsets.get(file) || 0;
      if (stat.size < prev) offsets.set(file, 0);
      else if (stat.size > prev) {
        try {
          const fd = fs.openSync(full, 'r');
          const buf = Buffer.alloc(stat.size - offsets.get(file));
          fs.readSync(fd, buf, 0, buf.length, offsets.get(file));
          fs.closeSync(fd);
          offsets.set(file, stat.size);
          for (const line of buf.toString('utf8').split(/\r?\n/)) {
            if (!line.trim()) continue;
            const event = classifyLine(line);
            if (event) onEvent({ agent: 'codex', event, sessionId: file, cwd: '', rawEvent: line.slice(0, 120), ts: Date.now() });
          }
        } catch (_) { /* skip unreadable */ }
      }
    }
    setTimeout(scan, intervalMs);
  }
  scan();
  return () => { stopped = true; };
}

module.exports = { classifyLine, start };
