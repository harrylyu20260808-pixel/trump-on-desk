'use strict';
const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const settingsStore = require('./settings');
const { StateMachine, STATES } = require('./state-machine');
const eventServer = require('./event-server');
const hooks = require('./hooks');
const codex = require('./codex-poll');
const { normalize } = require('../shared/protocol');
const { STRINGS } = require('../shared/i18n');

const isDev = !app.isPackaged;
const ROOT = path.join(__dirname, '..', '..');

let settingsFile;
let settingsCache = settingsStore.DEFAULTS;
let sm;
let petWin, dashWin, tray;
let reminders = new Map();
let unhookCodex = null;

function userData() { return app.getPath('userData'); }
function t() { return STRINGS[settingsCache.language] || STRINGS.en; }

function broadcast() {
  const snap = sm ? sm.snapshot() : { state: 'idle', sessions: [], log: [] };
  if (petWin && !petWin.isDestroyed()) petWin.webContents.send('pet:snapshot', snap);
  if (dashWin && !dashWin.isDestroyed()) dashWin.webContents.send('dash:snapshot', snap);
}

function applySettings(patch) {
  settingsCache = settingsStore.applyPatch(settingsCache, patch);
  settingsStore.save(settingsFile, settingsCache);
  if (petWin) {
    petWin.setAlwaysOnTop(settingsCache.alwaysOnTop, 'pop-up-menu');
    if (settingsCache.petVisible) petWin.show(); else petWin.hide();
    const [x, y] = petWin.getPosition();
    petWin.setBounds({ width: Math.round(220 * settingsCache.petScale), height: Math.round(240 * settingsCache.petScale), x, y });
    if (!petWin.isDestroyed()) petWin.webContents.send('pet:settings', settingsCache);
  }
}

function makePet() {
  petWin = new BrowserWindow({
    width: 220, height: 240,
    x: 100, y: 100,
    frame: false, transparent: true, resizable: false,
    alwaysOnTop: true, skipTaskbar: true,
    hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  petWin.loadFile(path.join(ROOT, 'src', 'renderer', 'pet.html'));
  petWin.on('closed', () => { petWin = null; });
}

function makeDash() {
  if (dashWin) { dashWin.focus(); return; }
  dashWin = new BrowserWindow({
    width: 760, height: 620,
    title: 'Trump on Desk',
    backgroundColor: '#1f2430',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  dashWin.loadFile(path.join(ROOT, 'src', 'renderer', 'dashboard.html'));
  dashWin.on('closed', () => { dashWin = null; });
}

function makeTray() {
  const icon = nativeImage.createFromPath(path.join(ROOT, 'assets', 'icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  const menu = Menu.buildFromTemplate([
    { label: 'Trump on Desk', enabled: false },
    { label: t().showDashboard, click: () => makeDash() },
    { type: 'separator' },
    { label: t().quit, click: () => app.quit() },
  ]);
  tray.setToolTip('Trump on Desk');
  tray.setContextMenu(menu);
  tray.on('click', () => makeDash());
}

function fireReminder(r) {
  reminders.delete(r.id);
  if (tray) tray.displayBalloon({ title: 'Trump on Desk', content: r.text });
  sm.ingest({ agent: 'self', event: 'notification', rawEvent: 'reminder', sessionId: 'reminder', cwd: '', toolName: '', title: r.text, ts: Date.now() });
  broadcast();
}

function registerIpc() {
  ipcMain.handle('app:getAll', () => {
    const strings = Object.fromEntries(
      Object.entries(STRINGS[settingsCache.language]).filter(([, v]) => typeof v === 'string'),
    );
    return {
      settings: settingsCache,
      i18n: strings,
      hooks: hooks.detect(),
      reminders: [...reminders.values()],
    };
  });
  ipcMain.handle('settings:update', (_e, patch) => { applySettings(patch); return settingsCache; });
  ipcMain.handle('hooks:install', (_e, agent) => { hooks.install(agent, userData()); return hooks.detect(); });
  ipcMain.handle('hooks:uninstall', (_e, agent) => { hooks.uninstall(agent); return hooks.detect(); });
  ipcMain.handle('hooks:detect', () => hooks.detect());
  ipcMain.handle('pet:drag', (_e, { dx, dy }) => {
    if (!petWin) return;
    const [x, y] = petWin.getPosition();
    petWin.setPosition(Math.round(x + dx), Math.round(y + dy));
  });
  ipcMain.handle('pet:interact', (_e, state) => {
    const durations = { cola: 3000, thumbs: 2800, rally: 4200 };
    sm.userInteraction(state, durations[state] || 2500);
    broadcast();
  });
  ipcMain.handle('pet:menu', () => {
    const menu = Menu.buildFromTemplate([
      { label: t().cola, click: () => sm.userInteraction('cola', 3000) },
      { label: t().thumbs, click: () => sm.userInteraction('thumbs', 2800) },
      { label: t().rally, click: () => sm.userInteraction('rally', 4200) },
    ]);
    menu.popup({ window: petWin });
  });
  ipcMain.handle('reminders:add', (_e, { text, minutes }) => {
    const r = { id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), text, minutes, fireAt: Date.now() + minutes * 60_000 };
    reminders.set(r.id, r);
    setTimeout(() => { if (reminders.has(r.id)) fireReminder(r); }, minutes * 60_000);
    return [...reminders.values()];
  });
  ipcMain.handle('reminders:remove', (_e, id) => { reminders.delete(id); return [...reminders.values()]; });
}

app.whenReady().then(async () => {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) { app.quit(); return; }

  settingsFile = path.join(userData(), 'settings.json');
  settingsCache = settingsStore.load(settingsFile);

  sm = new StateMachine({ sleepAfterMs: settingsCache.sleepAfterMs });
  sm.onTick(() => broadcast());

  await eventServer.start({
    userData: userData(),
    onEvent: (payload) => sm.ingest(normalize(payload.agent || 'unknown', payload)),
  });

  unhookCodex = codex.start({
    sessionsDir: hooks.codexSessionsDir(),
    onEvent: (ev) => sm.ingest(ev),
  });

  registerIpc();
  makePet();
  makeTray();

  app.on('activate', () => { if (!petWin) makePet(); });
  broadcast();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => { if (unhookCodex) unhookCodex(); });
