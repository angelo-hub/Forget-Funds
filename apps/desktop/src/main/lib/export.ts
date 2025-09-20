import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { BudgetData } from '../types/budget';

interface EncryptedExportPackage {
  version: string;
  encrypted: true;
  timestamp: string;
  salt: string;
  iv: string;
  authTag: string;
  data: string;
  checksum: string;
  metadata: {
    recordCounts: {
      income: number;
      debts: number;
      installmentLoans: number;
      recurringExpenses: number;
      oneTimeExpenses: number;
      savingsBuckets: number;
      checkingAccounts: number;
      monthlyCheckIns: number;
    };
  };
}

interface ExportResult {
  success: boolean;
  error?: string;
  filePath?: string;
  recordCount?: number;
}

interface ImportResult {
  success: boolean;
  error?: string;
  data?: BudgetData;
  recordCount?: number;
}

export class SecureExportManager {
  private readonly EXPORT_VERSION = '3.0';
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly KEY_DERIVATION_ITERATIONS = 100000;

  /**
   * Derives encryption key from password using PBKDF2
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.KEY_DERIVATION_ITERATIONS,
      32,
      'sha256'
    );
  }

  /**
   * Encrypts data using AES-256-GCM
   */
  private encryptData(
    data: string,
    password: string
  ): {
    salt: string;
    iv: string;
    authTag: string;
    encrypted: string;
  } {
    const salt = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const key = this.deriveKey(password, salt);

    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted,
    };
  }

  /**
   * Decrypts data using AES-256-GCM
   */
  private decryptData(
    encryptedData: string,
    password: string,
    salt: string,
    _iv: string,
    authTag: string
  ): string {
    const saltBuffer = Buffer.from(salt, 'hex');
    // const ivBuffer = Buffer.from(iv, 'hex'); // Not used in current implementation
    const authTagBuffer = Buffer.from(authTag, 'hex');
    const key = this.deriveKey(password, saltBuffer);

    const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Calculates SHA-256 checksum of data
   */
  private calculateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Counts records in budget data
   */
  private countRecords(data: BudgetData): number {
    return (
      data.income.length +
      data.debts.length +
      data.installmentLoans.length +
      data.recurringExpenses.length +
      data.oneTimeExpenses.length +
      data.savingsBuckets.length +
      data.checkingAccounts.length +
      data.monthlyCheckIns.length
    );
  }

  /**
   * Creates metadata for export package
   */
  private createMetadata(data: BudgetData) {
    return {
      recordCounts: {
        income: data.income.length,
        debts: data.debts.length,
        installmentLoans: data.installmentLoans.length,
        recurringExpenses: data.recurringExpenses.length,
        oneTimeExpenses: data.oneTimeExpenses.length,
        savingsBuckets: data.savingsBuckets.length,
        checkingAccounts: data.checkingAccounts.length,
        monthlyCheckIns: data.monthlyCheckIns.length,
      },
    };
  }

  /**
   * Exports budget data with encryption and integrity protection
   */
  async exportEncrypted(
    data: BudgetData,
    filePath: string,
    password: string
  ): Promise<ExportResult> {
    try {
      // Prepare export data with metadata
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        version: this.EXPORT_VERSION,
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(exportData, null, 2);

      // Calculate checksum of original data
      const checksum = this.calculateChecksum(jsonData);

      // Encrypt the data
      const encryptionResult = this.encryptData(jsonData, password);

      // Create export package
      const exportPackage: EncryptedExportPackage = {
        version: this.EXPORT_VERSION,
        encrypted: true,
        timestamp: new Date().toISOString(),
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        authTag: encryptionResult.authTag,
        data: encryptionResult.encrypted,
        checksum,
        metadata: this.createMetadata(data),
      };

      // Write encrypted package to file
      await fs.writeFile(filePath, JSON.stringify(exportPackage, null, 2));

      const recordCount = this.countRecords(data);
      console.log(
        `Encrypted export completed: ${recordCount} records exported to ${filePath}`
      );

      return {
        success: true,
        filePath,
        recordCount,
      };
    } catch (error) {
      console.error('Failed to export encrypted data:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Imports encrypted budget data with integrity verification
   */
  async importEncrypted(
    filePath: string,
    password: string
  ): Promise<ImportResult> {
    try {
      // Read the encrypted package
      const fileContent = await fs.readFile(filePath, 'utf8');
      const exportPackage: EncryptedExportPackage = JSON.parse(fileContent);

      // Validate package structure
      if (!exportPackage.encrypted || !exportPackage.data) {
        return {
          success: false,
          error: 'Invalid encrypted export file format',
        };
      }

      // Check version compatibility
      if (exportPackage.version !== this.EXPORT_VERSION) {
        console.warn(
          `Version mismatch: expected ${this.EXPORT_VERSION}, got ${exportPackage.version}`
        );
        // Continue with import but log warning
      }

      // Decrypt the data
      const decryptedData = this.decryptData(
        exportPackage.data,
        password,
        exportPackage.salt,
        exportPackage.iv,
        exportPackage.authTag
      );

      // Verify data integrity
      const calculatedChecksum = this.calculateChecksum(decryptedData);
      if (calculatedChecksum !== exportPackage.checksum) {
        return {
          success: false,
          error:
            'Data integrity check failed - file may be corrupted or tampered with',
        };
      }

      // Parse the decrypted JSON
      const budgetData: BudgetData = JSON.parse(decryptedData);

      // Validate required fields
      const requiredFields = [
        'income',
        'debts',
        'recurringExpenses',
        'savingsBuckets',
      ];
      const missingFields = requiredFields.filter(
        field => !budgetData.hasOwnProperty(field)
      );

      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Invalid data structure - missing fields: ${missingFields.join(', ')}`,
        };
      }

      const recordCount = this.countRecords(budgetData);
      console.log(
        `Encrypted import completed: ${recordCount} records imported from ${filePath}`
      );

      return {
        success: true,
        data: budgetData,
        recordCount,
      };
    } catch (error) {
      console.error('Failed to import encrypted data:', error);

      // Provide more specific error messages
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: 'Invalid file format - not a valid JSON file',
        };
      }

      if ((error as Error).message.includes('bad decrypt')) {
        return {
          success: false,
          error: 'Invalid password or corrupted file',
        };
      }

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Validates password strength for export encryption
   */
  validateExportPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Export password must be at least 12 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Export password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Export password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Export password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push(
        'Export password must contain at least one special character'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generates a secure random password for exports
   */
  generateExportPassword(length: number = 20): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';

    // Ensure at least one character from each required category
    const categories = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      '!@#$%^&*()_+-=[]{}|;:,.<>?',
    ];

    // Add one character from each category
    categories.forEach(category => {
      const randomIndex = crypto.randomInt(0, category.length);
      password += category[randomIndex];
    });

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split('')
      .sort(() => crypto.randomInt(0, 3) - 1)
      .join('');
  }
}

// Export singleton instance
export const exportManager = new SecureExportManager();
