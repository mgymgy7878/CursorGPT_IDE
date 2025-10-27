import path from 'node:path';
import fs from 'node:fs';
import { app, BrowserWindow, crashReporter } from 'electron';
import { autoUpdater } from 'electron-updater';
const UPDATE_CHANNEL = process.env.SPARK_UPDATE_CHANNEL ?? 'stable';
// userData → %LOCALAPPDATA%\Spark
app.setPath('userData', path.join(app.getPath('appData'), 'Spark'));
// AppUserModelID, Windows'ta kısayol ve taskbar ikonunun doğru görünmesi için builder appId ile eşlenir
app.setAppUserModelId('com.spark.trading');
import { spawn } from 'node:child_process';

let mainWin: BrowserWindow | null = null;
let serverProc: any = null;

function wait(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function startStandalone(): Promise<number> {
  const appDir = app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname, '../../apps/web-next/.next/standalone');
  const serverEntry = app.isPackaged
    ? path.join(appDir, 'standalone', 'server.js')
    : path.join(appDir, 'server.js');
  const port = process.env.WEB_PORT || '3003';

  serverProc = spawn(process.execPath, [serverEntry], {
    env: { ...process.env, PORT: port, NODE_ENV: 'production' },
    cwd: path.dirname(serverEntry),
    stdio: 'ignore'
  });
  (serverProc as any).unref?.();

  // wait a bit
  for (let i = 0; i < 30; i++) { await wait(500); }
  return Number(port);
}

function stopStandalone(): void {
  try {
    if (!serverProc) return;
    const pid: number | undefined = (serverProc as any).pid;
    // Windows'ta çocuk süreç ağacını da kapat
    if (process.platform === 'win32' && pid) {
      try { (spawn as any)('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
    }
    try { (serverProc as any).kill?.('SIGTERM'); } catch {}
    serverProc = null;
  } catch {}
}
// Crash reporter (erken başlat)
crashReporter.start({
  productName: 'Spark Trading',
  companyName: 'Spark',
  submitURL: 'https://errors.sparktrading.example.com',
  uploadToServer: false,
  compress: true,
});

// Basit günlükleme + pruning (14 gün)
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const logDate = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const logFile = () => path.join(LOG_DIR, `app-${logDate()}.log`);
function logLine(msg: string) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(logFile(), `[${new Date().toISOString()}] ${msg}\n`, 'utf-8');
  } catch {}
}
function pruneOldLogs(days = 14) {
  try {
    if (!fs.existsSync(LOG_DIR)) return;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    for (const f of fs.readdirSync(LOG_DIR)) {
      const m = /app-(\d{8})\.log$/.exec(f);
      if (!m) continue;
      const y = Number(m[1].slice(0, 4));
      const mo = Number(m[1].slice(4, 6)) - 1;
      const d = Number(m[1].slice(6, 8));
      const t = new Date(Date.UTC(y, mo, d)).getTime();
      if (t < cutoff) fs.unlinkSync(path.join(LOG_DIR, f));
    }
  } catch {}
}

process.on('uncaughtException', (e) => { logLine(`UNCUGHT: ${e?.stack || e}`); });
process.on('unhandledRejection', (e: any) => { logLine(`UNHANDLED_REJECTION: ${e?.stack || e}`); });


async function createWindow() {
  const port = await startStandalone();
  const primaryUrl = process.env.SPARK_DESKTOP_URL ?? `http://127.0.0.1:${port}`;
  const packagedFallbackPath = path.join(process.resourcesPath, 'app', 'web', 'index.html');
  const devFallbackPath = path.join(__dirname, '../../apps/web-next/out/index.html');
  const fallbackUrl = fs.existsSync(packagedFallbackPath)
    ? `file://${packagedFallbackPath}`
    : (fs.existsSync(devFallbackPath) ? `file://${devFallbackPath}` : null);

  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });

  // Yeni pencere acilmasini engelle
  mainWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Yükleme hatasında offline fallback'e dön
  mainWin.webContents.on('did-fail-load', () => {
    if (fallbackUrl) {
      mainWin?.loadURL(fallbackUrl).catch(() => {});
    }
  });

  // Birincil URL'yi hizli dene, 1500ms icinde acilmazsa fallback'e gec
  const LOAD_TIMEOUT_MS = 1500;
  try {
    await Promise.race([
      mainWin.loadURL(primaryUrl),
      (async () => { await wait(LOAD_TIMEOUT_MS); throw new Error('LOAD_TIMEOUT'); })()
    ]);
  } catch {
    if (fallbackUrl) {
      await mainWin.loadURL(fallbackUrl).catch(() => {});
    } else {
      // Fallback yoksa bir kez daha ana URL'yi dene
      try { await mainWin.loadURL(primaryUrl); } catch {}
    }
  }
}

// Single-instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    pruneOldLogs(14);
    await createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
}

app.on('window-all-closed', () => {
  stopStandalone();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { stopStandalone(); });
app.on('quit', () => { stopStandalone(); });

// Auto-update: yalnızca packaged iken
app.whenReady().then(() => {
  try {
    if (app.isPackaged) {
      (autoUpdater as any).channel = UPDATE_CHANNEL as any;
      autoUpdater.channel = process.env.SPARK_UPDATE_CHANNEL ?? 'stable';
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.checkForUpdatesAndNotify().catch(err => logLine(`AU.check error: ${err}`));
      autoUpdater.on('update-available', info => logLine(`AU.available ${info?.version}`));
      autoUpdater.on('update-not-available', () => logLine('AU.not-available'));
      autoUpdater.on('error', err => logLine(`AU.error ${err}`));
      autoUpdater.on('download-progress', p => logLine(`AU.progress ${Math.round(p.percent)}%`));
      autoUpdater.on('update-downloaded', info => logLine(`AU.downloaded ${info?.version}`));
    } else {
      logLine('Dev mode: autoUpdater disabled');
    }
  } catch (e) {
    logLine(`AU.init error: ${e}`);
  }
});


