const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

/** @type {BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#09090b', // zinc-950 — prevents black flash on zoom-out
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  });

  // Check if running from packaged app or dev server
  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'Widok',
      submenu: [
        { role: 'zoomIn',  label: 'Powiększ',  accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut', label: 'Pomniejsz', accelerator: 'CmdOrCtrl+-' },
        { role: 'resetZoom', label: 'Przywróć domyślny zoom', accelerator: 'CmdOrCtrl+0' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pełny ekran' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', () => {
  createWindow();
  
  // Nasłuchiwanie na pobraną aktualizację
  autoUpdater.on('update-downloaded', (info) => {
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Aktualizacja gotowa',
      message: `Wersja ${info.version} została pobrana.`,
      detail: 'Uruchom ponownie aplikację, aby zainstalować aktualizację.',
      buttons: ['Uruchom ponownie', 'Później']
    }).then((result) => {
      if (result.response === 0) {
        // Użytkownik kliknął "Uruchom ponownie"
        autoUpdater.quitAndInstall();
      }
    });
  });

  // W przypadku błędu (np. z powodu braku certyfikatu Apple na Macu) 
  // możemy powiadomić użytkownika o konieczności ręcznego pobrania
  autoUpdater.on('error', (err) => {
    console.error('Błąd aktualizacji:', err);
  });

  // Uruchomienie sprawdzania (bez domyślnego powiadomienia systemowego)
  autoUpdater.checkForUpdates();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
