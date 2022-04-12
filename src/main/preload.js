const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onLoginChange: cb => {
    ipcRenderer.on('onLoginChange', cb);
    return () => {
      ipcRenderer.removeListener('onLoginChange', cb);
    };
  },
  onCalendarAction: cb => {
    ipcRenderer.on('onCalendarAction', cb);
    return () => {
      ipcRenderer.removeListener('onCalendarAction', cb);
    };
  },
  onConnectionChange: cb => {
    ipcRenderer.on('onConnectionChange', cb);
    return () => {
      ipcRenderer.removeListener('onConnectionChange', cb);
    };
  },
  getInitialState: () => ipcRenderer.invoke('getInitialState'),
  getData: () => ipcRenderer.invoke('getData'),
  getCalendarColors: () => ipcRenderer.invoke('getCalendarColors'),
  getEventRefresh: () => ipcRenderer.invoke('getEventRefresh')
});
