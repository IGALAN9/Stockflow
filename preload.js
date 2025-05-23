const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login : (username, password) => ipcRenderer.invoke('login', {username, password}),
  logout : () => ipcRenderer.invoke('logout'),
  getCurrentUser : () => ipcRenderer.invoke('getCurrentUser'),
  changeFullName : (data) => ipcRenderer.invoke('changeFullName', data),
  updateProfilePicture: (data) => ipcRenderer.invoke('updateProfilePicture', data),
  resetPassword : (username, newPassword) => ipcRenderer.invoke('reset-password', {username, newPassword}),
  redirectToDashboard: () => ipcRenderer.send('redirect-to-dashboard'),
  onMigrationComplete: (callback) => ipcRenderer.on('migration-complete', (event, message) => {
    callback(message);
  })
});

contextBridge.exposeInMainWorld('electronAPI', {
  saveShift: (shiftData) => ipcRenderer.invoke('save-shift', shiftData),
  getShifts: () => ipcRenderer.invoke('get-shifts'),
  deleteShifts: (ids) => ipcRenderer.invoke('delete-shifts', ids),
});
