export interface ElectronAPI {
  // Authentication and security
  checkAuthStatus: () => Promise<{
    isLocked: boolean;
    isAuthenticated: boolean;
    hasLegacyData: boolean;
    isPinConfigured: boolean;
  }>;
  unlockWithPassword: (password: string) => Promise<{
    success: boolean;
    error?: string;
    isNewDatabase?: boolean;
    migrationCompleted?: boolean;
  }>;
  unlockWithPin: (pin: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  setupPin: (pin: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  lockApp: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  validatePassword: (password: string) => Promise<{
    isValid: boolean;
    errors: string[];
    strength: number;
  }>;
  setLockTimeout: (timeoutMs: number) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Data operations (require authentication)
  getBudgetData: () => Promise<import('./budget').BudgetData>;
  saveBudgetData: (data: import('./budget').BudgetData) => Promise<{
    success: boolean;
    error?: string;
  }>;
  exportBudgetData: (exportPassword?: string) => Promise<{
    success: boolean;
    error?: string;
    filePath?: string;
    recordCount?: number;
    generatedPassword?: string;
    cancelled?: boolean;
  }>;
  importBudgetData: (importPassword?: string) => Promise<{
    success: boolean;
    error?: string;
    data?: import('./budget').BudgetData;
    recordCount?: number;
    wasEncrypted?: boolean;
    requiresPassword?: boolean;
    cancelled?: boolean;
  }>;

  // Export/Import utilities
  validateExportPassword: (password: string) => Promise<{
    isValid: boolean;
    errors: string[];
  }>;
  generateExportPassword: (length?: number) => Promise<{
    success: boolean;
    password?: string;
    error?: string;
  }>;

  // API key management
  storeApiKey: (
    provider: string,
    apiKey: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  getApiKey: (provider: string) => Promise<{
    success: boolean;
    apiKey?: string;
    error?: string;
  }>;
  removeApiKey: (provider: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Menu and system event listeners
  onMenuExport: (callback: () => void) => void;
  onMenuImport: (callback: () => void) => void;
  onAppLocked: (callback: () => void) => void;
  onSetupPin: (callback: () => void) => void;
  onSecuritySettings: (callback: () => void) => void;

  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
