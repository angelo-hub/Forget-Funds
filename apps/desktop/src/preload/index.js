const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication and security
  checkAuthStatus: () => ipcRenderer.invoke('check-auth-status'),
  unlockWithPassword: (password) => ipcRenderer.invoke('unlock-with-password', password),
  unlockWithPin: (pin) => ipcRenderer.invoke('unlock-with-pin', pin),
  setupPin: (pin) => ipcRenderer.invoke('setup-pin', pin),
  lockApp: () => ipcRenderer.invoke('lock-app'),
  validatePassword: (password) => ipcRenderer.invoke('validate-password', password),
  setLockTimeout: (timeoutMs) => ipcRenderer.invoke('set-lock-timeout', timeoutMs),

  // Data operations (require authentication)
  getBudgetData: () => ipcRenderer.invoke('get-budget-data'),
  saveBudgetData: (data) => ipcRenderer.invoke('save-budget-data', data),
  exportBudgetData: (exportPassword) => ipcRenderer.invoke('export-budget-data', exportPassword),
  importBudgetData: (importPassword) => ipcRenderer.invoke('import-budget-data', importPassword),
  
  // Export/Import utilities
  validateExportPassword: (password) => ipcRenderer.invoke('validate-export-password', password),
  generateExportPassword: (length) => ipcRenderer.invoke('generate-export-password', length),

  // API key management
  storeApiKey: (provider, apiKey) => ipcRenderer.invoke('store-api-key', provider, apiKey),
  getApiKey: (provider) => ipcRenderer.invoke('get-api-key', provider),
  removeApiKey: (provider) => ipcRenderer.invoke('remove-api-key', provider),

  // Menu and system event listeners
  onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
  onMenuImport: (callback) => ipcRenderer.on('menu-import', callback),
  onAppLocked: (callback) => ipcRenderer.on('app-locked', callback),
  onSetupPin: (callback) => ipcRenderer.on('setup-pin', callback),
  onSecuritySettings: (callback) => ipcRenderer.on('security-settings', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
