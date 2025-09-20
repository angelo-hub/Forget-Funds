/**
 * Test script to verify Zustand store SQLite integration
 * Run this in the browser console to test the store functionality
 */

import { useBudgetStore } from './stores/budgetStore';

// Test function to verify store functionality
export async function testZustandSQLiteIntegration() {
  console.log('🧪 Testing Zustand SQLite Integration...');

  const store = useBudgetStore.getState();

  // Test 1: Load initial data
  console.log('📊 Current budget data:', store.budgetData);

  // Test 2: Test income updates
  console.log('💰 Testing income updates...');
  const testIncome = [
    {
      id: 1,
      source: 'Test Salary',
      amount: 5000,
      frequency: 'monthly' as const,
    },
    {
      id: 2,
      source: 'Test Freelance',
      amount: 1000,
      frequency: 'monthly' as const,
    },
  ];

  try {
    await store.updateIncome(testIncome);
    console.log('✅ Income update successful');
    console.log(
      '📈 Updated income:',
      useBudgetStore.getState().budgetData?.income
    );
  } catch (error) {
    console.error('❌ Income update failed:', error);
  }

  // Test 3: Test expense updates
  console.log('💸 Testing expense updates...');
  const testExpenses = [
    { id: 1, category: 'Test Rent', amount: 1500 },
    { id: 2, category: 'Test Groceries', amount: 400 },
  ];

  try {
    await store.updateRecurringExpenses(testExpenses);
    console.log('✅ Recurring expenses update successful');
    console.log(
      '🛒 Updated expenses:',
      useBudgetStore.getState().budgetData?.recurringExpenses
    );
  } catch (error) {
    console.error('❌ Recurring expenses update failed:', error);
  }

  // Test 4: Test debt updates
  console.log('💳 Testing debt updates...');
  const testDebts = [
    {
      id: 1,
      name: 'Test Credit Card',
      balance: 2500,
      apr: 18.99,
      minPayment: 75,
      type: 'revolving' as const,
    },
  ];

  try {
    await store.updateDebts(testDebts);
    console.log('✅ Debts update successful');
    console.log(
      '💳 Updated debts:',
      useBudgetStore.getState().budgetData?.debts
    );
  } catch (error) {
    console.error('❌ Debts update failed:', error);
  }

  // Test 5: Test optimistic updates and rollback
  console.log('🔄 Testing optimistic updates with rollback...');
  const originalData = useBudgetStore.getState().budgetData;

  // Simulate a failed save by temporarily breaking the electron API
  const originalElectronAPI = window.electronAPI;
  window.electronAPI = {
    ...originalElectronAPI,
    saveBudgetData: async () => ({
      success: false,
      error: 'Simulated failure',
    }),
  };

  const testIncomeFailure = [
    {
      id: 99,
      source: 'Should Fail',
      amount: 9999,
      frequency: 'monthly' as const,
    },
  ];

  try {
    await store.updateIncome(testIncomeFailure);
    console.log('❌ Expected failure but got success');
  } catch (error) {
    console.log('✅ Rollback test successful - data should be reverted');
    console.log(
      '🔄 Data after rollback:',
      useBudgetStore.getState().budgetData?.income
    );
  }

  // Restore original electron API
  window.electronAPI = originalElectronAPI;

  console.log('🎉 Zustand SQLite Integration test completed!');

  return {
    hasUnsavedChanges: store.hasUnsavedChanges,
    lastSaved: store.lastSaved,
    budgetData: store.budgetData,
  };
}

// Auto-run test if in development mode
if (process.env.NODE_ENV === 'development') {
  // Wait for electron API to be available
  setTimeout(() => {
    if (window.electronAPI) {
      testZustandSQLiteIntegration();
    } else {
      console.log(
        '⚠️ Electron API not available - skipping SQLite integration test'
      );
    }
  }, 1000);
}
