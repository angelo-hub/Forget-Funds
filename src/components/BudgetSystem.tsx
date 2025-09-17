import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AccountManagement } from '@/components/features/AccountManagement';
import { AIAssistant } from '@/components/features/AIAssistant';
import { DebtManagement } from '@/components/features/DebtManagement';
import { ExpenseManagement } from '@/components/features/ExpenseManagement';
import { IncomeManagement } from '@/components/features/IncomeManagement';
import { LoanManagement } from '@/components/features/LoanManagement';
import { MonthlyCheckIns } from '@/components/features/MonthlyCheckIns';
import { OCRDataParser } from '@/components/features/OCRDataParser';
import { SavingsManagement } from '@/components/features/SavingsManagement';
import { ForgetFundsLogo } from '@/components/ForgetFundsLogo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AIEstimations, BudgetData, CheckingAccount, Debt, Income, InstallmentLoan, MonthlyCheckIn, OneTimeExpense, RecurringExpense, SavingsBucket, SurveyAnswers } from '@/types/budget';
import {
  Banknote,
  Bot,
  Calculator,
  Calendar,
  DollarSign,
  Download,
  PieChart,
  Scan,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface BudgetSystemProps {
  initialData: BudgetData;
  onDataChange: (data: BudgetData) => void;
  onExport: () => void;
  onImport: () => void;
}

export function BudgetSystem({
  initialData,
  onDataChange,
  onExport,
  onImport,
}: BudgetSystemProps) {
  const [budgetData, setBudgetData] = useState<BudgetData>(initialData);

  const updateBudgetData = (newData: BudgetData) => {
    setBudgetData(newData);
    onDataChange(newData);
  };

  const handleIncomeChange = (income: Income[]) => {
    const newData = { ...budgetData, income };
    updateBudgetData(newData);
  };

  const handleRecurringExpensesChange = (recurringExpenses: RecurringExpense[]) => {
    const newData = { ...budgetData, recurringExpenses };
    updateBudgetData(newData);
  };

  const handleOneTimeExpensesChange = (oneTimeExpenses: OneTimeExpense[]) => {
    const newData = { ...budgetData, oneTimeExpenses };
    updateBudgetData(newData);
  };

  const handleDebtsChange = (debts: Debt[]) => {
    const newData = { ...budgetData, debts };
    updateBudgetData(newData);
  };

  const handleLoansChange = (installmentLoans: InstallmentLoan[]) => {
    const newData = { ...budgetData, installmentLoans };
    updateBudgetData(newData);
  };

  const handleSavingsChange = (savingsBuckets: SavingsBucket[]) => {
    const newData = { ...budgetData, savingsBuckets };
    updateBudgetData(newData);
  };

  const handleAIEstimationsChange = (aiEstimations: AIEstimations) => {
    const newData = { ...budgetData, aiEstimations };
    updateBudgetData(newData);
  };

  const handleSurveyAnswersChange = (surveyAnswers: SurveyAnswers) => {
    const newData = { ...budgetData, surveyAnswers };
    updateBudgetData(newData);
  };

  const handleApplyEstimates = (groceryEstimate: number, entertainmentEstimate: number) => {
    const updatedExpenses = [...budgetData.recurringExpenses];
    
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
    
    const newData = { ...budgetData, recurringExpenses: updatedExpenses };
    updateBudgetData(newData);
  };

  const handleCheckInsChange = (monthlyCheckIns: MonthlyCheckIn[]) => {
    const newData = { ...budgetData, monthlyCheckIns };
    updateBudgetData(newData);
  };

  const handleAccountsChange = (checkingAccounts: CheckingAccount[]) => {
    const newData = { ...budgetData, checkingAccounts };
    updateBudgetData(newData);
  };

  const handleOCRExpensesParsed = (expenses: (RecurringExpense | OneTimeExpense)[]) => {
    // Separate recurring and one-time expenses
    const recurringExpenses = expenses.filter(e => 'category' in e) as RecurringExpense[];
    const oneTimeExpenses = expenses.filter(e => 'description' in e) as OneTimeExpense[];

    // Add to existing expenses with new IDs
    const updatedRecurringExpenses = [
      ...budgetData.recurringExpenses,
      ...recurringExpenses.map(e => ({
        ...e,
        id: Math.max(...budgetData.recurringExpenses.map(exp => exp.id), 0) + Math.floor(Math.random() * 1000) + 1
      }))
    ];

    const updatedOneTimeExpenses = [
      ...budgetData.oneTimeExpenses,
      ...oneTimeExpenses.map(e => ({
        ...e,
        id: Math.max(...budgetData.oneTimeExpenses.map(exp => exp.id), 0) + Math.floor(Math.random() * 1000) + 1
      }))
    ];

    const newData = { 
      ...budgetData, 
      recurringExpenses: updatedRecurringExpenses,
      oneTimeExpenses: updatedOneTimeExpenses
    };
    updateBudgetData(newData);

    // Show success message
    const totalAdded = recurringExpenses.length + oneTimeExpenses.length;
    alert(`Successfully added ${totalAdded} expense${totalAdded !== 1 ? 's' : ''} from OCR data!`);
  };

  const handleOCRAccountsParsed = (accounts: any[]) => {
    // For now, just show an alert with the parsed accounts
    // Later we can implement matching with existing accounts
    alert(`Parsed ${accounts.length} account balance(s). Account matching feature coming soon!`);
  };

  // Calculate totals
  const totalMonthlyIncome = budgetData.income.reduce((sum, inc) => {
    const multiplier =
      inc.frequency === 'weekly'
        ? 4.33
        : inc.frequency === 'biweekly'
          ? 2.17
          : 1;
    return sum + inc.amount * multiplier;
  }, 0);

  const totalDebtPayments = budgetData.debts.reduce(
    (sum, debt) => sum + debt.minPayment,
    0
  );
  const totalInstallmentPayments = budgetData.installmentLoans.reduce(
    (sum, loan) => sum + loan.monthlyPayment,
    0
  );
  const totalRecurringExpenses = budgetData.recurringExpenses.reduce(
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

  const totalDebtBalance = budgetData.debts.reduce(
    (sum, debt) => sum + debt.balance,
    0
  );
  const totalInstallmentBalance = budgetData.installmentLoans.reduce(
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
  }, [onExport, onImport]);

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
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
              <TabsTrigger value="overview" className="flex-col h-auto py-2">
                <PieChart className="h-4 w-4 mb-1" />
                <span className="text-xs">Dashboard</span>
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
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

          <TabsContent value="income">
            <IncomeManagement 
              income={budgetData.income}
              onIncomeChange={handleIncomeChange}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseManagement
              recurringExpenses={budgetData.recurringExpenses}
              oneTimeExpenses={budgetData.oneTimeExpenses}
              onRecurringExpensesChange={handleRecurringExpensesChange}
              onOneTimeExpensesChange={handleOneTimeExpensesChange}
            />
          </TabsContent>

          <TabsContent value="debts">
            <DebtManagement
              debts={budgetData.debts}
              onDebtsChange={handleDebtsChange}
            />
          </TabsContent>

          <TabsContent value="loans">
            <LoanManagement
              installmentLoans={budgetData.installmentLoans}
              onLoansChange={handleLoansChange}
            />
          </TabsContent>

          <TabsContent value="savings">
            <SavingsManagement
              savingsBuckets={budgetData.savingsBuckets}
              onSavingsChange={handleSavingsChange}
              availableForSavings={availableForSavings}
            />
          </TabsContent>

          <TabsContent value="checkins">
            <ErrorBoundary>
              <MonthlyCheckIns
                monthlyCheckIns={budgetData.monthlyCheckIns}
                onCheckInsChange={handleCheckInsChange}
                currentMonthProjections={currentMonthProjections}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="accounts">
            <ErrorBoundary>
              <AccountManagement
                checkingAccounts={budgetData.checkingAccounts}
                recurringExpenses={budgetData.recurringExpenses}
                debts={budgetData.debts}
                installmentLoans={budgetData.installmentLoans}
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
                aiEstimations={budgetData.aiEstimations}
                surveyAnswers={budgetData.surveyAnswers}
                onAIEstimationsChange={handleAIEstimationsChange}
                onSurveyAnswersChange={handleSurveyAnswersChange}
                onApplyEstimates={handleApplyEstimates}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
