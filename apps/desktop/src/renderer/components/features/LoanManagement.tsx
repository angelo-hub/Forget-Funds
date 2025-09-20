import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import type { InstallmentLoan } from '@forgetfunds/shared-types';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface LoanManagementProps {
  installmentLoans: InstallmentLoan[];
  onLoansChange: (loans: InstallmentLoan[]) => void;
}

export function LoanManagement({ installmentLoans, onLoansChange }: LoanManagementProps) {
  const addLoan = () => {
    const newId = Math.max(...installmentLoans.map(l => l.id), 0) + 1;
    const newLoan: InstallmentLoan = {
      id: newId,
      name: '',
      balance: 0,
      monthlyPayment: 0,
      remainingMonths: 0,
      type: 'installment',
    };
    onLoansChange([...installmentLoans, newLoan]);
  };

  const updateLoan = (id: number, field: keyof InstallmentLoan, value: string | number) => {
    const updated = installmentLoans.map(loan =>
      loan.id === id ? { ...loan, [field]: value } : loan
    );
    onLoansChange(updated);
  };

  const removeLoan = (id: number) => {
    const filtered = installmentLoans.filter(loan => loan.id !== id);
    onLoansChange(filtered);
  };

  // Calculate totals
  const totalLoanBalance = installmentLoans.reduce((sum, loan) => sum + loan.balance, 0);
  const totalMonthlyPayments = installmentLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const totalRemainingPayments = installmentLoans.reduce(
    (sum, loan) => sum + (loan.monthlyPayment * loan.remainingMonths), 
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Installment Loans (Car Loans, Leases, Personal Loans)</CardTitle>
          <Button onClick={addLoan} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Loan
          </Button>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            Total Loan Balance: <span className="font-semibold text-orange-600">${totalLoanBalance.toFixed(2)}</span>
          </div>
          <div>
            Total Monthly Payments: <span className="font-semibold text-blue-600">${totalMonthlyPayments.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {installmentLoans.map((loan) => {
          const payoffDate = loan.remainingMonths > 0 
            ? new Date(Date.now() + loan.remainingMonths * 30 * 24 * 60 * 60 * 1000)
            : null;
          
          return (
            <div key={loan.id} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 items-center">
                <Input
                  placeholder="Loan name (e.g., Car Lease, Personal Loan)"
                  value={loan.name}
                  onChange={(e) => updateLoan(loan.id, 'name', e.target.value)}
                />
                <div className="flex justify-end">
                  <ConfirmationDialog
                    title="Remove Loan"
                    description={`Are you sure you want to remove "${loan.name}"? This action cannot be undone.`}
                    onConfirm={() => removeLoan(loan.id)}
                    triggerText="Remove"
                    confirmText="Remove Loan"
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
                    Remaining Balance ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={loan.balance || ''}
                    onChange={(e) =>
                      updateLoan(loan.id, 'balance', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Monthly Payment ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={loan.monthlyPayment || ''}
                    onChange={(e) =>
                      updateLoan(loan.id, 'monthlyPayment', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Remaining Months
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={loan.remainingMonths || ''}
                    onChange={(e) =>
                      updateLoan(loan.id, 'remainingMonths', parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              {loan.monthlyPayment > 0 && loan.remainingMonths > 0 && (
                <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Total Remaining Payments:</span>
                      <div className="font-semibold text-blue-600">
                        ${(loan.monthlyPayment * loan.remainingMonths).toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Payoff Date:</span>
                      <div className="font-semibold">
                        {payoffDate ? payoffDate.toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {loan.remainingMonths > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {Math.floor(loan.remainingMonths / 12)} years and {loan.remainingMonths % 12} months remaining
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {installmentLoans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No installment loans added yet.</p>
            <p className="text-sm">Click "Add Loan" to start tracking car loans, leases, or personal loans.</p>
          </div>
        )}

        {installmentLoans.length > 0 && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Loan Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Balance:</span>
                    <span className="font-semibold">${totalLoanBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Payments:</span>
                    <span className="font-semibold">${totalMonthlyPayments.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining to Pay:</span>
                    <span className="font-semibold">${totalRemainingPayments.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Loan Management Tips
                </h4>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <p>• Fixed payments make budgeting predictable</p>
                  <p>• Consider extra principal payments to save interest</p>
                  <p>• Review loan terms for early payoff penalties</p>
                  <p>• Track remaining months for future planning</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
