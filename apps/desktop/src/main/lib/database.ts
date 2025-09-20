import Database from 'better-sqlite3';
import * as crypto from 'crypto';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { BudgetData } from '../types/budget';

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

interface DatabaseResult {
  success: boolean;
  error?: string;
  isNewDatabase?: boolean;
}

interface SecurityMetadata {
  id: number;
  salt: string;
  created_at: string;
}

export class SecureDatabase {
  private db: Database.Database | null = null;
  // Note: Encryption key stored for future use in data-at-rest encryption
  // @ts-ignore - Reserved for future data-at-rest encryption
  private encryptionKey: Buffer | null = null;
  private isUnlocked: boolean = false;
  private dbPath: string;
  private lockTimeout: NodeJS.Timeout | null = null;
  private lockTimeoutMs: number = 30 * 60 * 1000; // 30 minutes default

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'budget.db');
  }

  /**
   * Derives encryption key from master password using PBKDF2
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  /**
   * Generates a random salt for key derivation
   */
  private generateSalt(): Buffer {
    return crypto.randomBytes(32);
  }

  /**
   * Encrypts data using AES-256-GCM (reserved for future data-at-rest encryption)
   */
  // @ts-ignore - Reserved for future data-at-rest encryption
  private encrypt(data: any, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypts data using AES-256-GCM (reserved for future data-at-rest encryption)
   */
  // @ts-ignore - Reserved for future data-at-rest encryption
  private decrypt(encryptedData: EncryptedData, key: Buffer): any {
    try {
      const decipher = crypto.createDecipher('aes-256-gcm', key);
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(
        'Failed to decrypt data - invalid password or corrupted data'
      );
    }
  }

  /**
   * Initializes the database with proper schema
   */
  private initializeDatabase(): void {
    if (!this.db) {
      throw new Error('Database not unlocked');
    }

    // Create tables with proper schema
    this.db.exec(`
      -- Core tables
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        settings TEXT
      );

      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        source TEXT NOT NULL,
        amount REAL NOT NULL,
        frequency TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('recurring', 'one-time')),
        description TEXT,
        date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS debts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        name TEXT NOT NULL,
        balance REAL NOT NULL,
        apr REAL NOT NULL,
        min_payment REAL NOT NULL,
        type TEXT DEFAULT 'revolving',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS installment_loans (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        name TEXT NOT NULL,
        balance REAL NOT NULL,
        monthly_payment REAL NOT NULL,
        remaining_months INTEGER NOT NULL,
        type TEXT DEFAULT 'installment',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS savings (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        name TEXT NOT NULL,
        target REAL NOT NULL,
        current REAL DEFAULT 0,
        category TEXT,
        priority INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS checking_accounts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        name TEXT NOT NULL,
        balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS monthly_check_ins (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        date TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS ai_estimations (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        city TEXT,
        grocery_estimate REAL DEFAULT 0,
        entertainment_estimate REAL DEFAULT 0,
        is_estimating BOOLEAN DEFAULT FALSE,
        api_provider TEXT DEFAULT 'none',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS survey_answers (
        id INTEGER PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        dining_out_frequency INTEGER DEFAULT 2,
        movie_frequency INTEGER DEFAULT 1,
        concert_frequency INTEGER DEFAULT 2,
        has_streaming_services BOOLEAN DEFAULT TRUE,
        gym_membership BOOLEAN DEFAULT FALSE,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Sync and versioning tables
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        device_id TEXT
      );

      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Security metadata table
      CREATE TABLE IF NOT EXISTS security_metadata (
        id INTEGER PRIMARY KEY,
        salt TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert initial schema version
      INSERT OR IGNORE INTO schema_version (version) VALUES (1);

      -- Create default user if not exists
      INSERT OR IGNORE INTO users (id, settings) VALUES (1, '{}');
    `);

    console.log('Database initialized successfully');
  }

  /**
   * Unlocks the database with master password
   */
  async unlock(password: string): Promise<DatabaseResult> {
    try {
      // Check if database file exists
      const dbExists = fs.existsSync(this.dbPath);

      if (!dbExists) {
        // First time setup - create new database
        return this.createNewDatabase(password);
      }

      // Open existing database
      this.db = new Database(this.dbPath);

      // Get stored salt
      const saltRow = this.db
        .prepare('SELECT salt FROM security_metadata LIMIT 1')
        .get() as SecurityMetadata | undefined;
      if (!saltRow) {
        throw new Error('Database corrupted - no security metadata found');
      }

      // Derive key from password and stored salt
      const salt = Buffer.from(saltRow.salt, 'hex');
      this.encryptionKey = this.deriveKey(password, salt);

      // Test decryption with a simple query
      try {
        this.db.prepare('SELECT COUNT(*) as count FROM users').get();
        this.isUnlocked = true;
        this.resetLockTimeout();
        return { success: true, isNewDatabase: false };
      } catch (error) {
        this.db.close();
        this.db = null;
        throw new Error('Invalid password');
      }
    } catch (error) {
      console.error('Failed to unlock database:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Creates a new encrypted database
   */
  private async createNewDatabase(password: string): Promise<DatabaseResult> {
    try {
      // Generate new salt
      const salt = this.generateSalt();
      this.encryptionKey = this.deriveKey(password, salt);

      // Create new database
      this.db = new Database(this.dbPath);
      this.initializeDatabase();

      // Store salt in security metadata
      this.db
        .prepare('INSERT INTO security_metadata (salt) VALUES (?)')
        .run(salt.toString('hex'));

      this.isUnlocked = true;
      this.resetLockTimeout();

      console.log('New encrypted database created successfully');
      return { success: true, isNewDatabase: true };
    } catch (error) {
      console.error('Failed to create new database:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Locks the database
   */
  lock(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.encryptionKey = null;
    this.isUnlocked = false;
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
    console.log('Database locked');
  }

  /**
   * Resets the auto-lock timeout
   */
  private resetLockTimeout(): void {
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
    }

    this.lockTimeout = setTimeout(() => {
      console.log('Auto-locking database due to inactivity');
      this.lock();
    }, this.lockTimeoutMs);
  }

  /**
   * Checks if database is unlocked
   */
  isDbUnlocked(): boolean {
    return this.isUnlocked && this.db !== null;
  }

  /**
   * Generic method to execute queries safely
   */
  executeQuery<T = any>(query: string, params: any[] = []): T[] {
    if (!this.isDbUnlocked()) {
      throw new Error('Database is locked');
    }

    this.resetLockTimeout();
    return this.db!.prepare(query).all(params) as T[];
  }

  /**
   * Generic method to execute single row queries
   */
  executeQuerySingle<T = any>(
    query: string,
    params: any[] = []
  ): T | undefined {
    if (!this.isDbUnlocked()) {
      throw new Error('Database is locked');
    }

    this.resetLockTimeout();
    return this.db!.prepare(query).get(params) as T | undefined;
  }

  /**
   * Generic method to execute insert/update/delete queries
   */
  executeUpdate(query: string, params: any[] = []): Database.RunResult {
    if (!this.isDbUnlocked()) {
      throw new Error('Database is locked');
    }

    this.resetLockTimeout();
    return this.db!.prepare(query).run(params);
  }

  /**
   * Sets auto-lock timeout in milliseconds
   */
  setLockTimeout(timeoutMs: number): void {
    this.lockTimeoutMs = timeoutMs;
    if (this.isUnlocked) {
      this.resetLockTimeout();
    }
  }

  /**
   * Gets current budget data from database
   */
  async getBudgetData(): Promise<BudgetData> {
    if (!this.isDbUnlocked()) {
      throw new Error('Database is locked');
    }

    // Fetch all data from database

    const income = this.executeQuery('SELECT * FROM income WHERE user_id = 1');
    const debts = this.executeQuery('SELECT * FROM debts WHERE user_id = 1');
    const installmentLoans = this.executeQuery(
      'SELECT * FROM installment_loans WHERE user_id = 1'
    );
    const recurringExpenses = this.executeQuery(
      "SELECT * FROM expenses WHERE user_id = 1 AND type = 'recurring'"
    );
    const oneTimeExpenses = this.executeQuery(
      "SELECT * FROM expenses WHERE user_id = 1 AND type = 'one-time'"
    );
    const savingsBuckets = this.executeQuery(
      'SELECT * FROM savings WHERE user_id = 1'
    );
    const checkingAccounts = this.executeQuery(
      'SELECT * FROM checking_accounts WHERE user_id = 1'
    );
    const monthlyCheckIns = this.executeQuery(
      'SELECT * FROM monthly_check_ins WHERE user_id = 1'
    );

    // Get AI estimations and survey answers
    const aiEstimations = this.executeQuerySingle(
      'SELECT * FROM ai_estimations WHERE user_id = 1'
    ) || {
      city: 'Austin',
      grocery_estimate: 0,
      entertainment_estimate: 0,
      is_estimating: false,
      api_provider: 'none',
    };

    const surveyAnswers = this.executeQuerySingle(
      'SELECT * FROM survey_answers WHERE user_id = 1'
    ) || {
      dining_out_frequency: 2,
      movie_frequency: 1,
      concert_frequency: 2,
      has_streaming_services: true,
      gym_membership: false,
    };

    return {
      income: income.map(row => ({
        id: row.id,
        source: row.source,
        amount: row.amount,
        frequency:
          row.frequency === 'bi-weekly'
            ? 'biweekly'
            : (row.frequency as 'monthly' | 'weekly' | 'biweekly'),
      })),
      debts: debts.map(row => ({
        id: row.id,
        name: row.name,
        balance: row.balance,
        apr: row.apr,
        minPayment: row.min_payment,
        type: 'revolving' as const,
      })),
      installmentLoans: installmentLoans.map(row => ({
        id: row.id,
        name: row.name,
        balance: row.balance,
        monthlyPayment: row.monthly_payment,
        remainingMonths: row.remaining_months,
        type: 'installment' as const,
      })),
      recurringExpenses: recurringExpenses.map(row => ({
        id: row.id,
        category: row.category,
        amount: row.amount,
      })),
      oneTimeExpenses: oneTimeExpenses.map(row => ({
        id: row.id,
        description: row.description,
        amount: row.amount,
      })),
      savingsBuckets: savingsBuckets.map(row => ({
        id: row.id,
        name: row.name,
        target: row.target,
        current: row.current,
        category: row.category,
        priority: row.priority,
      })),
      checkingAccounts: checkingAccounts.map(row => ({
        id: row.id,
        name: row.name,
        balance: row.balance,
        category: 'Primary' as const,
        linkedExpenses: [],
        linkedDebts: [],
        linkedLoans: [],
        color: '#3B82F6',
        isActive: true,
        notes: '',
      })),
      monthlyCheckIns: monthlyCheckIns.map(row => {
        const parsedData = JSON.parse(row.data);
        return {
          id: row.id,
          month: row.date,
          actualIncome: parsedData.actualIncome || 0,
          actualExpenses: parsedData.actualExpenses || 0,
          actualSavings: parsedData.actualSavings || 0,
          projectedIncome: parsedData.projectedIncome || 0,
          projectedExpenses: parsedData.projectedExpenses || 0,
          projectedSavings: parsedData.projectedSavings || 0,
          notes: parsedData.notes || '',
          createdAt: parsedData.createdAt || new Date().toISOString(),
        };
      }),
      aiEstimations: {
        city: aiEstimations.city,
        groceryEstimate: aiEstimations.grocery_estimate,
        entertainmentEstimate: aiEstimations.entertainment_estimate,
        isEstimating: Boolean(aiEstimations.is_estimating),
        apiProvider: aiEstimations.api_provider,
      },
      surveyAnswers: {
        diningOutFrequency: surveyAnswers.dining_out_frequency,
        movieFrequency: surveyAnswers.movie_frequency,
        concertFrequency: surveyAnswers.concert_frequency,
        hasStreamingServices: Boolean(surveyAnswers.has_streaming_services),
        gymMembership: Boolean(surveyAnswers.gym_membership),
      },
      debtStrategy: 'avalanche' as const,
      retirementAccounts: [], // TODO: Add retirement accounts table
    };
  }

  /**
   * Saves budget data to database
   */
  async saveBudgetData(
    data: BudgetData
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isDbUnlocked()) {
      return { success: false, error: 'Database is locked' };
    }

    console.log('💾 [Database] Saving budget data to SQLite:', {
      income: data.income?.length || 0,
      recurringExpenses: data.recurringExpenses?.length || 0,
      oneTimeExpenses: data.oneTimeExpenses?.length || 0,
      debts: data.debts?.length || 0,
      installmentLoans: data.installmentLoans?.length || 0,
      savingsBuckets: data.savingsBuckets?.length || 0,
      checkingAccounts: data.checkingAccounts?.length || 0,
      monthlyCheckIns: data.monthlyCheckIns?.length || 0,
      hasAiEstimations: !!data.aiEstimations,
      hasSurveyAnswers: !!data.surveyAnswers,
    });

    // Debug log the actual data types being passed
    console.log('🔍 [Database] Data types check:', {
      aiEstimations: data.aiEstimations
        ? typeof data.aiEstimations
        : 'undefined',
      surveyAnswers: data.surveyAnswers
        ? typeof data.surveyAnswers
        : 'undefined',
      aiEstimationsKeys: data.aiEstimations
        ? Object.keys(data.aiEstimations)
        : [],
      surveyAnswersKeys: data.surveyAnswers
        ? Object.keys(data.surveyAnswers)
        : [],
    });

    try {
      // Use transaction for data consistency
      const transaction = this.db!.transaction(() => {
        // Clear existing data
        this.executeUpdate('DELETE FROM income WHERE user_id = 1');
        this.executeUpdate('DELETE FROM debts WHERE user_id = 1');
        this.executeUpdate('DELETE FROM installment_loans WHERE user_id = 1');
        this.executeUpdate('DELETE FROM expenses WHERE user_id = 1');
        this.executeUpdate('DELETE FROM savings WHERE user_id = 1');
        this.executeUpdate('DELETE FROM checking_accounts WHERE user_id = 1');
        this.executeUpdate('DELETE FROM monthly_check_ins WHERE user_id = 1');

        // Insert new data
        data.income.forEach(item => {
          this.executeUpdate(
            'INSERT INTO income (source, amount, frequency) VALUES (?, ?, ?)',
            [item.source, item.amount, item.frequency]
          );
        });

        data.debts.forEach(item => {
          this.executeUpdate(
            'INSERT INTO debts (name, balance, apr, min_payment, type) VALUES (?, ?, ?, ?, ?)',
            [item.name, item.balance, item.apr, item.minPayment, item.type]
          );
        });

        data.installmentLoans.forEach(item => {
          this.executeUpdate(
            'INSERT INTO installment_loans (name, balance, monthly_payment, remaining_months, type) VALUES (?, ?, ?, ?, ?)',
            [
              item.name,
              item.balance,
              item.monthlyPayment,
              item.remainingMonths,
              item.type,
            ]
          );
        });

        data.recurringExpenses.forEach(item => {
          this.executeUpdate(
            'INSERT INTO expenses (category, amount, type) VALUES (?, ?, ?)',
            [item.category, item.amount, 'recurring']
          );
        });

        data.oneTimeExpenses.forEach(item => {
          this.executeUpdate(
            'INSERT INTO expenses (description, amount, type) VALUES (?, ?, ?)',
            [item.description, item.amount, 'one-time']
          );
        });

        data.savingsBuckets.forEach(item => {
          this.executeUpdate(
            'INSERT INTO savings (name, target, current, category, priority) VALUES (?, ?, ?, ?, ?)',
            [item.name, item.target, item.current, item.category, item.priority]
          );
        });

        data.checkingAccounts.forEach(item => {
          this.executeUpdate(
            'INSERT INTO checking_accounts (name, balance) VALUES (?, ?)',
            [item.name, item.balance]
          );
        });

        data.monthlyCheckIns.forEach(item => {
          const checkInData = {
            actualIncome: item.actualIncome,
            actualExpenses: item.actualExpenses,
            actualSavings: item.actualSavings,
            projectedIncome: item.projectedIncome,
            projectedExpenses: item.projectedExpenses,
            projectedSavings: item.projectedSavings,
            notes: item.notes,
            createdAt: item.createdAt,
          };
          this.executeUpdate(
            'INSERT INTO monthly_check_ins (date, data) VALUES (?, ?)',
            [item.month, JSON.stringify(checkInData)]
          );
        });

        // Update AI estimations and survey answers with null safety
        if (data.aiEstimations) {
          console.log(
            '💾 [Database] Saving AI estimations:',
            data.aiEstimations
          );
          this.executeUpdate(
            `
            INSERT OR REPLACE INTO ai_estimations 
            (user_id, city, grocery_estimate, entertainment_estimate, is_estimating, api_provider) 
            VALUES (1, ?, ?, ?, ?, ?)
          `,
            [
              data.aiEstimations.city || '',
              data.aiEstimations.groceryEstimate || 0,
              data.aiEstimations.entertainmentEstimate || 0,
              data.aiEstimations.isEstimating ? 1 : 0, // Convert boolean to integer
              data.aiEstimations.apiProvider || 'none',
            ]
          );
        } else {
          console.log('⚠️ [Database] No AI estimations data to save');
        }

        if (data.surveyAnswers) {
          console.log(
            '💾 [Database] Saving survey answers:',
            data.surveyAnswers
          );
          this.executeUpdate(
            `
            INSERT OR REPLACE INTO survey_answers 
            (user_id, dining_out_frequency, movie_frequency, concert_frequency, has_streaming_services, gym_membership) 
            VALUES (1, ?, ?, ?, ?, ?)
          `,
            [
              data.surveyAnswers.diningOutFrequency || 0,
              data.surveyAnswers.movieFrequency || 0,
              data.surveyAnswers.concertFrequency || 0,
              data.surveyAnswers.hasStreamingServices ? 1 : 0, // Convert boolean to integer
              data.surveyAnswers.gymMembership ? 1 : 0, // Convert boolean to integer
            ]
          );
        } else {
          console.log('⚠️ [Database] No survey answers data to save');
        }
      });

      transaction();
      console.log('✅ [Database] Budget data saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [Database] Failed to save budget data:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const secureDatabase = new SecureDatabase();
