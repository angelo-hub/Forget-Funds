import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CheckingAccount, Debt, InstallmentLoan, RecurringExpense } from '@forgetfunds/shared-types';
import { Banknote, Eye, EyeOff, Link, MinusCircle, PlusCircle, Unlink } from 'lucide-react';
import { useState } from 'react';

interface AccountManagementProps {
  checkingAccounts: CheckingAccount[];
  recurringExpenses: RecurringExpense[];
  debts: Debt[];
  installmentLoans: InstallmentLoan[];
  onAccountsChange: (accounts: CheckingAccount[]) => void;
}

const ACCOUNT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

const CATEGORY_ICONS = {
  Primary: '🏦',
  Bills: '📄',
  Rent: '🏠',
  Loans: '💳',
  Savings: '💰',
  Emergency: '🚨',
  Other: '📁',
};

export function AccountManagement({
  checkingAccounts = [],
  recurringExpenses,
  debts,
  installmentLoans,
  onAccountsChange,
}: AccountManagementProps) {
  const [showBalances, setShowBalances] = useState(true);

  const addAccount = () => {
    const newId = Math.max(...checkingAccounts.map(a => a.id), 0) + 1;
    const usedColors = checkingAccounts.map(a => a.color);
    const availableColor = ACCOUNT_COLORS.find(color => !usedColors.includes(color)) || ACCOUNT_COLORS[0];

    const newAccount: CheckingAccount = {
      id: newId,
      name: '',
      category: 'Primary',
      balance: 0,
      linkedExpenses: [],
      linkedDebts: [],
      linkedLoans: [],
      color: availableColor,
      isActive: true,
      notes: '',
    };

    onAccountsChange([...checkingAccounts, newAccount]);
  };

  const updateAccount = (id: number, field: keyof CheckingAccount, value: any) => {
    const updatedAccounts = checkingAccounts.map(account =>
      account.id === id ? { ...account, [field]: value } : account
    );
    onAccountsChange(updatedAccounts);
  };

  const removeAccount = (id: number) => {
    onAccountsChange(checkingAccounts.filter(account => account.id !== id));
  };

  const toggleExpenseLink = (accountId: number, expenseId: number) => {
    const account = checkingAccounts.find(a => a.id === accountId);
    if (!account) return;

    const isLinked = account.linkedExpenses.includes(expenseId);
    const newLinkedExpenses = isLinked
      ? account.linkedExpenses.filter(id => id !== expenseId)
      : [...account.linkedExpenses, expenseId];

    updateAccount(accountId, 'linkedExpenses', newLinkedExpenses);
  };

  const toggleDebtLink = (accountId: number, debtId: number) => {
    const account = checkingAccounts.find(a => a.id === accountId);
    if (!account) return;

    const isLinked = account.linkedDebts.includes(debtId);
    const newLinkedDebts = isLinked
      ? account.linkedDebts.filter(id => id !== debtId)
      : [...account.linkedDebts, debtId];

    updateAccount(accountId, 'linkedDebts', newLinkedDebts);
  };

  const toggleLoanLink = (accountId: number, loanId: number) => {
    const account = checkingAccounts.find(a => a.id === accountId);
    if (!account) return;

    const isLinked = account.linkedLoans.includes(loanId);
    const newLinkedLoans = isLinked
      ? account.linkedLoans.filter(id => id !== loanId)
      : [...account.linkedLoans, loanId];

    updateAccount(accountId, 'linkedLoans', newLinkedLoans);
  };

  const getLinkedExpenseTotal = (account: CheckingAccount) => {
    if (!account.linkedExpenses) return 0;
    return account.linkedExpenses.reduce((total, expenseId) => {
      const expense = recurringExpenses.find(e => e.id === expenseId);
      return total + (expense?.amount || 0);
    }, 0);
  };

  const getLinkedDebtTotal = (account: CheckingAccount) => {
    if (!account.linkedDebts) return 0;
    return account.linkedDebts.reduce((total, debtId) => {
      const debt = debts.find(d => d.id === debtId);
      const minPayment = debt ? debt.balance * 0.02 : 0; // Assume 2% minimum payment
      return total + minPayment;
    }, 0);
  };

  const getLinkedLoanTotal = (account: CheckingAccount) => {
    if (!account.linkedLoans) return 0;
    return account.linkedLoans.reduce((total, loanId) => {
      const loan = installmentLoans.find(l => l.id === loanId);
      return total + (loan?.monthlyPayment || 0);
    }, 0);
  };

  const getTotalMonthlyOutflow = (account: CheckingAccount) => {
    return getLinkedExpenseTotal(account) + getLinkedDebtTotal(account) + getLinkedLoanTotal(account);
  };

  const totalBalance = checkingAccounts.reduce((sum, account) => sum + (account.isActive ? account.balance : 0), 0);
  const activeAccounts = checkingAccounts.filter(a => a.isActive);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Banknote className="h-5 w-5 text-green-600 mr-2" />
              Account Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
              >
                {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showBalances ? 'Hide' : 'Show'} Balances
              </Button>
              <Button onClick={addAccount}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Organize your checking accounts and link them to specific expenses for better tracking
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {showBalances ? `$${totalBalance.toFixed(2)}` : '••••••'}
                </div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {activeAccounts.length}
                </div>
                <p className="text-xs text-muted-foreground">Active Accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">
                  {checkingAccounts.reduce((sum, acc) => sum + acc.linkedExpenses.length + acc.linkedDebts.length + acc.linkedLoans.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total Links</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {checkingAccounts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No checking accounts yet. Add your first account to start organizing your finances.
            </p>
          </CardContent>
        </Card>
      )}

      {checkingAccounts.map(account => {
        const totalOutflow = getTotalMonthlyOutflow(account);

        return (
          <Card key={account.id} className={`border-l-4`} style={{ borderLeftColor: account.color }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">
                      {account.name || 'Unnamed Account'} {CATEGORY_ICONS[account.category]}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {account.category} Account
                      {!account.isActive && ' (Inactive)'}
                    </p>
                  </div>
                </div>
                <ConfirmationDialog
                  title="Remove Account"
                  description={`Are you sure you want to remove "${account.name}"? This will unlink all connected expenses, debts, and loans.`}
                  onConfirm={() => removeAccount(account.id)}
                  triggerText=""
                  confirmText="Remove Account"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </ConfirmationDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${account.id}`}>Account Name</Label>
                    <Input
                      id={`name-${account.id}`}
                      placeholder="e.g., Main Checking, Rent Account"
                      value={account.name}
                      onChange={(e) => updateAccount(account.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`category-${account.id}`}>Category</Label>
                    <Select
                      value={account.category}
                      onValueChange={(value) => updateAccount(account.id, 'category', value)}
                    >
                      <SelectTrigger id={`category-${account.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Primary">🏦 Primary</SelectItem>
                        <SelectItem value="Bills">📄 Bills</SelectItem>
                        <SelectItem value="Rent">🏠 Rent</SelectItem>
                        <SelectItem value="Loans">💳 Loans</SelectItem>
                        <SelectItem value="Savings">💰 Savings</SelectItem>
                        <SelectItem value="Emergency">🚨 Emergency</SelectItem>
                        <SelectItem value="Other">📁 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`balance-${account.id}`}>Current Balance</Label>
                    <Input
                      id={`balance-${account.id}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={account.balance || ''}
                      onChange={(e) => updateAccount(account.id, 'balance', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`color-${account.id}`}>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {ACCOUNT_COLORS.map(color => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${account.color === color ? 'border-gray-400' : 'border-gray-200'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateAccount(account.id, 'color', color)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`active-${account.id}`}
                      checked={account.isActive}
                      onChange={(e) => updateAccount(account.id, 'isActive', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`active-${account.id}`}>Account is active</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${account.id}`}>Notes</Label>
                    <textarea
                      id={`notes-${account.id}`}
                      className="w-full p-2 border rounded-md resize-none"
                      rows={2}
                      placeholder="Optional notes about this account..."
                      value={account.notes}
                      onChange={(e) => updateAccount(account.id, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Linked Items */}
              <div className="space-y-4">
                <h4 className="font-medium">Linked Items</h4>
                
                {/* Expenses */}
                {recurringExpenses.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Recurring Expenses</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {recurringExpenses.map(expense => {
                        const isLinked = account.linkedExpenses.includes(expense.id);
                        return (
                          <Button
                            key={expense.id}
                            variant={isLinked ? "default" : "outline"}
                            size="sm"
                            className="justify-between"
                            onClick={() => toggleExpenseLink(account.id, expense.id)}
                          >
                            <span>{expense.category}</span>
                            <div className="flex items-center space-x-2">
                              <span>${expense.amount}</span>
                              {isLinked ? <Unlink className="h-3 w-3" /> : <Link className="h-3 w-3" />}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Debts */}
                {debts.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Debts</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {debts.map(debt => {
                        const isLinked = account.linkedDebts.includes(debt.id);
                        const minPayment = debt.balance * 0.02;
                        return (
                          <Button
                            key={debt.id}
                            variant={isLinked ? "default" : "outline"}
                            size="sm"
                            className="justify-between"
                            onClick={() => toggleDebtLink(account.id, debt.id)}
                          >
                            <span>{debt.name}</span>
                            <div className="flex items-center space-x-2">
                              <span>~${minPayment.toFixed(0)}</span>
                              {isLinked ? <Unlink className="h-3 w-3" /> : <Link className="h-3 w-3" />}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Loans */}
                {installmentLoans.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Loans</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {installmentLoans.map(loan => {
                        const isLinked = account.linkedLoans.includes(loan.id);
                        return (
                          <Button
                            key={loan.id}
                            variant={isLinked ? "default" : "outline"}
                            size="sm"
                            className="justify-between"
                            onClick={() => toggleLoanLink(account.id, loan.id)}
                          >
                            <span>{loan.name}</span>
                            <div className="flex items-center space-x-2">
                              <span>${loan.monthlyPayment}</span>
                              {isLinked ? <Unlink className="h-3 w-3" /> : <Link className="h-3 w-3" />}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Current Balance</p>
                    <p className="text-green-600">
                      {showBalances ? `$${account.balance.toFixed(2)}` : '••••••'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Monthly Outflow</p>
                    <p className="text-red-600">${totalOutflow.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Projected Balance</p>
                    <p className={`${(account.balance - totalOutflow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {showBalances ? `$${(account.balance - totalOutflow).toFixed(2)}` : '••••••'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Linked Items</p>
                    <p>{account.linkedExpenses.length + account.linkedDebts.length + account.linkedLoans.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
