const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onMigrationComplete: (callback) => ipcRenderer.on('migration-complete', (event, message) => {
    callback(message);
  })
});
