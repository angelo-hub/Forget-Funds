const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getBudgetData: () => ipcRenderer.invoke('get-budget-data'),
  saveBudgetData: data => ipcRenderer.invoke('save-budget-data', data),
  exportBudgetData: () => ipcRenderer.invoke('export-budget-data'),
  importBudgetData: () => ipcRenderer.invoke('import-budget-data'),

  // Menu event listeners
  onMenuExport: callback => ipcRenderer.on('menu-export', callback),
  onMenuImport: callback => ipcRenderer.on('menu-import', callback),

  // Remove listeners
  removeAllListeners: channel => ipcRenderer.removeAllListeners(channel),
});
