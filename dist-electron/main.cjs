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
    
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    // Tworzymy tymczasowy skrypt Node.js, który odczeka 4 sekundy i uruchomi instalator
    const scriptPath = path.join(app.getPath('temp'), 'testownik-update.js');
    const scriptContent = `
      setTimeout(() => {
        const { spawn } = require('child_process');
        const fs = require('fs');
        const path = require('path');
        
        // Magiczna sztuczka: usuwamy stary deinstalator zanim włączymy nowy instalator.
        // Dzięki temu NSIS całkowicie pominie uszkodzoną procedurę deinstalacji (która wywala Błąd 2)
        // i po prostu czysto nadpisze wszystkie stare pliki.
        const appDir = path.dirname(process.execPath);
        const uninstallerPath = path.join(appDir, 'Uninstall Testownik.exe');
        
        try {
          if (fs.existsSync(uninstallerPath)) {
            fs.unlinkSync(uninstallerPath);
          }
        } catch (e) {
          // Ignorujemy błędy, jeśli pliku nie ma lub jest zablokowany
        }
        
        const installer = spawn(${JSON.stringify(downloadedUpdatePath)}, ['/S', '--force-run'], {
          detached: true,
          stdio: 'ignore'
        });
        installer.unref();
      }, 4000);
    `;
    fs.writeFileSync(scriptPath, scriptContent);
    
    // Uruchamiamy ten skrypt w tle używając wbudowanego w aplikację środowiska Node (bez okien CMD!)
    const subprocess = spawn(process.execPath, [scriptPath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    });
    
    subprocess.unref();
    app.quit();
  }

  ipcMain.on('restart-app', () => {
    installUpdateAndQuit();
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
