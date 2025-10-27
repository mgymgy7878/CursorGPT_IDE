// Minimal Electron shell: Next.js'i başlatır, hazır olunca pencere açar,
// Ctrl+E = Edit Mode, F12 = DevTools, Ctrl+R = Reload

const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');
const http = require('node:http');

const PORT = process.env.PORT || '3015';
const isDev = !app.isPackaged;
let child; // next server process
let win;

function ping(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => { res.resume(); resolve(res.statusCode === 200); });
    req.on('error', () => resolve(false));
    setTimeout(() => { try { req.destroy(); } catch {} resolve(false); }, 2000);
  });
}

async function waitFor(url, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await ping(url)) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Server wait timeout');
}

function startNextDev() {
  const cwd = path.resolve(__dirname, '..');
  const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  child = spawn(cmd, ['run', 'dev', '--', '-p', PORT], { 
    cwd, 
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }, 
    stdio: 'inherit' 
  });
}

function startNextProd() {
  // Next 15 standalone build'i Electron içinde çalıştırmak için trick:
  // ELECTRON_RUN_AS_NODE ile electron exe'si Node gibi davranır.
  const serverEntry = path.join(process.resourcesPath, 'standalone', 'server.js');
  const nodeBin = process.execPath;
  child = spawn(nodeBin, [serverEntry], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: PORT,
      HOSTNAME: '127.0.0.1',
    },
    stdio: 'inherit'
  });
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1366,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: { 
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    title: 'Spark Platform Desktop'
  });
  
  win.on('closed', () => { win = null; });

  const url = `http://localhost:${PORT}`;
  
  // Server'ın hazır olmasını bekle
  console.log(`⏳ Server'ın hazır olması bekleniyor: ${url}`);
  try {
    await waitFor(`${url}/api/health`, 60000);
    console.log('✅ Server hazır!');
  } catch (e) {
    console.log('⚠️ Health check timeout, yine de devam ediliyor...');
  }

  await win.loadURL(url);
  console.log(`🚀 Spark Platform Desktop başlatıldı: ${url}`);
}

function buildMenu() {
  const template = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Edit Mode (Ctrl+E)',
          accelerator: 'CommandOrControl+E',
          click: () => {
            if (!win) return;
            win.webContents.executeJavaScript(`
              (function(){
                window.__sparkEdit = !window.__sparkEdit;
                const id='__spark_edit_css';
                let s=document.getElementById(id);
                if(window.__sparkEdit){
                  if(!s){
                    s=document.createElement('style');
                    s.id=id;
                    s.textContent='*{outline:1px dashed rgba(255,0,102,.35)} ::selection{background:rgba(255,0,102,.2)}';
                    document.head.appendChild(s);
                  }
                  console.log('🎨 Edit Mode: AÇIK');
                } else { 
                  if(s) s.remove(); 
                  console.log('🎨 Edit Mode: KAPALI');
                }
              })()
            `);
          }
        },
        { 
          role: 'reload', 
          accelerator: 'CommandOrControl+R',
          label: 'Reload (Ctrl+R)'
        },
        { 
          label: 'Toggle DevTools (F12)', 
          accelerator: 'F12', 
          click: () => win && win.webContents.toggleDevTools() 
        },
        { type: 'separator' },
        {
          label: 'Server Logs',
          click: () => {
            if (win) {
              win.webContents.openDevTools();
              win.webContents.executeJavaScript(`
                console.log('📊 Server Status: http://localhost:${PORT}');
                fetch('/api/health').then(r=>r.json()).then(console.log);
              `);
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Hakkında',
          click: () => dialog.showMessageBox({
            message: 'Spark Platform Desktop Shell',
            detail: `Port: ${PORT}\nMode: ${isDev ? 'Development' : 'Production'}\n\nKısayollar:\n• Ctrl+E: Edit Mode\n• F12: DevTools\n• Ctrl+R: Reload`
          })
        },
        {
          label: 'GitHub',
          click: () => {
            const { shell } = require('electron');
            shell.openExternal('https://github.com/spark-platform');
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', async () => {
  try {
    console.log('🚀 Spark Platform Desktop başlatılıyor...');
    
    if (isDev) {
      console.log('🔧 Development mode');
      startNextDev();
    } else {
      console.log('🏭 Production mode');
      startNextProd();
    }
    
    buildMenu();
    await createWindow();
    
  } catch (e) {
    console.error('❌ Başlatma hatası:', e);
    dialog.showErrorBox('Başlatma hatası', String(e?.stack || e));
    app.quit();
  }
});

app.on('window-all-closed', () => { 
  if (process.platform !== 'darwin') {
    console.log('🛑 Uygulama kapatılıyor...');
    app.quit(); 
  }
});

app.on('before-quit', () => { 
  if (child && !child.killed) {
    console.log('🛑 Next.js server durduruluyor...');
    try { 
      child.kill('SIGTERM'); 
    } catch (e) {
      console.error('Server durdurma hatası:', e);
    }
  }
});

// Hata yakalama
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  dialog.showErrorBox('Kritik Hata', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});
