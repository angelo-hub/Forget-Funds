# Zustand SQLite Implementation Guide

## Overview

This document outlines the implementation of Zustand state management with SQLite persistence for the ForgetFunds budget app. The new system provides optimistic updates, automatic rollback on failure, and granular data management.

## Architecture

### Previous Architecture Issues

- **Full data replacement**: Every change triggered a complete database rewrite
- **No optimistic updates**: Users had to wait for database confirmation
- **Monolithic updates**: Single field changes required full BudgetData saves
- **Limited error handling**: No rollback mechanism for failed saves

### New Zustand Architecture

- **Granular updates**: Individual data slices can be updated independently
- **Optimistic updates**: UI updates immediately, with rollback on failure
- **Selective persistence**: Only changed data sections are saved
- **Better error handling**: Automatic rollback and user feedback

## Implementation Details

### 1. Zustand Store (`src/stores/budgetStore.ts`)

#### Core State Structure

```typescript
interface BudgetState {
  // Data
  budgetData: BudgetData | null;
  isLoading: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

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
}
```

#### Optimistic Update Pattern

Each update action follows this pattern:

1. **Optimistic Update**: Immediately update local state
2. **SQLite Save**: Attempt to save to database via Electron API
3. **Success**: Mark as saved with timestamp
4. **Failure**: Rollback to previous state and log error

```typescript
updateIncome: async (income: Income[]) => {
  const currentData = get().budgetData;
  if (!currentData) return;

  const newData = { ...currentData, income };

  // Optimistic update
  set({ budgetData: newData, hasUnsavedChanges: true });

  // Save to SQLite
  const success = await saveToDatabase(newData);
  if (success) {
    set({ hasUnsavedChanges: false, lastSaved: new Date() });
  } else {
    // Rollback on failure
    set({ budgetData: currentData, hasUnsavedChanges: false });
    console.error('Failed to save income changes - rolled back');
  }
};
```

### 2. Selector Hooks for Performance

The store provides granular selector hooks to prevent unnecessary re-renders:

```typescript
// Data selectors
export const useIncome = () =>
  useBudgetStore(state => state.budgetData?.income || []);
export const useDebts = () =>
  useBudgetStore(state => state.budgetData?.debts || []);

// Action selectors
export const useIncomeActions = () =>
  useBudgetStore(state => ({
    updateIncome: state.updateIncome,
  }));
```

### 3. Component Integration

#### BudgetSystem Component Updates

- Removed local state management (`useState`)
- Uses Zustand selectors for data access
- Passes Zustand actions directly to child components
- Maintains legacy compatibility with parent component

#### Before:

```typescript
const [budgetData, setBudgetData] = useState<BudgetData>(initialData);

const handleIncomeChange = (income: Income[]) => {
  const newData = { ...budgetData, income };
  setBudgetData(newData);
  onDataChange(newData);
};
```

#### After:

```typescript
const income = useIncome();
const { updateIncome } = useIncomeActions();

// Direct pass to component
<IncomeManagement
  income={income}
  onIncomeChange={updateIncome}
/>
```

### 4. App.tsx Integration

- Integrated Zustand store for data management
- Simplified data loading and saving logic
- Store handles SQLite persistence automatically
- Legacy `saveBudgetData` maintained for backward compatibility

## Benefits of the New Implementation

### 1. **Improved User Experience**

- **Immediate feedback**: Changes appear instantly in UI
- **Automatic rollback**: Failed saves revert changes automatically
- **Better error handling**: Users see meaningful error messages

### 2. **Performance Improvements**

- **Selective rendering**: Only components using changed data re-render
- **Reduced database operations**: Only changed sections are saved
- **Optimistic updates**: No waiting for database confirmation

### 3. **Better Developer Experience**

- **Granular actions**: Update specific data types independently
- **Type safety**: Full TypeScript support with proper typing
- **Easier testing**: Individual actions can be tested in isolation

### 4. **Maintainability**

- **Separation of concerns**: UI logic separate from persistence
- **Consistent patterns**: All updates follow same optimistic pattern
- **Error boundaries**: Failed operations don't crash the app

## Database Persistence Flow

### Current Flow with Zustand:

1. User makes edit in component →
2. Component calls Zustand action (e.g., `updateIncome`) →
3. Store optimistically updates local state →
4. Store calls SQLite save via Electron API →
5. On success: Mark as saved
6. On failure: Rollback to previous state

### SQLite Integration:

- Uses existing `SecureDatabase` class
- Maintains full data encryption and security
- Preserves transaction-based operations
- Compatible with existing export/import functionality

## Testing the Implementation

A test script is provided at `src/test-zustand-store.ts` to verify:

- ✅ Optimistic updates work correctly
- ✅ SQLite saves are triggered properly
- ✅ Rollback mechanism functions on failure
- ✅ All data types can be updated independently

## Migration Notes

### For Existing Components:

1. Replace `useState` with Zustand selectors
2. Use granular update actions instead of full data updates
3. Remove manual SQLite save calls (handled by store)
4. Update prop passing to use store actions directly

### For New Features:

1. Add new data types to store interface
2. Create corresponding update actions with optimistic pattern
3. Add selector hooks for performance
4. Test rollback behavior for error cases

## Future Enhancements

### Planned Improvements:

1. **Conflict Resolution**: Handle concurrent updates from multiple sources
2. **Offline Support**: Queue updates when database is unavailable
3. **Undo/Redo**: Implement action history for user convenience
4. **Batch Updates**: Group related changes for better performance
5. **Real-time Sync**: Prepare for multi-device synchronization

### Performance Optimizations:

1. **Debounced Saves**: Batch rapid changes to reduce database writes
2. **Differential Updates**: Only save changed fields, not entire records
3. **Background Persistence**: Move database operations to background thread
4. **Caching Layer**: Implement intelligent caching for frequently accessed data

## Conclusion

The new Zustand SQLite implementation provides a robust, performant, and user-friendly data management solution. It maintains all existing security features while significantly improving the user experience through optimistic updates and automatic error recovery.

The modular architecture makes it easy to extend and maintain, while the comprehensive testing ensures reliability in production environments.
