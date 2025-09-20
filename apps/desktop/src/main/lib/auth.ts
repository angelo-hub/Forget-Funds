import * as crypto from 'crypto';
import * as keytar from 'keytar';

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: number;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface ApiKeyResult extends AuthResult {
  apiKey?: string;
}

interface ProvidersResult extends AuthResult {
  providers: string[];
}

interface PinHashData {
  pinHash: string;
  salt: string;
}

interface PinHashResult extends AuthResult {
  pinHash?: string;
  salt?: string;
}

interface ClearCredentialsResult extends AuthResult {
  deletedCount?: number;
}

export class AuthenticationManager {
  private serviceName = 'ForgetFunds';
  private apiKeyAccount = 'api-keys';
  private isAuthenticated = false;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private sessionTimeoutMs = 30 * 60 * 1000; // 30 minutes

  /**
   * Validates password strength
   */
  validatePasswordStrength(password: string): PasswordValidation {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password),
    };
  }

  /**
   * Calculates password strength score (0-100)
   */
  private calculatePasswordStrength(password: string): number {
    let score = 0;

    // Length score
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;

    // Character variety score
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Generates a secure PIN hash for quick unlock
   */
  private generatePinHash(pin: string, salt: string): string {
    return crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
  }

  /**
   * Stores API key securely in OS keychain
   */
  async storeApiKey(provider: string, apiKey: string): Promise<AuthResult> {
    try {
      const account = `${this.apiKeyAccount}-${provider}`;
      await keytar.setPassword(this.serviceName, account, apiKey);
      return { success: true };
    } catch (error) {
      console.error('Failed to store API key:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Retrieves API key from OS keychain
   */
  async getApiKey(provider: string): Promise<ApiKeyResult> {
    try {
      const account = `${this.apiKeyAccount}-${provider}`;
      const apiKey = await keytar.getPassword(this.serviceName, account);
      return { success: true, apiKey: apiKey || undefined };
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Removes API key from OS keychain
   */
  async removeApiKey(provider: string): Promise<AuthResult> {
    try {
      const account = `${this.apiKeyAccount}-${provider}`;
      const deleted = await keytar.deletePassword(this.serviceName, account);
      return { success: deleted };
    } catch (error) {
      console.error('Failed to remove API key:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Lists all stored API key providers
   */
  async listApiKeyProviders(): Promise<ProvidersResult> {
    try {
      const credentials = await keytar.findCredentials(this.serviceName);
      const providers = credentials
        .filter(cred => cred.account.startsWith(this.apiKeyAccount))
        .map(cred => cred.account.replace(`${this.apiKeyAccount}-`, ''));

      return { success: true, providers };
    } catch (error) {
      console.error('Failed to list API key providers:', error);
      return { success: false, error: (error as Error).message, providers: [] };
    }
  }

  /**
   * Stores PIN hash for quick unlock
   */
  private async storePinHash(
    pinHash: string,
    salt: string
  ): Promise<AuthResult> {
    try {
      const data: PinHashData = { pinHash, salt };
      await keytar.setPassword(
        this.serviceName,
        'pin-data',
        JSON.stringify(data)
      );
      return { success: true };
    } catch (error) {
      console.error('Failed to store PIN hash:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Retrieves PIN hash for verification
   */
  private async getPinHash(): Promise<PinHashResult> {
    try {
      const data = await keytar.getPassword(this.serviceName, 'pin-data');
      if (!data) {
        return { success: false, error: 'No PIN configured' };
      }

      const parsed: PinHashData = JSON.parse(data);
      return { success: true, pinHash: parsed.pinHash, salt: parsed.salt };
    } catch (error) {
      console.error('Failed to retrieve PIN hash:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Verifies PIN against stored hash
   */
  async verifyPin(pin: string): Promise<AuthResult> {
    try {
      const pinData = await this.getPinHash();
      if (!pinData.success || !pinData.pinHash || !pinData.salt) {
        return { success: false, error: pinData.error || 'PIN data not found' };
      }

      const inputHash = this.generatePinHash(pin, pinData.salt);
      const isValid = inputHash === pinData.pinHash;

      if (isValid) {
        this.isAuthenticated = true;
        this.resetSessionTimeout();
      }

      return { success: isValid, error: isValid ? undefined : 'Invalid PIN' };
    } catch (error) {
      console.error('Failed to verify PIN:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Sets up PIN for quick unlock
   */
  async setupPin(pin: string): Promise<AuthResult> {
    try {
      // Validate PIN (4-8 digits)
      if (!/^\d{4,8}$/.test(pin)) {
        return { success: false, error: 'PIN must be 4-8 digits' };
      }

      const salt = crypto.randomBytes(32).toString('hex');
      const pinHash = this.generatePinHash(pin, salt);

      return await this.storePinHash(pinHash, salt);
    } catch (error) {
      console.error('Failed to setup PIN:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Removes PIN authentication
   */
  async removePin(): Promise<AuthResult> {
    try {
      const deleted = await keytar.deletePassword(this.serviceName, 'pin-data');
      return { success: deleted };
    } catch (error) {
      console.error('Failed to remove PIN:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Checks if PIN is configured
   */
  async isPinConfigured(): Promise<boolean> {
    const pinData = await this.getPinHash();
    return pinData.success;
  }

  /**
   * Resets session timeout
   */
  private resetSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    this.sessionTimeout = setTimeout(() => {
      console.log('Session timeout - logging out');
      this.logout();
    }, this.sessionTimeoutMs);
  }

  /**
   * Logs out the user
   */
  logout(): void {
    this.isAuthenticated = false;
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Checks if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Sets session timeout in milliseconds
   */
  setSessionTimeout(timeoutMs: number): void {
    this.sessionTimeoutMs = timeoutMs;
    if (this.isAuthenticated) {
      this.resetSessionTimeout();
    }
  }

  /**
   * Generates a secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Clears all stored credentials (for app reset)
   */
  async clearAllCredentials(): Promise<ClearCredentialsResult> {
    try {
      const credentials = await keytar.findCredentials(this.serviceName);
      const deletePromises = credentials.map(cred =>
        keytar.deletePassword(this.serviceName, cred.account)
      );

      await Promise.all(deletePromises);
      this.logout();

      return { success: true, deletedCount: credentials.length };
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Authenticates with master password (for database unlock)
   */
  async authenticateWithPassword(_password: string): Promise<AuthResult> {
    // This will be called after successful database unlock
    this.isAuthenticated = true;
    this.resetSessionTimeout();
    return { success: true };
  }
}

// Export singleton instance
export const authManager = new AuthenticationManager();
