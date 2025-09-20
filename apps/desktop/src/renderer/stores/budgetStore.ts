import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  AIEstimations,
  BudgetData,
  CheckingAccount,
  Debt,
  Income,
  InstallmentLoan,
  MonthlyCheckIn,
  OneTimeExpense,
  RecurringExpense,
  SavingsBucket,
  SurveyAnswers,
} from '../types/budget';

interface BudgetState {
  // Data
  budgetData: BudgetData | null;
  isLoading: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // Actions
  setBudgetData: (data: BudgetData) => void;
  setLoading: (loading: boolean) => void;

  // Granular update actions
  updateIncome: (income: Income[]) => Promise<void>;
  updateRecurringExpenses: (expenses: RecurringExpense[]) => Promise<void>;
  updateOneTimeExpenses: (expenses: OneTimeExpense[]) => Promise<void>;
  updateDebts: (debts: Debt[]) => Promise<void>;
  updateInstallmentLoans: (loans: InstallmentLoan[]) => Promise<void>;
  updateSavingsBuckets: (buckets: SavingsBucket[]) => Promise<void>;
  updateCheckingAccounts: (accounts: CheckingAccount[]) => Promise<void>;
  updateMonthlyCheckIns: (checkIns: MonthlyCheckIn[]) => Promise<void>;
  updateAIEstimations: (estimations: AIEstimations) => Promise<void>;
  updateSurveyAnswers: (answers: SurveyAnswers) => Promise<void>;

  // Utility actions
  markSaved: () => void;
  markUnsaved: () => void;
  reset: () => void;
}

// Helper function to save data to SQLite via Electron API
const saveToDatabase = async (data: BudgetData): Promise<boolean> => {
  console.log('🔄 [Zustand] Attempting to save data to SQLite...');

  if (!window.electronAPI) {
    console.error('❌ [Zustand] Electron API not available');
    return false;
  }

  try {
    console.log('📊 [Zustand] Data being saved:', {
      income: data.income?.length || 0,
      recurringExpenses: data.recurringExpenses?.length || 0,
      oneTimeExpenses: data.oneTimeExpenses?.length || 0,
      debts: data.debts?.length || 0,
      installmentLoans: data.installmentLoans?.length || 0,
      savingsBuckets: data.savingsBuckets?.length || 0,
      checkingAccounts: data.checkingAccounts?.length || 0,
      monthlyCheckIns: data.monthlyCheckIns?.length || 0,
    });

    const result = await window.electronAPI.saveBudgetData(data);

    if (result.success) {
      console.log('✅ [Zustand] SQLite save successful');
    } else {
      console.error('❌ [Zustand] SQLite save failed:', (result as any).error);
    }

    return result.success;
  } catch (error) {
    console.error('❌ [Zustand] Exception during SQLite save:', error);
    return false;
  }
};

// Helper function to create logged update actions
const createUpdateAction = <T>(
  actionName: string,
  icon: string,
  dataKey: keyof BudgetData
) => {
  return async (newData: T, get: any, set: any) => {
    console.log(
      `${icon} [Zustand] Updating ${actionName}:`,
      Array.isArray(newData) ? newData.length + ' items' : 'single item'
    );
    const currentData = get().budgetData;
    if (!currentData) {
      console.error(
        `❌ [Zustand] No current budget data available for ${actionName} update`
      );
      return;
    }

    const updatedData = { ...currentData, [dataKey]: newData };

    // Optimistic update
    console.log(`⚡ [Zustand] Applying optimistic ${actionName} update`);
    set({
      budgetData: updatedData,
      hasUnsavedChanges: true,
    });

    // Save to SQLite
    const success = await saveToDatabase(updatedData);
    if (success) {
      console.log(`✅ [Zustand] ${actionName} update completed successfully`);
      set({
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      });
    } else {
      // Rollback on failure
      console.error(
        `🔄 [Zustand] Rolling back ${actionName} changes due to SQLite failure`
      );
      set({
        budgetData: currentData,
        hasUnsavedChanges: false,
      });
    }
  };
};

export const useBudgetStore = create<BudgetState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    budgetData: null,
    isLoading: false,
    lastSaved: null,
    hasUnsavedChanges: false,

    // Basic actions
    setBudgetData: (data: BudgetData) => {
      console.log('📥 [Zustand] Setting budget data:', {
        income: data.income?.length || 0,
        recurringExpenses: data.recurringExpenses?.length || 0,
        oneTimeExpenses: data.oneTimeExpenses?.length || 0,
        debts: data.debts?.length || 0,
        installmentLoans: data.installmentLoans?.length || 0,
        savingsBuckets: data.savingsBuckets?.length || 0,
        checkingAccounts: data.checkingAccounts?.length || 0,
        monthlyCheckIns: data.monthlyCheckIns?.length || 0,
      });
      set({
        budgetData: data,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    // Granular update actions with optimistic updates
    updateIncome: async (income: Income[]) => {
      await createUpdateAction('income', '💰', 'income')(income, get, set);
    },

    updateRecurringExpenses: async (recurringExpenses: RecurringExpense[]) => {
      await createUpdateAction('recurring expenses', '🛒', 'recurringExpenses')(
        recurringExpenses,
        get,
        set
      );
    },

    updateOneTimeExpenses: async (oneTimeExpenses: OneTimeExpense[]) => {
      await createUpdateAction('one-time expenses', '💸', 'oneTimeExpenses')(
        oneTimeExpenses,
        get,
        set
      );
    },

    updateDebts: async (debts: Debt[]) => {
      await createUpdateAction('debts', '💳', 'debts')(debts, get, set);
    },

    updateInstallmentLoans: async (installmentLoans: InstallmentLoan[]) => {
      await createUpdateAction('installment loans', '🏠', 'installmentLoans')(
        installmentLoans,
        get,
        set
      );
    },

    updateSavingsBuckets: async (savingsBuckets: SavingsBucket[]) => {
      await createUpdateAction('savings buckets', '🎯', 'savingsBuckets')(
        savingsBuckets,
        get,
        set
      );
    },

    updateCheckingAccounts: async (checkingAccounts: CheckingAccount[]) => {
      await createUpdateAction('checking accounts', '🏦', 'checkingAccounts')(
        checkingAccounts,
        get,
        set
      );
    },

    updateMonthlyCheckIns: async (monthlyCheckIns: MonthlyCheckIn[]) => {
      await createUpdateAction('monthly check-ins', '📅', 'monthlyCheckIns')(
        monthlyCheckIns,
        get,
        set
      );
    },

    updateAIEstimations: async (aiEstimations: AIEstimations) => {
      await createUpdateAction('AI estimations', '🤖', 'aiEstimations')(
        aiEstimations,
        get,
        set
      );
    },

    updateSurveyAnswers: async (surveyAnswers: SurveyAnswers) => {
      await createUpdateAction('survey answers', '📋', 'surveyAnswers')(
        surveyAnswers,
        get,
        set
      );
    },

    // Utility actions
    markSaved: () => {
      set({
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      });
    },

    markUnsaved: () => {
      set({ hasUnsavedChanges: true });
    },

    reset: () => {
      set({
        budgetData: null,
        isLoading: false,
        lastSaved: null,
        hasUnsavedChanges: false,
      });
    },
  }))
);

// Selector hooks for better performance
export const useBudgetData = () => useBudgetStore(state => state.budgetData);
export const useIsLoading = () => useBudgetStore(state => state.isLoading);
export const useHasUnsavedChanges = () =>
  useBudgetStore(state => state.hasUnsavedChanges);
export const useLastSaved = () => useBudgetStore(state => state.lastSaved);

// Income selectors
export const useIncome = () =>
  useBudgetStore(state => state.budgetData?.income || []);
export const useIncomeActions = () =>
  useBudgetStore(state => state.updateIncome);

// Expense selectors
export const useRecurringExpenses = () =>
  useBudgetStore(state => state.budgetData?.recurringExpenses || []);
export const useOneTimeExpenses = () =>
  useBudgetStore(state => state.budgetData?.oneTimeExpenses || []);
export const useExpenseActions = () => ({
  updateRecurringExpenses: useBudgetStore(
    state => state.updateRecurringExpenses
  ),
  updateOneTimeExpenses: useBudgetStore(state => state.updateOneTimeExpenses),
});

// Debt selectors
export const useDebts = () =>
  useBudgetStore(state => state.budgetData?.debts || []);
export const useInstallmentLoans = () =>
  useBudgetStore(state => state.budgetData?.installmentLoans || []);
export const useDebtActions = () => ({
  updateDebts: useBudgetStore(state => state.updateDebts),
  updateInstallmentLoans: useBudgetStore(state => state.updateInstallmentLoans),
});

// Savings selectors
export const useSavingsBuckets = () =>
  useBudgetStore(state => state.budgetData?.savingsBuckets || []);
export const useSavingsActions = () => ({
  updateSavingsBuckets: useBudgetStore(state => state.updateSavingsBuckets),
});

// Account selectors
export const useCheckingAccounts = () =>
  useBudgetStore(state => state.budgetData?.checkingAccounts || []);
export const useAccountActions = () => ({
  updateCheckingAccounts: useBudgetStore(state => state.updateCheckingAccounts),
});

// Monthly check-ins selectors
export const useMonthlyCheckIns = () =>
  useBudgetStore(state => state.budgetData?.monthlyCheckIns || []);
export const useMonthlyCheckInActions = () => ({
  updateMonthlyCheckIns: useBudgetStore(state => state.updateMonthlyCheckIns),
});

// AI and survey selectors
export const useAIEstimations = () =>
  useBudgetStore(state => state.budgetData?.aiEstimations);
export const useSurveyAnswers = () =>
  useBudgetStore(state => state.budgetData?.surveyAnswers);
export const useAIActions = () => ({
  updateAIEstimations: useBudgetStore(state => state.updateAIEstimations),
  updateSurveyAnswers: useBudgetStore(state => state.updateSurveyAnswers),
});
