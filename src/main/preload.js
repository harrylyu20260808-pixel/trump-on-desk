'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAll: () => ipcRenderer.invoke('app:getAll'),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  hooksInstall: (agent) => ipcRenderer.invoke('hooks:install', agent),
  hooksUninstall: (agent) => ipcRenderer.invoke('hooks:uninstall', agent),
  hooksDetect: () => ipcRenderer.invoke('hooks:detect'),
  drag: (dx, dy) => ipcRenderer.invoke('pet:drag', { dx, dy }),
  interact: (state) => ipcRenderer.invoke('pet:interact', state),
  openMenu: () => ipcRenderer.invoke('pet:menu'),
  addReminder: (text, minutes) => ipcRenderer.invoke('reminders:add', { text, minutes }),
  removeReminder: (id) => ipcRenderer.invoke('reminders:remove', id),
  onSnapshot: (cb) => {
    const fn = (_e, snap) => cb(snap);
    ipcRenderer.on('pet:snapshot', fn);
    ipcRenderer.on('dash:snapshot', fn);
    return () => ipcRenderer.removeListener('pet:snapshot', fn);
  },
  onSettings: (cb) => {
    const fn = (_e, s) => cb(s);
    ipcRenderer.on('pet:settings', fn);
    return () => ipcRenderer.removeListener('pet:settings', fn);
  },
});
