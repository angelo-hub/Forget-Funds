import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import type { Debt, DebtCalculation } from '@/types/budget';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface DebtManagementProps {
  debts: Debt[];
  onDebtsChange: (debts: Debt[]) => void;
}

export function DebtManagement({ debts, onDebtsChange }: DebtManagementProps) {
  const addDebt = () => {
    const newId = Math.max(...debts.map(d => d.id), 0) + 1;
    const newDebt: Debt = {
      id: newId,
      name: '',
      balance: 0,
      apr: 0,
      minPayment: 0,
      type: 'revolving',
    };
    onDebtsChange([...debts, newDebt]);
  };

  const updateDebt = (id: number, field: keyof Debt, value: string | number) => {
    const updated = debts.map(debt =>
      debt.id === id ? { ...debt, [field]: value } : debt
    );
    onDebtsChange(updated);
  };

  const removeDebt = (id: number) => {
    const filtered = debts.filter(debt => debt.id !== id);
    onDebtsChange(filtered);
  };

  // Calculate debt metrics
  const calculateDebtMetrics = (debt: Debt): DebtCalculation => {
    const monthlyInterest = (debt.balance * (debt.apr / 100)) / 12;
    
    let payoffTime = 0;
    let totalInterest = 0;
    
    if (debt.minPayment > 0 && debt.balance > 0) {
      // Calculate payoff time using formula for compound interest
      const monthlyRate = debt.apr / 100 / 12;
      if (monthlyRate > 0) {
        payoffTime = Math.ceil(
          -Math.log(1 - (debt.balance * monthlyRate) / debt.minPayment) /
            Math.log(1 + monthlyRate)
        );
        totalInterest = debt.minPayment * payoffTime - debt.balance;
      } else {
        // No interest case
        payoffTime = Math.ceil(debt.balance / debt.minPayment);
        totalInterest = 0;
      }
    }

    return {
      ...debt,
      monthlyInterest,
      payoffTime,
      totalInterest,
    };
  };

  const debtCalculations = debts.map(calculateDebtMetrics);
  const totalDebtBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMonthlyPayments = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
  const totalMonthlyInterest = debtCalculations.reduce(
    (sum, calc) => sum + calc.monthlyInterest,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revolving Debts (Credit Cards, Lines of Credit)</CardTitle>
          <Button onClick={addDebt} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            Total Debt Balance: <span className="font-semibold text-red-600">${totalDebtBalance.toFixed(2)}</span>
          </div>
          <div>
            Total Monthly Payments: <span className="font-semibold text-orange-600">${totalMonthlyPayments.toFixed(2)}</span>
          </div>
          <div>
            Total Monthly Interest: <span className="font-semibold text-red-500">${totalMonthlyInterest.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {debts.map((debt) => {
          const calculation = debtCalculations.find(c => c.id === debt.id)!;
          return (
            <div key={debt.id} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 items-center">
                <Input
                  placeholder="Debt name (e.g., Chase Credit Card)"
                  value={debt.name}
                  onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                />
                <div className="flex justify-end">
                  <ConfirmationDialog
                    title="Remove Debt"
                    description={`Are you sure you want to remove "${debt.name}"? This action cannot be undone.`}
                    onConfirm={() => removeDebt(debt.id)}
                    triggerText="Remove"
                    confirmText="Remove Debt"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <MinusCircle className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </ConfirmationDialog>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Current Balance ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={debt.balance || ''}
                    onChange={(e) =>
                      updateDebt(debt.id, 'balance', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    APR (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={debt.apr || ''}
                    onChange={(e) =>
                      updateDebt(debt.id, 'apr', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Minimum Payment ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={debt.minPayment || ''}
                    onChange={(e) =>
                      updateDebt(debt.id, 'minPayment', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              {debt.balance > 0 && debt.minPayment > 0 && (
                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-muted-foreground">Monthly Interest:</span>
                      <div className="font-semibold text-red-600">
                        ${calculation.monthlyInterest.toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Payoff Time:</span>
                      <div className="font-semibold">
                        {calculation.payoffTime > 0 
                          ? `${calculation.payoffTime} months (${Math.ceil(calculation.payoffTime / 12)} years)`
                          : 'N/A'
                        }
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Total Interest:</span>
                      <div className="font-semibold text-red-600">
                        ${calculation.totalInterest.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {calculation.payoffTime > 60 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                      ⚠️ This debt will take over 5 years to pay off at minimum payments. 
                      Consider increasing payments to reduce interest costs.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {debts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No debts added yet.</p>
            <p className="text-sm">Click "Add Debt" to start tracking your revolving debts.</p>
          </div>
        )}

        {debts.length > 0 && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                  Debt Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Balance:</span>
                    <span className="font-semibold">${totalDebtBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Payments:</span>
                    <span className="font-semibold">${totalMonthlyPayments.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Interest:</span>
                    <span className="font-semibold">${totalMonthlyInterest.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Debt Strategy Tips
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• Pay more than minimums to reduce interest</p>
                  <p>• Focus on highest APR debts first (avalanche method)</p>
                  <p>• Consider debt consolidation if beneficial</p>
                  <p>• Avoid adding new debt while paying off existing</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
