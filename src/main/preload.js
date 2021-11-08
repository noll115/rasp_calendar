const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onLogin: (cb) => ipcRenderer.on('onLogin', cb),
  getInitData: () => ipcRenderer.invoke('getInitData'),
});
