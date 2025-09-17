import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Income } from '@/types/budget';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface IncomeManagementProps {
  income: Income[];
  onIncomeChange: (income: Income[]) => void;
}

export function IncomeManagement({ income, onIncomeChange }: IncomeManagementProps) {
  const addIncome = () => {
    const newId = Math.max(...income.map(i => i.id), 0) + 1;
    const newIncome = [...income, { 
      id: newId, 
      source: '', 
      amount: 0, 
      frequency: 'monthly' as const
    }];
    onIncomeChange(newIncome);
  };

  const updateIncome = (id: number, field: keyof Income, value: string | number) => {
    const updatedIncome = income.map(inc => 
      inc.id === id ? { ...inc, [field]: value } : inc
    );
    onIncomeChange(updatedIncome);
  };

  const removeIncome = (id: number) => {
    const filteredIncome = income.filter(inc => inc.id !== id);
    onIncomeChange(filteredIncome);
  };

  // Calculate total monthly income
  const totalMonthlyIncome = income.reduce((sum, inc) => {
    const multiplier = inc.frequency === 'weekly' ? 4.33 : inc.frequency === 'biweekly' ? 2.17 : 1;
    return sum + (inc.amount * multiplier);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Income Sources</CardTitle>
          <Button onClick={addIncome} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Monthly Income: <span className="font-semibold text-green-600">${totalMonthlyIncome.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {income.map((inc) => (
          <div key={inc.id} className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5">
              <Input
                placeholder="Income source (e.g., Salary, Freelance)"
                value={inc.source}
                onChange={(e) => updateIncome(inc.id, 'source', e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                placeholder="Amount"
                value={inc.amount || ''}
                onChange={(e) => updateIncome(inc.id, 'amount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="col-span-3">
              <Select
                value={inc.frequency}
                onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => 
                  updateIncome(inc.id, 'frequency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 flex justify-center">
              <ConfirmationDialog
                title="Remove Income Source"
                description={`Are you sure you want to remove "${inc.source}"? This action cannot be undone.`}
                onConfirm={() => removeIncome(inc.id)}
                triggerText=""
                confirmText="Remove Income"
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
          </div>
        ))}
        
        {income.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No income sources added yet.</p>
            <p className="text-sm">Click "Add Income" to get started.</p>
          </div>
        )}

        {income.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Weekly Income:</span>
                <div className="font-semibold">${(totalMonthlyIncome / 4.33).toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Bi-weekly Income:</span>
                <div className="font-semibold">${(totalMonthlyIncome / 2.17).toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Monthly Income:</span>
                <div className="font-semibold text-green-600">${totalMonthlyIncome.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
