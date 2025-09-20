import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OneTimeExpense, RecurringExpense } from '@forgetfunds/shared-types';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface ExpenseManagementProps {
  recurringExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];
  onRecurringExpensesChange: (expenses: RecurringExpense[]) => void;
  onOneTimeExpensesChange: (expenses: OneTimeExpense[]) => void;
}

export function ExpenseManagement({ 
  recurringExpenses, 
  oneTimeExpenses,
  onRecurringExpensesChange,
  onOneTimeExpensesChange
}: ExpenseManagementProps) {
  
  // Recurring Expenses CRUD
  const addRecurringExpense = () => {
    const newId = Math.max(...recurringExpenses.map(e => e.id), 0) + 1;
    const newExpense = { id: newId, category: '', amount: 0 };
    onRecurringExpensesChange([...recurringExpenses, newExpense]);
  };

  const updateRecurringExpense = (id: number, field: keyof RecurringExpense, value: string | number) => {
    const updated = recurringExpenses.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    onRecurringExpensesChange(updated);
  };

  const removeRecurringExpense = (id: number) => {
    const filtered = recurringExpenses.filter(exp => exp.id !== id);
    onRecurringExpensesChange(filtered);
  };

  // One-time Expenses CRUD
  const addOneTimeExpense = () => {
    const newId = Math.max(...oneTimeExpenses.map(e => e.id), 0) + 1;
    const newExpense = { id: newId, description: '', amount: 0 };
    onOneTimeExpensesChange([...oneTimeExpenses, newExpense]);
  };

  const updateOneTimeExpense = (id: number, field: keyof OneTimeExpense, value: string | number) => {
    const updated = oneTimeExpenses.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    onOneTimeExpensesChange(updated);
  };

  const removeOneTimeExpense = (id: number) => {
    const filtered = oneTimeExpenses.filter(exp => exp.id !== id);
    onOneTimeExpensesChange(filtered);
  };

  // Calculate totals
  const totalRecurringExpenses = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalOneTimeExpenses = oneTimeExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Tabs defaultValue="recurring" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="recurring">Recurring Monthly</TabsTrigger>
        <TabsTrigger value="onetime">One-time Expenses</TabsTrigger>
      </TabsList>

      <TabsContent value="recurring">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recurring Monthly Expenses</CardTitle>
              <Button onClick={addRecurringExpense} variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Monthly Expenses: <span className="font-semibold text-red-600">${totalRecurringExpenses.toFixed(2)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recurringExpenses.map((expense) => (
              <div key={expense.id} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-7">
                  <Input
                    placeholder="Category (e.g., Rent, Utilities, Groceries)"
                    value={expense.category}
                    onChange={(e) => updateRecurringExpense(expense.id, 'category', e.target.value)}
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    type="number"
                    placeholder="Monthly amount"
                    value={expense.amount || ''}
                    onChange={(e) => updateRecurringExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <ConfirmationDialog
                    title="Remove Recurring Expense"
                    description={`Are you sure you want to remove "${expense.category}"? This action cannot be undone.`}
                    onConfirm={() => removeRecurringExpense(expense.id)}
                    triggerText=""
                    confirmText="Remove Expense"
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
            
            {recurringExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recurring expenses added yet.</p>
                <p className="text-sm">Click "Add Expense" to get started.</p>
              </div>
            )}

            {recurringExpenses.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Weekly Average:</span>
                    <div className="font-semibold">${(totalRecurringExpenses / 4.33).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Daily Average:</span>
                    <div className="font-semibold">${(totalRecurringExpenses / 30).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Annual Total:</span>
                    <div className="font-semibold text-red-600">${(totalRecurringExpenses * 12).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="onetime">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>One-time Expenses</CardTitle>
              <Button onClick={addOneTimeExpense} variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Total One-time Expenses: <span className="font-semibold text-orange-600">${totalOneTimeExpenses.toFixed(2)}</span>
              <span className="ml-2 text-xs">(not included in monthly budget)</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {oneTimeExpenses.map((expense) => (
              <div key={expense.id} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-7">
                  <Input
                    placeholder="Description (e.g., Movers, Security Deposit)"
                    value={expense.description}
                    onChange={(e) => updateOneTimeExpense(expense.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={expense.amount || ''}
                    onChange={(e) => updateOneTimeExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <ConfirmationDialog
                    title="Remove One-Time Expense"
                    description={`Are you sure you want to remove "${expense.description}"? This action cannot be undone.`}
                    onConfirm={() => removeOneTimeExpense(expense.id)}
                    triggerText=""
                    confirmText="Remove Expense"
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
            
            {oneTimeExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No one-time expenses added yet.</p>
                <p className="text-sm">These are expenses that don't affect your monthly budget.</p>
              </div>
            )}

            {oneTimeExpenses.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    Planning Note
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    One-time expenses are tracked separately and don't impact your monthly budget calculations. 
                    Consider setting aside funds from your available savings to cover these costs.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
