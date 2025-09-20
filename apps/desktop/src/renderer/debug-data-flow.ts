/**
 * Debug script to test the data flow between Zustand store and SQLite
 * This helps identify where the data persistence issue is occurring
 */

import { useBudgetStore } from './stores/budgetStore';

export async function debugDataFlow() {
  console.log('🔍 [Debug] Starting data flow debugging...');

  const store = useBudgetStore.getState();

  // Step 1: Check initial store state
  console.log('📊 [Debug] Initial store state:', {
    hasBudgetData: !!store.budgetData,
    isLoading: store.isLoading,
    hasUnsavedChanges: store.hasUnsavedChanges,
    lastSaved: store.lastSaved,
  });

  // Step 2: Check Electron API availability
  console.log('🔌 [Debug] Electron API status:', {
    available: !!window.electronAPI,
    getBudgetData: !!window.electronAPI?.getBudgetData,
    saveBudgetData: !!window.electronAPI?.saveBudgetData,
  });

  if (!window.electronAPI) {
    console.error('❌ [Debug] Electron API not available - stopping debug');
    return;
  }

  // Step 3: Try to fetch data from SQLite directly
  console.log('📂 [Debug] Attempting to fetch data from SQLite...');
  try {
    const sqliteData = await window.electronAPI.getBudgetData();
    console.log('✅ [Debug] SQLite data retrieved:', {
      income: sqliteData.income?.length || 0,
      recurringExpenses: sqliteData.recurringExpenses?.length || 0,
      oneTimeExpenses: sqliteData.oneTimeExpenses?.length || 0,
      debts: sqliteData.debts?.length || 0,
      installmentLoans: sqliteData.installmentLoans?.length || 0,
      savingsBuckets: sqliteData.savingsBuckets?.length || 0,
      checkingAccounts: sqliteData.checkingAccounts?.length || 0,
      monthlyCheckIns: sqliteData.monthlyCheckIns?.length || 0,
    });

    // Step 4: Update store with SQLite data
    console.log('🔄 [Debug] Updating Zustand store with SQLite data...');
    store.setBudgetData(sqliteData);

    // Step 5: Verify store was updated
    const updatedStore = useBudgetStore.getState();
    console.log('📊 [Debug] Store after SQLite data load:', {
      hasBudgetData: !!updatedStore.budgetData,
      income: updatedStore.budgetData?.income?.length || 0,
      recurringExpenses:
        updatedStore.budgetData?.recurringExpenses?.length || 0,
    });
  } catch (error) {
    console.error('❌ [Debug] Failed to fetch SQLite data:', error);
    return;
  }

  // Step 6: Test saving some data
  console.log('💾 [Debug] Testing data save...');
  const testIncome = [
    {
      id: 1,
      source: 'Debug Test Salary',
      amount: 5000,
      frequency: 'monthly' as const,
    },
  ];

  try {
    await store.updateIncome(testIncome);
    console.log('✅ [Debug] Income update completed');

    // Step 7: Verify data was saved by fetching again
    console.log('🔄 [Debug] Re-fetching data to verify save...');
    const verifyData = await window.electronAPI.getBudgetData();
    console.log('📊 [Debug] Data after save:', {
      income: verifyData.income?.length || 0,
      firstIncomeSource: verifyData.income?.[0]?.source || 'none',
    });
  } catch (error) {
    console.error('❌ [Debug] Save test failed:', error);
  }

  console.log('🎉 [Debug] Data flow debugging completed');
}

// Auto-run disabled to prevent overwriting user data
// To run debug manually, call debugDataFlow() in the browser console
// if (process.env.NODE_ENV === 'development') {
//   setTimeout(() => {
//     if (window.electronAPI) {
//       debugDataFlow();
//     } else {
//       console.log('⚠️ [Debug] Electron API not ready - skipping debug');
//     }
//   }, 2000);
// }
