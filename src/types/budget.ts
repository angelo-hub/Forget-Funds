export interface Debt {
  id: number;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  type: 'revolving';
}

export interface InstallmentLoan {
  id: number;
  name: string;
  balance: number;
  monthlyPayment: number;
  remainingMonths: number;
  type: 'installment';
}

export interface Income {
  id: number;
  source: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
}

export interface RecurringExpense {
  id: number;
  category: string;
  amount: number;
}

export interface OneTimeExpense {
  id: number;
  description: string;
  amount: number;
}

export interface SavingsBucket {
  id: number;
  name: string;
  target: number;
  current: number;
  category: 'Emergency' | 'Investment' | 'Lifestyle' | 'Education' | 'General';
  priority: 1 | 2 | 3;
}

export interface AIEstimations {
  city: string;
  groceryEstimate: number;
  entertainmentEstimate: number;
  isEstimating: boolean;
  apiKey?: string;
  apiProvider?: 'openai' | 'anthropic' | 'local' | 'none';
}

export interface SurveyAnswers {
  diningOutFrequency: number;
  movieFrequency: number;
  concertFrequency: number;
  hasStreamingServices: boolean;
  gymMembership: boolean;
}

export interface MonthlyCheckIn {
  id: number;
  month: string; // Format: "2024-01"
  actualIncome: number;
  actualExpenses: number;
  actualSavings: number;
  projectedIncome: number;
  projectedExpenses: number;
  projectedSavings: number;
  notes: string;
  createdAt: string;
}

export interface BudgetVariance {
  incomeVariance: number;
  expenseVariance: number;
  savingsVariance: number;
  overallVariance: number;
}

export interface CheckingAccount {
  id: number;
  name: string;
  category:
    | 'Primary'
    | 'Bills'
    | 'Rent'
    | 'Loans'
    | 'Savings'
    | 'Emergency'
    | 'Other';
  balance: number;
  linkedExpenses: number[]; // IDs of linked recurring expenses
  linkedDebts: number[]; // IDs of linked debts
  linkedLoans: number[]; // IDs of linked loans
  color: string; // Hex color for visual identification
  isActive: boolean;
  notes: string;
  lastFourDigits?: string; // Last 4 digits for account matching
}

export interface RetirementAccount {
  id: number;
  name: string;
  type: '401k' | 'IRA' | 'Roth IRA' | '403b' | 'SEP-IRA' | 'Simple IRA';
  balance: number;
  employer?: string; // For 401k/403b
  contributionLimit: number; // Annual limit
  currentYearContributions: number;
  expectedReturn: number; // Expected annual return percentage
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  targetRetirementAge: number;
  isActive: boolean;
  lastFourDigits?: string;
  notes: string;
}

export interface RetirementProjection {
  currentAge: number;
  retirementAge: number;
  yearsToRetirement: number;
  projectedBalance: number;
  monthlyContributionNeeded: number;
  shortfall: number; // If negative, surplus if positive
}

export interface BudgetData {
  debts: Debt[];
  installmentLoans: InstallmentLoan[];
  income: Income[];
  recurringExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];
  savingsBuckets: SavingsBucket[];
  aiEstimations: AIEstimations;
  surveyAnswers: SurveyAnswers;
  monthlyCheckIns: MonthlyCheckIn[];
  checkingAccounts: CheckingAccount[];
  retirementAccounts: RetirementAccount[];
  debtStrategy: 'avalanche' | 'snowball';
  exportDate?: string;
  version?: string;
}

export interface DebtCalculation extends Debt {
  monthlyInterest: number;
  payoffTime: number;
  totalInterest: number;
}

export interface ChartDataPoint {
  month: number;
  balance?: number;
  payment?: number;
  savings?: number;
  target?: number;
}

export interface ExpensePieData {
  name: string;
  value: number;
  color: string;
}

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      getBudgetData: () => Promise<BudgetData>;
      saveBudgetData: (data: BudgetData) => Promise<{ success: boolean }>;
      exportBudgetData: () => Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
        cancelled?: boolean;
      }>;
      importBudgetData: () => Promise<{
        success: boolean;
        data?: BudgetData;
        error?: string;
        cancelled?: boolean;
      }>;
      onMenuExport: (callback: () => void) => void;
      onMenuImport: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
