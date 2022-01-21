const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onLogin: cb => ipcRenderer.on('onLogin', cb),
  getData: () => ipcRenderer.invoke('getData'),
  getCalendarColors: () => ipcRenderer.invoke('getCalendarColors'),
  getEventRefresh: () => ipcRenderer.invoke('getEventRefresh')
});
