import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatFormulaDescription,
  getPresetFormulas
  // updateSavingsBucketsWithDynamicTargets
} from '@forgetfunds/business-logic';
import type { Debt, InstallmentLoan, RecurringExpense, SavingsBucket, SavingsFormula } from '@forgetfunds/shared-types';
import { Calculator, Info, MinusCircle, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SavingsManagementProps {
  savingsBuckets: SavingsBucket[];
  onSavingsChange: (buckets: SavingsBucket[]) => void;
  availableForSavings: number;
  // Additional data for dynamic calculations
  monthlyIncome: number;
  monthlyExpenses: number;
  recurringExpenses: RecurringExpense[];
  debts: Debt[];
  installmentLoans: InstallmentLoan[];
}

export function SavingsManagement({ 
  savingsBuckets, 
  onSavingsChange, 
  availableForSavings,
  monthlyIncome,
  monthlyExpenses,
  recurringExpenses,
  debts,
  installmentLoans
}: SavingsManagementProps) {
  const [showFormulaDialog, setShowFormulaDialog] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Calculate context for dynamic formulas
  const calculationContext = {
    monthlyIncome,
    monthlyExpenses,
    recurringExpenses,
    debts,
    installmentLoans
  };

  // Update buckets with dynamic targets when context changes
  useEffect(() => {
    const updatedBuckets = updateSavingsBucketsWithDynamicTargets(savingsBuckets, calculationContext);
    const hasChanges = updatedBuckets.some((bucket, index) => 
      bucket.computedTarget !== savingsBuckets[index]?.computedTarget
    );
    
    if (hasChanges) {
      onSavingsChange(updatedBuckets);
    }
  }, [monthlyIncome, monthlyExpenses, recurringExpenses.length, debts.length, installmentLoans.length, savingsBuckets, onSavingsChange]);
  const addSavingsBucket = () => {
    const newId = Math.max(...savingsBuckets.map(b => b.id), 0) + 1;
    const newBucket: SavingsBucket = {
      id: newId,
      name: '',
      target: 0,
      current: 0,
      category: 'General',
      priority: 1,
    };
    onSavingsChange([...savingsBuckets, newBucket]);
  };

  const updateSavingsBucket = (id: number, field: keyof SavingsBucket, value: string | number) => {
    const updated = savingsBuckets.map(bucket =>
      bucket.id === id ? { ...bucket, [field]: value } : bucket
    );
    onSavingsChange(updated);
  };

  const removeSavingsBucket = (id: number) => {
    const filtered = savingsBuckets.filter(bucket => bucket.id !== id);
    onSavingsChange(filtered);
  };

  const toggleDynamicGoal = (id: number, isDynamic: boolean) => {
    const updated = savingsBuckets.map(bucket =>
      bucket.id === id ? { 
        ...bucket, 
        isDynamic,
        dynamicFormula: isDynamic ? bucket.dynamicFormula || { type: 'emergency_fund', months: 3 } : undefined
      } : bucket
    );
    onSavingsChange(updated);
  };

  const updateFormula = (id: number, formula: SavingsFormula) => {
    const updated = savingsBuckets.map(bucket =>
      bucket.id === id ? { ...bucket, dynamicFormula: formula } : bucket
    );
    onSavingsChange(updated);
  };

  const applyPresetFormula = (bucketId: number) => {
    const preset = getPresetFormulas().find(p => p.name === selectedPreset);
    if (preset) {
      updateFormula(bucketId, preset.formula);
      setShowFormulaDialog(null);
      setSelectedPreset('');
    }
  };

  // Calculate totals
  const totalSavingsTarget = savingsBuckets.reduce((sum, bucket) => sum + bucket.target, 0);
  const totalCurrentSavings = savingsBuckets.reduce((sum, bucket) => sum + bucket.current, 0);
  const overallProgress = totalSavingsTarget > 0 ? (totalCurrentSavings / totalSavingsTarget) * 100 : 0;

  // Group by category for summary
  const savingsByCategory = savingsBuckets.reduce((acc, bucket) => {
    if (!acc[bucket.category]) {
      acc[bucket.category] = { current: 0, target: 0, buckets: [] };
    }
    acc[bucket.category].current += bucket.current;
    acc[bucket.category].target += bucket.target;
    acc[bucket.category].buckets.push(bucket);
    return acc;
  }, {} as Record<string, { current: number; target: number; buckets: SavingsBucket[] }>);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Savings Goals</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                const newId = Math.max(...savingsBuckets.map(b => b.id), 0) + 1;
                const emergencyFund: SavingsBucket = {
                  id: newId,
                  name: 'Emergency Fund',
                  target: monthlyExpenses * 6,
                  current: 0,
                  category: 'Emergency',
                  priority: 1,
                  isDynamic: true,
                  dynamicFormula: {
                    type: 'emergency_fund',
                    months: 6,
                    description: '6 months of total expenses'
                  },
                  computedTarget: monthlyExpenses * 6
                };
                onSavingsChange([...savingsBuckets, emergencyFund]);
              }}
              variant="outline"
              size="sm"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Quick Emergency Fund
            </Button>
            <Button onClick={addSavingsBucket} variant="outline" size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Custom Goal
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            Total Savings Target: <span className="font-semibold text-blue-600">${totalSavingsTarget.toFixed(2)}</span>
          </div>
          <div>
            Current Savings: <span className="font-semibold text-green-600">${totalCurrentSavings.toFixed(2)}</span>
          </div>
          <div>
            Overall Progress: <span className="font-semibold">{overallProgress.toFixed(1)}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {savingsBuckets.map((bucket) => {
          const progress = bucket.target > 0 ? (bucket.current / bucket.target) * 100 : 0;
          const timeToComplete = availableForSavings > 0 
            ? Math.ceil((bucket.target - bucket.current) / (availableForSavings * 0.3))
            : 0;
          
          return (
            <div key={bucket.id} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 items-center">
                <Input
                  placeholder="Savings goal name (e.g., Emergency Fund)"
                  value={bucket.name}
                  onChange={(e) => updateSavingsBucket(bucket.id, 'name', e.target.value)}
                />
                <div className="flex justify-end">
                  <ConfirmationDialog
                    title="Remove Savings Goal"
                    description={`Are you sure you want to remove "${bucket.name}"? This action cannot be undone.`}
                    onConfirm={() => removeSavingsBucket(bucket.id)}
                    triggerText="Remove"
                    confirmText="Remove Goal"
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
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Category
                  </label>
                  <Select
                    value={bucket.category}
                    onValueChange={(value: SavingsBucket['category']) =>
                      updateSavingsBucket(bucket.id, 'category', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Investment">Investment</SelectItem>
                      <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      Target Amount ($)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`dynamic-${bucket.id}`}
                        checked={bucket.isDynamic || false}
                        onCheckedChange={(checked) => toggleDynamicGoal(bucket.id, checked as boolean)}
                      />
                      <label 
                        htmlFor={`dynamic-${bucket.id}`}
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        Dynamic
                      </label>
                      {bucket.isDynamic && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFormulaDialog(bucket.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Calculator className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {bucket.isDynamic ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-blue-700 dark:text-blue-300">
                              Dynamic Goal: ${bucket.computedTarget?.toLocaleString() || bucket.target.toLocaleString()}
                            </div>
                            <div className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                              {bucket.dynamicFormula ? 
                                formatFormulaDescription(bucket.dynamicFormula, calculationContext) :
                                'Click the calculator to set up formula'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Input
                      type="number"
                      placeholder="0"
                      value={bucket.target || ''}
                      onChange={(e) =>
                        updateSavingsBucket(bucket.id, 'target', parseFloat(e.target.value) || 0)
                      }
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Current Amount ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={bucket.current || ''}
                    onChange={(e) =>
                      updateSavingsBucket(bucket.id, 'current', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Priority
                  </label>
                  <Select
                    value={bucket.priority.toString()}
                    onValueChange={(value) =>
                      updateSavingsBucket(bucket.id, 'priority', parseInt(value) as 1 | 2 | 3)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">High</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-md space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress.toFixed(1)}% complete</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Remaining:</span>
                    <div className="font-semibold">
                      ${(bucket.target - bucket.current).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Completion:</span>
                    <div className="font-semibold">
                      {timeToComplete > 0 && timeToComplete < 1000
                        ? `${timeToComplete} months`
                        : 'Adjust savings allocation'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {savingsBuckets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No savings goals added yet.</p>
            <p className="text-sm">Click "Add Savings Goal" to start tracking your financial goals.</p>
          </div>
        )}

        {Object.keys(savingsByCategory).length > 0 && (
          <div className="pt-4 border-t space-y-4">
            <h4 className="font-medium">Savings by Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(savingsByCategory).map(([category, data]) => {
                const categoryProgress = data.target > 0 ? (data.current / data.target) * 100 : 0;
                return (
                  <div key={category} className="bg-muted p-3 rounded-lg">
                    <div className="font-medium text-sm mb-2">{category}</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${data.current.toFixed(0)} / ${data.target.toFixed(0)}</span>
                        <span>{categoryProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(categoryProgress, 100)} className="h-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {savingsBuckets.length > 0 && (
          <div className="pt-4 border-t">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                Savings Strategy Tips
              </h4>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <p>• Build emergency fund first (3-6 months expenses)</p>
                <p>• Automate savings to reach goals consistently</p>
                <p>• Prioritize high-priority goals over low-priority ones</p>
                <p>• Review and adjust targets regularly</p>
                <p>• Consider high-yield savings accounts for better returns</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Formula Configuration Dialog */}
    {showFormulaDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Configure Dynamic Goal Formula</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowFormulaDialog(null);
                setSelectedPreset('');
              }}
            >
              ✕
            </Button>
          </div>

          <div className="space-y-6">
            {/* Preset Formulas */}
            <div>
              <h4 className="font-medium mb-3">Quick Setup - Preset Formulas</h4>
              <div className="space-y-2">
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a preset formula..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getPresetFormulas().map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedPreset && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {getPresetFormulas().find(p => p.name === selectedPreset)?.formula.description}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Calculation: {formatFormulaDescription(
                        getPresetFormulas().find(p => p.name === selectedPreset)!.formula,
                        calculationContext
                      )}
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => showFormulaDialog && applyPresetFormula(showFormulaDialog)}
                  disabled={!selectedPreset || !showFormulaDialog}
                  className="w-full"
                >
                  Apply Preset Formula
                </Button>
              </div>
            </div>

            {/* Current Formula Details */}
            {showFormulaDialog && (() => {
              const bucket = savingsBuckets.find(b => b.id === showFormulaDialog);
              if (!bucket?.dynamicFormula) return null;
              
              return (
                <div>
                  <h4 className="font-medium mb-3">Current Formula</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      <span className="text-sm capitalize">{bucket.dynamicFormula.type.replace('_', ' ')}</span>
                    </div>
                    
                    {bucket.dynamicFormula.type === 'emergency_fund' && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Months:</span>
                        <span className="text-sm">{bucket.dynamicFormula.months || 3}</span>
                      </div>
                    )}
                    
                    {(bucket.dynamicFormula.type === 'percentage_income' || bucket.dynamicFormula.type === 'percentage_expenses') && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Percentage:</span>
                        <span className="text-sm">{((bucket.dynamicFormula.percentage || 0.1) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-1">Current Calculation:</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFormulaDescription(bucket.dynamicFormula, calculationContext)}
                      </div>
                    </div>
                    
                    <div className="text-lg font-semibold text-center p-2 bg-white dark:bg-gray-800 rounded">
                      Target: ${bucket.computedTarget?.toLocaleString() || bucket.target.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Manual Formula Editor */}
            <div>
              <h4 className="font-medium mb-3">Custom Formula Editor</h4>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Available Variables:</strong>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• <code>monthlyIncome</code> - Your total monthly income (${monthlyIncome.toLocaleString()})</li>
                      <li>• <code>monthlyExpenses</code> - Your total monthly expenses (${monthlyExpenses.toLocaleString()})</li>
                      <li>• <code>totalDebtPayments</code> - Total monthly debt payments</li>
                      <li>• <code>Math</code> - JavaScript Math functions (Math.max, Math.min, etc.)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Formula Expression</label>
                  <Input
                    type="text"
                    placeholder="monthlyExpenses * 6"
                    value={(() => {
                      const bucket = savingsBuckets.find(b => b.id === showFormulaDialog);
                      return bucket?.dynamicFormula?.customExpression || '';
                    })()}
                    onChange={(e) => {
                      if (showFormulaDialog) {
                        const customFormula: SavingsFormula = {
                          type: 'custom',
                          customExpression: e.target.value,
                          description: `Custom: ${e.target.value}`
                        };
                        updateFormula(showFormulaDialog, customFormula);
                      }
                    }}
                  />
                  <div className="text-xs text-muted-foreground">
                    Enter a JavaScript expression using the variables above
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <strong>Example formulas:</strong>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• Emergency fund: <code>monthlyExpenses * 6</code></li>
                    <li>• 20% of income: <code>monthlyIncome * 0.2</code></li>
                    <li>• House down payment: <code>Math.max(monthlyIncome * 0.25, 50000)</code></li>
                    <li>• Vacation fund: <code>monthlyIncome * 0.1 * 12</code> (10% of annual income)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
