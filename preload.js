const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDbStatus: () => ipcRenderer.invoke('get-db-status')
});
