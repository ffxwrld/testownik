const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  app: {
    name: 'Testownik',
  },
});
