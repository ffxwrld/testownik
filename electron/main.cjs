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

  mainWindow.webContents.on('will-prevent-unload', (event) => {
    const { dialog } = require('electron');
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Zamknij i odrzuć', 'Anuluj'],
      title: 'Odrzucić niezapisane zmiany?',
      message: 'Wszystkie niezapisane postępy w kreatorze przepadną po wyjściu.',
      defaultId: 1,
      cancelId: 1
    });
    
    if (choice === 0) {
      event.preventDefault(); // Allow the window to close
    }
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
      label: 'View',
      submenu: [
        { role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

let downloadedUpdatePath = null;

app.on('ready', () => {
  createWindow();
  
  autoUpdater.autoInstallOnAppQuit = false;
  if (process.platform === 'darwin') {
    autoUpdater.autoDownload = false;
  }
  
  autoUpdater.on('update-downloaded', (info) => {
    downloadedUpdatePath = info.downloadedFile;
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      if (process.platform === 'darwin') {
        mainWindow.webContents.send('update-available-mac', info);
      } else {
        mainWindow.webContents.send('update-available', info);
      }
    }
  });

  const { ipcMain } = require('electron');
  
  function installUpdateAndQuit() {
    if (!downloadedUpdatePath) return app.quit();
    autoUpdater.quitAndInstall(false, true);
  }

  ipcMain.on('restart-app', () => {
    installUpdateAndQuit();
  });

  ipcMain.on('zoom-set', (event, factor) => {
    if (mainWindow) {
      mainWindow.webContents.setZoomFactor(factor);
    }
  });

  // W razie błędu, wypisz do konsoli zamiast pokazywać okienko
  autoUpdater.on('error', (err) => {
    console.error('Błąd auto-updatera:', err);
  });

  // Uruchomienie sprawdzania (bez domyślnego powiadomienia systemowego)
  autoUpdater.checkForUpdates();
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (downloadedUpdatePath) {
    installUpdateAndQuit();
  } else if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
