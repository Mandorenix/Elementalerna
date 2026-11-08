const { app, BrowserWindow, net, protocol } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

function registerProductionProtocol() {
  const distDirectory = path.resolve(__dirname, 'dist');

  protocol.handle('app', (request) => {
    const requestPath = decodeURIComponent(new URL(request.url).pathname).replace(/^[/\\]+/, '');
    const filePath = path.resolve(distDirectory, requestPath || 'index.html');

    if (filePath !== distDirectory && !filePath.startsWith(`${distDirectory}${path.sep}`)) {
      return new Response('Not found', { status: 404 });
    }

    return net.fetch(pathToFileURL(filePath).href);
  });
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await window.loadURL(app.isPackaged ? 'app://./index.html' : 'http://localhost:3000');
}

app.whenReady().then(async () => {
  if (app.isPackaged) {
    registerProductionProtocol();
  }

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        console.error('Failed to reopen the game window:', error);
        app.quit();
      });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});