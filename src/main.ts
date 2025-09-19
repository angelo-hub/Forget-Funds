import { app, BrowserWindow, dialog, ipcMain, Menu, Tray } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { authManager } from './lib/auth';
import { secureDatabase } from './lib/database';
import { exportManager } from './lib/export';
import { BudgetData } from './types/budget';

// Enable live reload for Electron in development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '../node_modules/.bin/electron'),
      hardResetMethod: 'exit',
    });
    console.log('🔄 [Main] Electron live reload enabled');
  } catch (error) {
    console.log('⚠️ [Main] electron-reload not available:', error);
  }
}

// Remove electron-store import as we're migrating away from it
// const Store = require('electron-store');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isAppLocked = true; // Start locked until user authenticates
let isQuitting = false; // Track app quitting state

// Store window bounds in a simple JSON file for now (non-sensitive data)
const configPath = path.join(app.getPath('userData'), 'window-config.json');

interface WindowConfig {
  windowBounds: { width: number; height: number };
}

async function loadWindowConfig(): Promise<WindowConfig> {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return { windowBounds: { width: 1200, height: 800 } };
  }
}

async function saveWindowConfig(config: WindowConfig): Promise<void> {
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to save window config:', error);
  }
}

async function createWindow(): Promise<void> {
  console.log('🪟 [Main] Creating main window...');
  const config = await loadWindowConfig();
  const { width, height } = config.windowBounds;

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    title: 'ForgetFunds',
    icon: path.join(__dirname, '../icons/1024x1024.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../src/preload.js'),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Start hidden, show when ready
  });

  console.log('🪟 [Main] Window created, loading content...');

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';
  try {
    if (isDev) {
      console.log('🔗 [Main] Loading development URL: http://localhost:3000');
      await mainWindow.loadURL('http://localhost:3000');
      console.log('✅ [Main] Development URL loaded successfully');
      mainWindow.webContents.openDevTools();
    } else {
      const indexPath = path.join(__dirname, '../dist/index.html');
      console.log('📁 [Main] Loading production file:', indexPath);
      await mainWindow.loadFile(indexPath);
      console.log('✅ [Main] Production file loaded successfully');
      // Always open DevTools to debug issues
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    console.error('❌ [Main] Failed to load window content:', error);
    // Show window anyway so user can see the error
    mainWindow.show();
    return;
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('🎉 [Main] Window ready to show - displaying window');
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Fallback: Force show window after 5 seconds if ready-to-show doesn't fire
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('⚠️ [Main] Window not visible after 5s - force showing');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 5000);

  // Add error handling for load failures
  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription) => {
      console.error(
        '❌ [Main] Window failed to load:',
        errorCode,
        errorDescription
      );
      mainWindow?.show(); // Show window even on error so user can see what happened
    }
  );

  // Save window bounds on close
  mainWindow.on('close', async () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      await saveWindowConfig({ windowBounds: bounds });
    }
  });

  // Handle window close - minimize to tray instead of closing on macOS/Windows
  mainWindow.on('close', event => {
    if (tray && !isQuitting) {
      event.preventDefault();
      mainWindow?.hide();

      // Show notification on first minimize to tray
      if (process.platform !== 'darwin') {
        tray.displayBalloon({
          iconType: 'info',
          title: 'ForgetFunds',
          content: 'App was minimized to tray',
        });
      }
    }
  });

  // Lock database when window is closed
  mainWindow.on('closed', () => {
    secureDatabase.lock();
    authManager.logout();
    isAppLocked = true;
    mainWindow = null;
  });
}

// Security-first IPC handlers

// Authentication handlers
ipcMain.handle('check-auth-status', async () => {
  console.log('🔐 [Main] check-auth-status handler called');

  const isDbUnlocked = secureDatabase.isDbUnlocked();
  const isUserAuth = authManager.isUserAuthenticated();

  console.log('📋 [Main] Auth status details:', {
    isAppLocked,
    isDbUnlocked,
    isUserAuth,
    combined_isLocked: isAppLocked || !isDbUnlocked,
    combined_isAuthenticated: isUserAuth && isDbUnlocked,
  });

  const status = {
    isLocked: isAppLocked || !isDbUnlocked,
    isAuthenticated: isUserAuth && isDbUnlocked,
    hasLegacyData: false,
    isPinConfigured: await authManager.isPinConfigured(),
  };

  console.log('✅ [Main] Returning auth status:', status);
  return status;
});

ipcMain.handle('unlock-with-password', async (_event, password: string) => {
  try {
    // First, try to unlock the database
    const unlockResult = await secureDatabase.unlock(password);

    if (unlockResult.success) {
      // Authenticate the user session
      await authManager.authenticateWithPassword(password);
      isAppLocked = false;

      // Migration system removed - no legacy data handling needed

      return {
        success: true,
        isNewDatabase: unlockResult.isNewDatabase,
        migrationCompleted: false,
      };
    } else {
      return { success: false, error: unlockResult.error };
    }
  } catch (error) {
    console.error('Failed to unlock with password:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('unlock-with-pin', async (_event, pin: string) => {
  try {
    // PIN can only unlock the app if the database is already unlocked
    if (!secureDatabase.isDbUnlocked()) {
      return {
        success: false,
        error: 'Master password required - database is locked',
      };
    }

    const result = await authManager.verifyPin(pin);
    if (result.success) {
      isAppLocked = false;
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to unlock with PIN:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('setup-pin', async (_event, pin: string) => {
  try {
    if (!authManager.isUserAuthenticated()) {
      return { success: false, error: 'User not authenticated' };
    }

    return await authManager.setupPin(pin);
  } catch (error) {
    console.error('Failed to setup PIN:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('lock-app', () => {
  try {
    secureDatabase.lock();
    authManager.logout();
    isAppLocked = true;
    return { success: true };
  } catch (error) {
    console.error('Failed to lock app:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Data handlers (require authentication)
ipcMain.handle('get-budget-data', async () => {
  console.log('📂 [Main] get-budget-data handler called');
  try {
    console.log('🔐 [Main] Auth status:', {
      isAppLocked,
      isUserAuthenticated: authManager.isUserAuthenticated(),
      isDatabaseUnlocked: secureDatabase.isDbUnlocked(),
    });

    if (isAppLocked || !authManager.isUserAuthenticated()) {
      console.error('❌ [Main] Authentication check failed');
      throw new Error('App is locked - please authenticate first');
    }

    if (!secureDatabase.isDbUnlocked()) {
      console.error('❌ [Main] Database is locked');
      throw new Error('Database is locked');
    }

    console.log(
      '✅ [Main] Authentication passed, fetching data from database...'
    );
    const data = await secureDatabase.getBudgetData();
    console.log('📊 [Main] Data retrieved from database:', {
      income: data.income?.length || 0,
      recurringExpenses: data.recurringExpenses?.length || 0,
      oneTimeExpenses: data.oneTimeExpenses?.length || 0,
      debts: data.debts?.length || 0,
      installmentLoans: data.installmentLoans?.length || 0,
      savingsBuckets: data.savingsBuckets?.length || 0,
      checkingAccounts: data.checkingAccounts?.length || 0,
      monthlyCheckIns: data.monthlyCheckIns?.length || 0,
    });
    return data;
  } catch (error) {
    console.error('❌ [Main] Failed to get budget data:', error);
    throw error;
  }
});

ipcMain.handle('save-budget-data', async (_event, data: BudgetData) => {
  console.log('💾 [Main] save-budget-data handler called');
  try {
    console.log('📊 [Main] Data to save:', {
      income: data.income?.length || 0,
      recurringExpenses: data.recurringExpenses?.length || 0,
      oneTimeExpenses: data.oneTimeExpenses?.length || 0,
      debts: data.debts?.length || 0,
      installmentLoans: data.installmentLoans?.length || 0,
      savingsBuckets: data.savingsBuckets?.length || 0,
      checkingAccounts: data.checkingAccounts?.length || 0,
      monthlyCheckIns: data.monthlyCheckIns?.length || 0,
    });

    console.log('🔐 [Main] Auth status:', {
      isAppLocked,
      isUserAuthenticated: authManager.isUserAuthenticated(),
      isDatabaseUnlocked: secureDatabase.isDbUnlocked(),
    });

    if (isAppLocked || !authManager.isUserAuthenticated()) {
      console.error('❌ [Main] Save failed - authentication check failed');
      return {
        success: false,
        error: 'App is locked - please authenticate first',
      };
    }

    if (!secureDatabase.isDbUnlocked()) {
      console.error('❌ [Main] Save failed - database is locked');
      return { success: false, error: 'Database is locked' };
    }

    console.log('✅ [Main] Authentication passed, saving data to database...');
    const result = await secureDatabase.saveBudgetData(data);
    console.log('💾 [Main] Save result:', result);
    return result;
  } catch (error) {
    console.error('❌ [Main] Exception during save:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Secure export with encryption
ipcMain.handle(
  'export-budget-data',
  async (_event, exportPassword?: string) => {
    try {
      if (isAppLocked || !authManager.isUserAuthenticated()) {
        return {
          success: false,
          error: 'App is locked - please authenticate first',
        };
      }

      if (!mainWindow) {
        return { success: false, error: 'No active window' };
      }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Encrypted Budget Data',
        defaultPath: `budget-data-encrypted-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'Encrypted JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (!result.canceled && result.filePath) {
        // Get current data
        const budgetData = await secureDatabase.getBudgetData();

        // Use provided password or generate one
        const password =
          exportPassword || exportManager.generateExportPassword();

        // Export with encryption
        const exportResult = await exportManager.exportEncrypted(
          budgetData,
          result.filePath,
          password
        );

        if (exportResult.success) {
          return {
            success: true,
            filePath: result.filePath,
            recordCount: exportResult.recordCount,
            generatedPassword: exportPassword ? undefined : password,
          };
        } else {
          return { success: false, error: exportResult.error };
        }
      }

      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Failed to export budget data:', error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// Secure import with decryption
ipcMain.handle(
  'import-budget-data',
  async (_event, importPassword?: string) => {
    try {
      if (isAppLocked || !authManager.isUserAuthenticated()) {
        return {
          success: false,
          error: 'App is locked - please authenticate first',
        };
      }

      if (!mainWindow) {
        return { success: false, error: 'No active window' };
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Budget Data',
        filters: [
          { name: 'Encrypted JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];

        // Check if file is encrypted by reading first few bytes
        const fileContent = await fs.readFile(filePath, 'utf8');
        const fileData = JSON.parse(fileContent);

        let budgetData: BudgetData;
        let recordCount = 0;

        if (fileData.encrypted === true) {
          // Encrypted file - requires password
          if (!importPassword) {
            return {
              success: false,
              error: 'Password required for encrypted file',
              requiresPassword: true,
            };
          }

          const importResult = await exportManager.importEncrypted(
            filePath,
            importPassword
          );
          if (!importResult.success || !importResult.data) {
            return { success: false, error: importResult.error };
          }

          budgetData = importResult.data;
          recordCount = importResult.recordCount || 0;
        } else {
          // Legacy unencrypted file
          const requiredFields = ['debts', 'income', 'recurringExpenses'];
          const isValid = requiredFields.every(field =>
            fileData.hasOwnProperty(field)
          );

          if (!isValid) {
            return { success: false, error: 'Invalid file format' };
          }

          budgetData = fileData;
          recordCount =
            (budgetData.income?.length || 0) +
            (budgetData.debts?.length || 0) +
            (budgetData.recurringExpenses?.length || 0) +
            (budgetData.savingsBuckets?.length || 0);
        }

        // Save to database
        const saveResult = await secureDatabase.saveBudgetData(budgetData);
        if (saveResult.success) {
          return {
            success: true,
            data: budgetData,
            recordCount,
            wasEncrypted: fileData.encrypted === true,
          };
        } else {
          return { success: false, error: saveResult.error };
        }
      }

      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Failed to import budget data:', error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// API key management
ipcMain.handle(
  'store-api-key',
  async (_event, provider: string, apiKey: string) => {
    try {
      if (isAppLocked || !authManager.isUserAuthenticated()) {
        return {
          success: false,
          error: 'App is locked - please authenticate first',
        };
      }

      return await authManager.storeApiKey(provider, apiKey);
    } catch (error) {
      console.error('Failed to store API key:', error);
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle('get-api-key', async (_event, provider: string) => {
  try {
    if (isAppLocked || !authManager.isUserAuthenticated()) {
      return {
        success: false,
        error: 'App is locked - please authenticate first',
      };
    }

    return await authManager.getApiKey(provider);
  } catch (error) {
    console.error('Failed to get API key:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('remove-api-key', async (_event, provider: string) => {
  try {
    if (isAppLocked || !authManager.isUserAuthenticated()) {
      return {
        success: false,
        error: 'App is locked - please authenticate first',
      };
    }

    return await authManager.removeApiKey(provider);
  } catch (error) {
    console.error('Failed to remove API key:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Security settings
ipcMain.handle('set-lock-timeout', (_event, timeoutMs: number) => {
  try {
    secureDatabase.setLockTimeout(timeoutMs);
    authManager.setSessionTimeout(timeoutMs);
    return { success: true };
  } catch (error) {
    console.error('Failed to set lock timeout:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Password validation
ipcMain.handle('validate-password', (_event, password: string) => {
  try {
    return authManager.validatePasswordStrength(password);
  } catch (error) {
    console.error('Failed to validate password:', error);
    return {
      isValid: false,
      errors: ['Password validation failed'],
      strength: 0,
    };
  }
});

// Export password validation and generation
ipcMain.handle('validate-export-password', (_event, password: string) => {
  try {
    return exportManager.validateExportPassword(password);
  } catch (error) {
    console.error('Failed to validate export password:', error);
    return { isValid: false, errors: ['Export password validation failed'] };
  }
});

ipcMain.handle('generate-export-password', (_event, length?: number) => {
  try {
    return {
      success: true,
      password: exportManager.generateExportPassword(length),
    };
  } catch (error) {
    console.error('Failed to generate export password:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Create application menu
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu-export'),
        },
        {
          label: 'Import Data',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow?.webContents.send('menu-import'),
        },
        { type: 'separator' },
        {
          label: 'Lock App',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            secureDatabase.lock();
            authManager.logout();
            isAppLocked = true;
            mainWindow?.webContents.send('app-locked');
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit(),
        },
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
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Security',
      submenu: [
        {
          label: 'Lock App',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            secureDatabase.lock();
            authManager.logout();
            isAppLocked = true;
            mainWindow?.webContents.send('app-locked');
          },
        },
        {
          label: 'Setup PIN',
          click: () => mainWindow?.webContents.send('setup-pin'),
        },
        { type: 'separator' },
        {
          label: 'Security Settings',
          click: () => mainWindow?.webContents.send('security-settings'),
        },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
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
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Create system tray
function createTray(): void {
  const trayIconPath = path.join(__dirname, '../icons/32x32.png');
  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show ForgetFunds',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'Lock App',
      click: () => {
        secureDatabase.lock();
        authManager.logout();
        isAppLocked = true;
        mainWindow?.webContents.send('app-locked');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit ForgetFunds',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('ForgetFunds - Budget Management');
  tray.setContextMenu(contextMenu);

  // Show window on tray click (Windows/Linux behavior)
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });

  // Show window on double-click (macOS behavior)
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

app.whenReady().then(async () => {
  console.log('🚀 [Main] ForgetFunds starting...');
  console.log('🔧 [Main] Environment:', process.env.NODE_ENV || 'production');

  // Set dock icon for macOS
  if (process.platform === 'darwin') {
    const dockIcon = path.join(__dirname, '../icons/1024x1024.png');
    app.dock?.setIcon(dockIcon);
  }

  console.log('🔧 [Main] Creating system tray...');
  // Create system tray
  createTray();

  console.log('🪟 [Main] About to create main window...');
  await createWindow();
  createMenu();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit the app when all windows are closed if tray is active
  // This allows the app to continue running in the background
  if (process.platform !== 'darwin' && !tray) {
    app.quit();
  }
});

// Handle app termination
app.on('before-quit', () => {
  isQuitting = true;
  secureDatabase.lock();
  authManager.logout();
});

// Clean up tray on quit
app.on('will-quit', () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
