const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  app: {
    name: 'Testownik',
  },
  updater: {
    onUpdateAvailable: (callback) => {
      const listener = (_event, info) => callback(info);
      ipcRenderer.on('update-available', listener);
      return () => ipcRenderer.removeListener('update-available', listener);
    },
    onUpdateAvailableMac: (callback) => {
      const listener = (_event, info) => callback(info);
      ipcRenderer.on('update-available-mac', listener);
      return () => ipcRenderer.removeListener('update-available-mac', listener);
    },
    onUpdateDownloaded: (callback) => {
      const listener = (_event, info) => callback(info);
      ipcRenderer.on('update-downloaded', listener);
      return () => ipcRenderer.removeListener('update-downloaded', listener);
    },
    restartApp: () => ipcRenderer.send('restart-app')
  },
  zoom: {
    set: (factor) => ipcRenderer.send('zoom-set', factor)
  }
});
