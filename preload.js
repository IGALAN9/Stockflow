const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login : (username, password) => ipcRenderer.invoke('login', {username, password}),
  resetPassword : (username, newPassword) => ipcRenderer.invoke('reset-password', {username, newPassword}),
  redirectToDashboard: () => ipcRenderer.send('redirect-to-dashboard'),
  onMigrationComplete: (callback) => ipcRenderer.on('migration-complete', (event, message) => {
    callback(message);
  })
});
