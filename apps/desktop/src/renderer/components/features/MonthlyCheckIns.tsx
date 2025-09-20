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
import type { BudgetVariance, MonthlyCheckIn } from '@forgetfunds/shared-types';
import { Calendar, MinusCircle, PlusCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface MonthlyCheckInsProps {
  monthlyCheckIns: MonthlyCheckIn[];
  onCheckInsChange: (checkIns: MonthlyCheckIn[]) => void;
  currentMonthProjections: {
    income: number;
    expenses: number;
    savings: number;
  };
}

export function MonthlyCheckIns({
  monthlyCheckIns = [],
  onCheckInsChange,
  currentMonthProjections,
}: MonthlyCheckInsProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const addCheckIn = () => {
    const newId = Math.max(...monthlyCheckIns.map(c => c.id), 0) + 1;
    const newCheckIn: MonthlyCheckIn = {
      id: newId,
      month: selectedMonth,
      actualIncome: 0,
      actualExpenses: 0,
      actualSavings: 0,
      projectedIncome: currentMonthProjections.income,
      projectedExpenses: currentMonthProjections.expenses,
      projectedSavings: currentMonthProjections.savings,
      notes: '',
      createdAt: new Date().toISOString(),
    };

    onCheckInsChange([...monthlyCheckIns, newCheckIn]);
  };

  const updateCheckIn = (id: number, field: keyof MonthlyCheckIn, value: string | number) => {
    const updatedCheckIns = monthlyCheckIns.map(checkIn =>
      checkIn.id === id ? { ...checkIn, [field]: value } : checkIn
    );
    onCheckInsChange(updatedCheckIns);
  };

  const removeCheckIn = (id: number) => {
    onCheckInsChange(monthlyCheckIns.filter(checkIn => checkIn.id !== id));
  };

  const calculateVariance = (checkIn: MonthlyCheckIn): BudgetVariance => {
    const incomeVariance = ((checkIn.actualIncome - checkIn.projectedIncome) / checkIn.projectedIncome) * 100;
    const expenseVariance = ((checkIn.actualExpenses - checkIn.projectedExpenses) / checkIn.projectedExpenses) * 100;
    const savingsVariance = ((checkIn.actualSavings - checkIn.projectedSavings) / checkIn.projectedSavings) * 100;
    const overallVariance = ((checkIn.actualIncome - checkIn.actualExpenses) - (checkIn.projectedIncome - checkIn.projectedExpenses)) / (checkIn.projectedIncome - checkIn.projectedExpenses) * 100;

    return {
      incomeVariance: isNaN(incomeVariance) ? 0 : incomeVariance,
      expenseVariance: isNaN(expenseVariance) ? 0 : expenseVariance,
      savingsVariance: isNaN(savingsVariance) ? 0 : savingsVariance,
      overallVariance: isNaN(overallVariance) ? 0 : overallVariance,
    };
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatVariance = (variance: number) => {
    const isPositive = variance >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {Math.abs(variance).toFixed(1)}%
      </span>
    );
  };

  // Generate month options (current month and previous 12 months)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({
        value: monthStr,
        label: formatMonth(monthStr)
      });
    }
    
    return options;
  };

  const existingCheckIn = monthlyCheckIns.find(c => c.month === selectedMonth);
  const sortedCheckIns = [...monthlyCheckIns].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            Monthly Check-ins
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your actual vs projected budget numbers to improve future planning
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month-select">Select Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-select">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={addCheckIn}
                disabled={!!existingCheckIn}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {existingCheckIn ? 'Check-in Exists' : 'Create Check-in'}
              </Button>
            </div>
          </div>

          {existingCheckIn && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ✓ Check-in for {formatMonth(selectedMonth)} already exists. Edit it below or select a different month.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {sortedCheckIns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No monthly check-ins yet. Create your first check-in to start tracking budget variance.
            </p>
          </CardContent>
        </Card>
      )}

      {sortedCheckIns.map(checkIn => {
        const variance = calculateVariance(checkIn);
        
        return (
          <Card key={checkIn.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {formatMonth(checkIn.month)}
                </CardTitle>
                <ConfirmationDialog
                  title="Remove Check-in"
                  description={`Are you sure you want to remove the check-in for ${formatMonth(checkIn.month)}? This action cannot be undone.`}
                  onConfirm={() => removeCheckIn(checkIn.id)}
                  triggerText=""
                  confirmText="Remove Check-in"
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
              <p className="text-xs text-muted-foreground">
                Created: {new Date(checkIn.createdAt).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Actual Numbers</h4>
                  <div className="space-y-2">
                    <Label htmlFor={`actual-income-${checkIn.id}`}>Income</Label>
                    <Input
                      id={`actual-income-${checkIn.id}`}
                      type="number"
                      placeholder="Actual income"
                      value={checkIn.actualIncome || ''}
                      onChange={(e) => updateCheckIn(checkIn.id, 'actualIncome', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`actual-expenses-${checkIn.id}`}>Expenses</Label>
                    <Input
                      id={`actual-expenses-${checkIn.id}`}
                      type="number"
                      placeholder="Actual expenses"
                      value={checkIn.actualExpenses || ''}
                      onChange={(e) => updateCheckIn(checkIn.id, 'actualExpenses', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`actual-savings-${checkIn.id}`}>Savings</Label>
                    <Input
                      id={`actual-savings-${checkIn.id}`}
                      type="number"
                      placeholder="Actual savings"
                      value={checkIn.actualSavings || ''}
                      onChange={(e) => updateCheckIn(checkIn.id, 'actualSavings', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Projected Numbers</h4>
                  <div className="space-y-2">
                    <Label>Income</Label>
                    <div className="p-2 bg-muted rounded text-sm">
                      ${checkIn.projectedIncome.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expenses</Label>
                    <div className="p-2 bg-muted rounded text-sm">
                      ${checkIn.projectedExpenses.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Savings</Label>
                    <div className="p-2 bg-muted rounded text-sm">
                      ${checkIn.projectedSavings.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Variance</h4>
                  <div className="space-y-2">
                    <Label>Income</Label>
                    <div className="p-2 rounded text-sm">
                      {formatVariance(variance.incomeVariance)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expenses</Label>
                    <div className="p-2 rounded text-sm">
                      {formatVariance(-variance.expenseVariance)} {/* Negative because lower expenses are good */}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Savings</Label>
                    <div className="p-2 rounded text-sm">
                      {formatVariance(variance.savingsVariance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <Label htmlFor={`notes-${checkIn.id}`}>Notes</Label>
                <textarea
                  id={`notes-${checkIn.id}`}
                  className="w-full p-3 border rounded-md resize-none"
                  rows={3}
                  placeholder="Add notes about this month's budget performance..."
                  value={checkIn.notes}
                  onChange={(e) => updateCheckIn(checkIn.id, 'notes', e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Net Income</p>
                    <p>${(checkIn.actualIncome - checkIn.actualExpenses).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Projected Net</p>
                    <p>${(checkIn.projectedIncome - checkIn.projectedExpenses).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Difference</p>
                    <p className={`${(checkIn.actualIncome - checkIn.actualExpenses) >= (checkIn.projectedIncome - checkIn.projectedExpenses) ? 'text-green-600' : 'text-red-600'}`}>
                      ${((checkIn.actualIncome - checkIn.actualExpenses) - (checkIn.projectedIncome - checkIn.projectedExpenses)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Overall Variance</p>
                    {formatVariance(variance.overallVariance)}
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
