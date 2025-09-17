const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs').promises;

// Initialize electron-store for persistent data
const store = new Store({
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    budgetData: {
      debts: [
        {
          id: 1,
          name: 'Credit Card',
          balance: 5000,
          apr: 18.99,
          minPayment: 150,
        },
      ],
      installmentLoans: [
        {
          id: 1,
          name: 'Car Lease',
          balance: 12000,
          monthlyPayment: 350,
          remainingMonths: 24,
        },
      ],
      income: [{ id: 1, source: 'Salary', amount: 4500, frequency: 'monthly' }],
      recurringExpenses: [
        { id: 1, category: 'Rent', amount: 1200 },
        { id: 2, category: 'Utilities', amount: 150 },
        { id: 3, category: 'Groceries', amount: 400 },
      ],
      oneTimeExpenses: [
        { id: 1, description: 'Movers', amount: 800 },
        { id: 2, description: 'Security Deposit', amount: 1200 },
      ],
      savingsBuckets: [
        {
          id: 1,
          name: 'Emergency Fund',
          target: 6000,
          current: 500,
          category: 'Emergency',
          priority: 1,
        },
        {
          id: 2,
          name: 'Vacation Fund',
          target: 3000,
          current: 200,
          category: 'Lifestyle',
          priority: 2,
        },
        {
          id: 3,
          name: 'House Down Payment',
          target: 50000,
          current: 5000,
          category: 'Investment',
          priority: 1,
        },
      ],
      aiEstimations: {
        city: 'Austin',
        groceryEstimate: 0,
        entertainmentEstimate: 0,
        isEstimating: false,
        apiProvider: 'none',
      },
      surveyAnswers: {
        diningOutFrequency: 2,
        movieFrequency: 1,
        concertFrequency: 2,
        hasStreamingServices: true,
        gymMembership: false,
      },
      monthlyCheckIns: [],
      checkingAccounts: [],
      debtStrategy: 'avalanche',
    },
  },
});

let mainWindow;

function createWindow() {
  const { width, height } = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    title: 'ForgetFunds',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save window bounds on close
  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });
}

// IPC handlers for data persistence
ipcMain.handle('get-budget-data', () => {
  return store.get('budgetData');
});

ipcMain.handle('save-budget-data', (event, data) => {
  store.set('budgetData', data);
  return { success: true };
});

ipcMain.handle('export-budget-data', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Budget Data',
    defaultPath: `budget-data-${new Date().toISOString().split('T')[0]}.json`,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!result.canceled) {
    try {
      const data = {
        ...store.get('budgetData'),
        exportDate: new Date().toISOString(),
        version: '2.0',
      };

      await fs.writeFile(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, cancelled: true };
});

ipcMain.handle('import-budget-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Budget Data',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const fileContent = await fs.readFile(result.filePaths[0], 'utf8');
      const data = JSON.parse(fileContent);

      // Validate data structure before importing
      const requiredFields = ['debts', 'income', 'recurringExpenses'];
      const isValid = requiredFields.every(field => data.hasOwnProperty(field));

      if (isValid) {
        store.set('budgetData', data);
        return { success: true, data };
      } else {
        return { success: false, error: 'Invalid file format' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, cancelled: true };
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('menu-export'),
        },
        {
          label: 'Import Data',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow.webContents.send('menu-import'),
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
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
