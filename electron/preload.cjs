const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  app: {
    name: 'Testownik',
  },
  updater: {
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
    onUpdateAvailableMac: (callback) => ipcRenderer.on('update-available-mac', (_event, info) => callback(info)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
    restartApp: () => ipcRenderer.send('restart-app')
  }
});
