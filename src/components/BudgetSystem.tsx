import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AccountManagement } from '@/components/features/AccountManagement';
import { AIAssistant } from '@/components/features/AIAssistant';
import { DebtManagement } from '@/components/features/DebtManagement';
import { ExpenseManagement } from '@/components/features/ExpenseManagement';
import { FinancialCharts } from '@/components/features/FinancialCharts';
import { IncomeManagement } from '@/components/features/IncomeManagement';
import { LoanManagement } from '@/components/features/LoanManagement';
import { MonthlyCheckIns } from '@/components/features/MonthlyCheckIns';
import { OCRDataParser } from '@/components/features/OCRDataParser';
import { SavingsManagement } from '@/components/features/SavingsManagement';
import { ForgetFundsLogo } from '@/components/ForgetFundsLogo';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAccountActions,
  useAIActions,
  useBudgetData,
  useDebtActions,
  useExpenseActions,
  useIncomeActions,
  useMonthlyCheckInActions,
  useSavingsActions,
} from '@/stores/budgetStore';
import type { BudgetData, CheckingAccount, MonthlyCheckIn, OneTimeExpense, RecurringExpense } from '@/types/budget';
import {
  Banknote,
  Bot,
  Calculator,
  Calendar,
  DollarSign,
  Download,
  LineChart,
  PieChart,
  Scan,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useEffect } from 'react';

interface BudgetSystemProps {
  onDataChange?: (data: BudgetData) => void; // Optional - Zustand handles data changes
  onExport: () => void;
  onImport: () => void;
}

export function BudgetSystem({
  onExport,
  onImport,
}: BudgetSystemProps) {
  // Use single Zustand store selector to avoid multiple subscriptions
  const budgetData = useBudgetData();
  
  // Get actions only (these don't cause re-renders)
  const updateIncome = useIncomeActions();
  const { updateRecurringExpenses, updateOneTimeExpenses } = useExpenseActions();
  const { updateDebts, updateInstallmentLoans } = useDebtActions();
  const { updateSavingsBuckets } = useSavingsActions();
  const { updateCheckingAccounts } = useAccountActions();
  const { updateMonthlyCheckIns } = useMonthlyCheckInActions();
  const { updateAIEstimations, updateSurveyAnswers } = useAIActions();
  
  // Extract data from single budgetData object to avoid multiple selectors
  if (!budgetData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading budget data...</p>
        </div>
      </div>
    );
  }
  
  const {
    income = [],
    recurringExpenses = [],
    oneTimeExpenses = [],
    debts = [],
    installmentLoans = [],
    savingsBuckets = [],
    checkingAccounts = [],
    monthlyCheckIns = [],
    aiEstimations,
    surveyAnswers
  } = budgetData;
  
  // Uncomment if you need to show save status
  // const hasUnsavedChanges = useHasUnsavedChanges();
  // const lastSaved = useLastSaved();

  // Legacy compatibility removed - Zustand store handles all data changes
  // The onDataChange prop is no longer needed since Zustand manages state directly

  const handleApplyEstimates = (groceryEstimate: number, entertainmentEstimate: number) => {
    const updatedExpenses = [...recurringExpenses];
    
    // Apply grocery estimate
    if (groceryEstimate > 0) {
      const groceryExpense = updatedExpenses.find(e => e.category.toLowerCase().includes('grocer'));
      if (groceryExpense) {
        groceryExpense.amount = groceryEstimate;
      } else {
        const newId = Math.max(...updatedExpenses.map(e => e.id), 0) + 1;
        updatedExpenses.push({
          id: newId,
          category: 'Groceries (AI Estimated)',
          amount: groceryEstimate,
        });
      }
    }
    
    // Apply entertainment estimate
    if (entertainmentEstimate > 0) {
      const entertainmentExpense = updatedExpenses.find(e => e.category.toLowerCase().includes('entertainment'));
      if (entertainmentExpense) {
        entertainmentExpense.amount = entertainmentEstimate;
      } else {
        const newId = Math.max(...updatedExpenses.map(e => e.id), 0) + 1;
        updatedExpenses.push({
          id: newId,
          category: 'Entertainment (AI Estimated)',
          amount: entertainmentEstimate,
        });
      }
    }
    
    updateRecurringExpenses(updatedExpenses);
  };

  const handleCheckInsChange = (monthlyCheckIns: MonthlyCheckIn[]) => {
    updateMonthlyCheckIns(monthlyCheckIns);
  };

  const handleAccountsChange = (checkingAccounts: CheckingAccount[]) => {
    updateCheckingAccounts(checkingAccounts);
  };

  const handleOCRExpensesParsed = (expenses: (RecurringExpense | OneTimeExpense)[]) => {
    // Separate recurring and one-time expenses
    const newRecurringExpenses = expenses.filter(e => 'category' in e) as RecurringExpense[];
    const newOneTimeExpenses = expenses.filter(e => 'description' in e) as OneTimeExpense[];

    // Add to existing expenses with new IDs
    const updatedRecurringExpenses = [
      ...recurringExpenses,
      ...newRecurringExpenses.map(e => ({
        ...e,
        id: Math.max(...recurringExpenses.map(exp => exp.id), 0) + Math.floor(Math.random() * 1000) + 1
      }))
    ];

    const updatedOneTimeExpenses = [
      ...oneTimeExpenses,
      ...newOneTimeExpenses.map(e => ({
        ...e,
        id: Math.max(...oneTimeExpenses.map(exp => exp.id), 0) + Math.floor(Math.random() * 1000) + 1
      }))
    ];

    // Update both expense types
    updateRecurringExpenses(updatedRecurringExpenses);
    updateOneTimeExpenses(updatedOneTimeExpenses);

    // Show success message
    const totalAdded = newRecurringExpenses.length + newOneTimeExpenses.length;
    alert(`Successfully added ${totalAdded} expense${totalAdded !== 1 ? 's' : ''} from OCR data!`);
  };

  const handleOCRAccountsParsed = (accounts: any[]) => {
    // For now, just show an alert with the parsed accounts
    // Later we can implement matching with existing accounts
    alert(`Parsed ${accounts.length} account balance(s). Account matching feature coming soon!`);
  };

  // Calculate totals
  const totalMonthlyIncome = income.reduce((sum, inc) => {
    const multiplier =
      inc.frequency === 'weekly'
        ? 4.33
        : inc.frequency === 'biweekly'
          ? 2.17
          : 1;
    return sum + inc.amount * multiplier;
  }, 0);

  const totalDebtPayments = debts.reduce(
    (sum, debt) => sum + debt.minPayment,
    0
  );
  const totalInstallmentPayments = installmentLoans.reduce(
    (sum, loan) => sum + loan.monthlyPayment,
    0
  );
  const totalRecurringExpenses = recurringExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const monthlyExpenses =
    totalDebtPayments + totalInstallmentPayments + totalRecurringExpenses;
  const availableForSavings = totalMonthlyIncome - monthlyExpenses;

  // Calculate current month projections for check-ins
  const currentMonthProjections = {
    income: totalMonthlyIncome,
    expenses: monthlyExpenses,
    savings: Math.max(0, availableForSavings),
  };

  const totalDebtBalance = debts.reduce(
    (sum, debt) => sum + debt.balance,
    0
  );
  const totalInstallmentBalance = installmentLoans.reduce(
    (sum, loan) => sum + loan.balance,
    0
  );

  // Handle menu events from Electron
  useEffect(() => {
    if (window.electronAPI) {
      const handleMenuExport = () => onExport();
      const handleMenuImport = () => onImport();

      window.electronAPI.onMenuExport(handleMenuExport);
      window.electronAPI.onMenuImport(handleMenuImport);

      return () => {
        window.electronAPI.removeAllListeners('menu-export');
        window.electronAPI.removeAllListeners('menu-import');
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <ForgetFundsLogo size={40} />
            </div>
            <div className="flex gap-3">
              <Button onClick={onExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button onClick={onImport} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalMonthlyIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${monthlyExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available for Savings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${availableForSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                ${availableForSavings.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${(totalDebtBalance + totalInstallmentBalance).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          {/* Primary Navigation - Core Financial Features */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground mb-1">Core Features</div>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto">
              <TabsTrigger value="overview" className="flex-col h-auto py-2">
                <PieChart className="h-4 w-4 mb-1" />
                <span className="text-xs">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex-col h-auto py-2">
                <LineChart className="h-4 w-4 mb-1" />
                <span className="text-xs">Charts</span>
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-col h-auto py-2">
                <TrendingUp className="h-4 w-4 mb-1" />
                <span className="text-xs">Income</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex-col h-auto py-2">
                <TrendingDown className="h-4 w-4 mb-1" />
                <span className="text-xs">Expenses</span>
              </TabsTrigger>
              <TabsTrigger value="debts" className="flex-col h-auto py-2">
                <Calculator className="h-4 w-4 mb-1" />
                <span className="text-xs">Debts</span>
              </TabsTrigger>
              <TabsTrigger value="loans" className="flex-col h-auto py-2">
                <DollarSign className="h-4 w-4 mb-1" />
                <span className="text-xs">Loans</span>
              </TabsTrigger>
              <TabsTrigger value="savings" className="flex-col h-auto py-2">
                <Target className="h-4 w-4 mb-1" />
                <span className="text-xs">Savings</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Secondary Navigation - Advanced Features */}
            <div className="text-sm font-medium text-muted-foreground mb-1">Advanced Features</div>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="checkins" className="flex-col h-auto py-2">
                <Calendar className="h-4 w-4 mb-1" />
                <span className="text-xs">Check-ins</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex-col h-auto py-2">
                <Banknote className="h-4 w-4 mb-1" />
                <span className="text-xs">Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="ocr" className="flex-col h-auto py-2">
                <Scan className="h-4 w-4 mb-1" />
                <span className="text-xs">OCR Parser</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-col h-auto py-2">
                <Bot className="h-4 w-4 mb-1" />
                <span className="text-xs">AI Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-col h-auto py-2">
                <Settings className="h-4 w-4 mb-1" />
                <span className="text-xs">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                  Your complete financial picture at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                      <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                        Monthly Surplus
                      </h3>
                      <p
                        className={`text-2xl font-bold ${availableForSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        ${availableForSavings.toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {availableForSavings >= 0
                          ? 'Available for savings and investments'
                          : 'Budget deficit - reduce expenses'}
                      </p>
                    </div>

                    <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                      <h3 className="mb-2 font-medium text-green-900 dark:text-green-100">
                        Emergency Fund Goal
                      </h3>
                      <p className="text-2xl font-bold text-green-600">
                        ${(monthlyExpenses * 3).toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        3 months of expenses
                      </p>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950">
                      <h3 className="mb-2 font-medium text-purple-900 dark:text-purple-100">
                        Debt-to-Income Ratio
                      </h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {totalMonthlyIncome > 0
                          ? (
                              ((totalDebtPayments + totalInstallmentPayments) /
                                totalMonthlyIncome) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {totalMonthlyIncome > 0 &&
                        (totalDebtPayments + totalInstallmentPayments) /
                          totalMonthlyIncome <
                          0.36
                          ? 'Healthy ratio'
                          : 'Consider debt reduction'}
                      </p>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="outline" onClick={onImport}>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Data
                    </Button>
                    <Button variant="outline" onClick={onExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts">
            <ErrorBoundary>
              <FinancialCharts
                debts={debts}
                installmentLoans={installmentLoans}
                savingsBuckets={savingsBuckets}
                monthlyCheckIns={monthlyCheckIns}
                totalMonthlyIncome={totalMonthlyIncome}
                monthlyExpenses={monthlyExpenses}
                availableForSavings={availableForSavings}
                budgetStartDate={budgetData.budgetStartDate}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="income">
            <IncomeManagement 
              income={income}
              onIncomeChange={updateIncome}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseManagement 
              recurringExpenses={recurringExpenses}
              oneTimeExpenses={oneTimeExpenses}
              onRecurringExpensesChange={updateRecurringExpenses}
              onOneTimeExpensesChange={updateOneTimeExpenses}
            />
          </TabsContent>

          <TabsContent value="debts">
            <DebtManagement 
              debts={debts}
              onDebtsChange={updateDebts}
            />
          </TabsContent>

          <TabsContent value="loans">
            <LoanManagement 
              installmentLoans={installmentLoans}
              onLoansChange={updateInstallmentLoans}
            />
          </TabsContent>

          <TabsContent value="savings">
            <SavingsManagement 
              savingsBuckets={savingsBuckets}
              onSavingsChange={updateSavingsBuckets}
              availableForSavings={availableForSavings}
              monthlyIncome={totalMonthlyIncome}
              monthlyExpenses={monthlyExpenses}
              recurringExpenses={recurringExpenses}
              debts={debts}
              installmentLoans={installmentLoans}
            />
          </TabsContent>

          <TabsContent value="checkins">
            <ErrorBoundary>
              <MonthlyCheckIns
                monthlyCheckIns={monthlyCheckIns}
                onCheckInsChange={handleCheckInsChange}
                currentMonthProjections={currentMonthProjections}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="accounts">
            <ErrorBoundary>
              <AccountManagement
                checkingAccounts={checkingAccounts}
                recurringExpenses={recurringExpenses}
                debts={debts}
                installmentLoans={installmentLoans}
                onAccountsChange={handleAccountsChange}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="ocr">
            <ErrorBoundary>
              <OCRDataParser
                onExpensesParsed={handleOCRExpensesParsed}
                onAccountsParsed={handleOCRAccountsParsed}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="ai">
            <ErrorBoundary>
              <AIAssistant
                aiEstimations={aiEstimations || { city: 'Austin', groceryEstimate: 0, entertainmentEstimate: 0, isEstimating: false, apiProvider: 'none' }}
                surveyAnswers={surveyAnswers || { diningOutFrequency: 2, movieFrequency: 1, concertFrequency: 2, hasStreamingServices: true, gymMembership: false }}
                onAIEstimationsChange={updateAIEstimations}
                onSurveyAnswersChange={updateSurveyAnswers}
                onApplyEstimates={handleApplyEstimates}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Customize your ForgetFunds experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorBoundary>
                  <SettingsPanel />
                </ErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
