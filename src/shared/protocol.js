// Normalizes events from different AI coding tools into one internal event set.
'use strict';

const EVENTS = Object.freeze({
  USER_PROMPT: 'user_prompt',
  THINKING: 'thinking',
  TOOL_START: 'tool_start',
  TOOL_END: 'tool_end',
  TOOL_ERROR: 'tool_error',
  SUBAGENT: 'subagent',
  STOP: 'stop',
  NOTIFICATION: 'notification',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
});

const CLAUDE_MAP = {
  UserPromptSubmit: EVENTS.USER_PROMPT,
  PreToolUse: EVENTS.TOOL_START,
  PostToolUse: EVENTS.TOOL_END,
  PostToolUseFailure: EVENTS.TOOL_ERROR,
  Stop: EVENTS.STOP,
  SubagentStart: EVENTS.SUBAGENT,
  SubagentStop: EVENTS.TOOL_END,
  Notification: EVENTS.NOTIFICATION,
  SessionStart: EVENTS.SESSION_START,
  SessionEnd: EVENTS.SESSION_END,
};

const CURSOR_MAP = {
  beforeSubmitPrompt: EVENTS.USER_PROMPT,
  onFileTypeChange: EVENTS.THINKING,
  onProgress: EVENTS.THINKING,
  onResponseStarted: EVENTS.THINKING,
  onResponseCompleted: EVENTS.STOP,
  onToolExecuting: EVENTS.TOOL_START,
  onToolExecuted: EVENTS.TOOL_END,
  onError: EVENTS.TOOL_ERROR,
  sessionStart: EVENTS.SESSION_START,
  sessionEnd: EVENTS.SESSION_END,
};

function normalize(agent, raw) {
  const source = (raw && typeof raw === 'object') ? raw : {};
  let event = EVENTS.THINKING;
  let sessionId = source.session_id || source.sessionId || source.conversationId || 'default';
  let cwd = source.cwd || source.workspace || '';
  let toolName = source.tool_name || source.toolName || '';
  let title = source.hook_event_name || source.event || '';

  if (agent === 'claude') {
    const key = source.hook_event_name || source.type || '';
    event = CLAUDE_MAP[key] || EVENTS.THINKING;
    toolName = source.tool_name || (source.tool_input && source.tool_input.name) || toolName;
  } else if (agent === 'cursor') {
    const key = source.event || source.type || '';
    event = CURSOR_MAP[key] || EVENTS.THINKING;
    toolName = source.toolName || source.tool || toolName;
  } else if (agent === 'codex') {
    event = source.event || EVENTS.THINKING;
    cwd = source.cwd || cwd;
  }

  return {
    agent,
    event,
    rawEvent: title,
    sessionId: String(sessionId),
    cwd,
    toolName,
    title,
    ts: Date.now(),
  };
}

module.exports = { EVENTS, CLAUDE_MAP, CURSOR_MAP, normalize };
