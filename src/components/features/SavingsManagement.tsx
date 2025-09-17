import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { SavingsBucket } from '@/types/budget';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface SavingsManagementProps {
  savingsBuckets: SavingsBucket[];
  onSavingsChange: (buckets: SavingsBucket[]) => void;
  availableForSavings: number;
}

export function SavingsManagement({ 
  savingsBuckets, 
  onSavingsChange, 
  availableForSavings 
}: SavingsManagementProps) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Savings Buckets by Category</CardTitle>
          <Button onClick={addSavingsBucket} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Savings Goal
          </Button>
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
                  <label className="text-xs font-medium text-muted-foreground">
                    Target Amount ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={bucket.target || ''}
                    onChange={(e) =>
                      updateSavingsBucket(bucket.id, 'target', parseFloat(e.target.value) || 0)
                    }
                  />
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
  );
}
