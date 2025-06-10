const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login : (username, password) => ipcRenderer.invoke('login', {username, password}),
  logout : () => ipcRenderer.invoke('logout'),
  getCurrentUser : () => ipcRenderer.invoke('getCurrentUser'),
  changeFullName : (data) => ipcRenderer.invoke('changeFullName', data),
  updateProfilePicture: (data) => ipcRenderer.invoke('updateProfilePicture', data),
  refreshCurrentUser : () => ipcRenderer.invoke('refresh-current-user'),
  resetPassword : (username, newPassword) => ipcRenderer.invoke('reset-password', {username, newPassword}),
  redirectToDashboard: () => ipcRenderer.send('redirect-to-dashboard'),
  onMigrationComplete: (callback) => ipcRenderer.on('migration-complete', (event, message) => {
    callback(message);
  })
});

contextBridge.exposeInMainWorld('electronAPI', {
  saveShift: (shiftData) => ipcRenderer.invoke('save-shift', shiftData),
  updateShift: (data) => ipcRenderer.invoke('update-shift', data),
  getShifts: () => ipcRenderer.invoke('get-shifts'),
  deleteShifts: (ids) => ipcRenderer.invoke('delete-shifts', ids),
});

contextBridge.exposeInMainWorld('configAPI', {
  getConfig: () => {
    return new Promise((resolve) => {
      ipcRenderer.once('envReply', (event, arg) => {
        resolve(arg.parsed);
      });
      ipcRenderer.send('invokeEnv');
    });
  }
});

contextBridge.exposeInMainWorld('debugAPI', {
  getLog: () => {
    return new Promise((resolve) => {
      ipcRenderer.once('debug-log-reply', (event, log) => {
        resolve(log);
      });
      ipcRenderer.send('debug-log');
    });
  }
});
