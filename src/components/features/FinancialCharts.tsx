import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type {
  ChartDataPoint,
  Debt,
  DebtCalculation,
  InstallmentLoan,
  MonthlyCheckIn,
  SavingsBucket
} from '@/types/budget';
import {
  BarChart3,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface FinancialChartsProps {
  debts: Debt[];
  installmentLoans: InstallmentLoan[];
  savingsBuckets: SavingsBucket[];
  monthlyCheckIns: MonthlyCheckIn[];
  totalMonthlyIncome: number;
  monthlyExpenses: number;
  availableForSavings: number;
  budgetStartDate?: string;
}

interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  subtitle,
  icon,
  isExpanded,
  onToggle,
  children,
  headerContent
}) => (
  <Card className="mb-4">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {headerContent}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="ml-2"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </CardHeader>
    {isExpanded && <CardContent>{children}</CardContent>}
  </Card>
);

export function FinancialCharts({
  debts,
  installmentLoans,
  savingsBuckets,
  monthlyCheckIns,
  totalMonthlyIncome,
  monthlyExpenses,
  availableForSavings,
  budgetStartDate
}: FinancialChartsProps) {
  // Accordion state management
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'debt-overview': true,
    'savings-overview': false,
    'cash-flow': false,
    'net-worth': false
  });

  const [expandedDebts, setExpandedDebts] = useState<Record<number, boolean>>({});
  const [expandedSavings, setExpandedSavings] = useState<Record<number, boolean>>({});
  const [debtExtraPayments, setDebtExtraPayments] = useState<Record<number, number>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleDebt = (debtId: number) => {
    setExpandedDebts(prev => ({
      ...prev,
      [debtId]: !prev[debtId]
    }));
  };

  const toggleSavings = (savingsId: number) => {
    setExpandedSavings(prev => ({
      ...prev,
      [savingsId]: !prev[savingsId]
    }));
  };

  const updateExtraPayment = (debtId: number, extraPayment: number) => {
    setDebtExtraPayments(prev => ({
      ...prev,
      [debtId]: extraPayment
    }));
  };

  // Date utility functions
  const getBudgetStartDate = (): Date => {
    if (budgetStartDate) {
      return new Date(budgetStartDate);
    }
    // Fallback: use the earliest check-in date or current date
    if (monthlyCheckIns.length > 0) {
      const earliestCheckIn = monthlyCheckIns
        .sort((a, b) => a.month.localeCompare(b.month))[0];
      return new Date(earliestCheckIn.month + '-01');
    }
    return new Date();
  };

  const formatDateForChart = (date: Date): string => {
    return date.toISOString().slice(0, 7); // "2024-01"
  };

  const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  const getMonthsSinceStart = (date: Date, startDate: Date): number => {
    return (date.getFullYear() - startDate.getFullYear()) * 12 + 
           (date.getMonth() - startDate.getMonth());
  };

  // Debt calculations with payoff projections
  const debtCalculations = useMemo(() => {
    return debts.map((debt): DebtCalculation => {
      const monthlyInterestRate = debt.apr / 100 / 12;
      const monthlyInterest = debt.balance * monthlyInterestRate;
      
      // Calculate payoff time using minimum payments
      let balance = debt.balance;
      let months = 0;
      let totalInterest = 0;
      
      while (balance > 0 && months < 600) { // Cap at 50 years
        const interestPayment = balance * monthlyInterestRate;
        const principalPayment = Math.max(0, debt.minPayment - interestPayment);
        
        if (principalPayment <= 0) {
          months = 600; // Infinite payoff time
          break;
        }
        
        balance -= principalPayment;
        totalInterest += interestPayment;
        months++;
      }

      return {
        ...debt,
        monthlyInterest,
        payoffTime: months,
        totalInterest
      };
    });
  }, [debts]);

  // Generate debt payoff timeline data with comparison between min payment and extra payment
  const generateDebtPayoffData = (debt: DebtCalculation, extraPayment: number = 0) => {
    const data: ChartDataPoint[] = [];
    const startDate = getBudgetStartDate();
    const monthlyInterestRate = debt.apr / 100 / 12;
    
    // Calculate both scenarios simultaneously
    let minBalance = debt.balance;
    let extraBalance = debt.balance;
    const minPayment = debt.minPayment;
    const totalPayment = debt.minPayment + extraPayment;
    
    // Get actual payment data from check-ins if available
    const actualPayments = new Map<string, number>();
    monthlyCheckIns.forEach(checkIn => {
      // This is simplified - in reality you'd need to track per-debt payments
      actualPayments.set(checkIn.month, totalPayment);
    });
    
    // Calculate maximum months needed (use the longer of the two scenarios)
    const maxMonths = Math.min(Math.max(debt.payoffTime, 120), 360);
    
    for (let monthOffset = 0; monthOffset <= maxMonths && (minBalance > 0 || extraBalance > 0); monthOffset++) {
      const currentDate = addMonths(startDate, monthOffset);
      const dateStr = formatDateForChart(currentDate);
      
      const actualPayment = actualPayments.get(dateStr);
      const hasActualData = actualPayment !== undefined;
      
      data.push({
        date: dateStr,
        month: monthOffset,
        projectedBalance: Math.max(0, minBalance), // Minimum payment scenario
        projectedBalanceWithExtra: extraPayment > 0 ? Math.max(0, extraBalance) : undefined, // Extra payment scenario
        actualBalance: hasActualData ? Math.max(0, extraBalance) : undefined,
        projectedPayment: minPayment,
        projectedPaymentWithExtra: extraPayment > 0 ? totalPayment : undefined,
        actualPayment: actualPayment,
        balance: Math.max(0, minBalance), // For backward compatibility
        payment: minPayment // For backward compatibility
      });
      
      // Update balances for next month
      if (monthOffset < maxMonths) {
        // Minimum payment scenario
        if (minBalance > 0) {
          const minInterestPayment = minBalance * monthlyInterestRate;
          const minPrincipalPayment = Math.max(0, minPayment - minInterestPayment);
          minBalance = Math.max(0, minBalance - minPrincipalPayment);
        }
        
        // Extra payment scenario
        if (extraBalance > 0 && extraPayment > 0) {
          const extraInterestPayment = extraBalance * monthlyInterestRate;
          const extraPrincipalPayment = Math.max(0, totalPayment - extraInterestPayment);
          extraBalance = Math.max(0, extraBalance - extraPrincipalPayment);
        }
      }
    }
    
    return data;
  };

  // Generate savings growth projections with real dates
  const generateSavingsGrowthData = (bucket: SavingsBucket, monthlyContribution: number) => {
    const data: ChartDataPoint[] = [];
    const startDate = getBudgetStartDate();
    let currentAmount = bucket.current;
    const monthsToTarget = Math.ceil((bucket.target - bucket.current) / Math.max(monthlyContribution, 1));
    
    // Get actual savings data from check-ins if available
    const actualSavingsData = new Map<string, number>();
    monthlyCheckIns.forEach(checkIn => {
      actualSavingsData.set(checkIn.month, checkIn.actualSavings);
    });
    
    for (let monthOffset = 0; monthOffset <= Math.min(monthsToTarget, 120); monthOffset++) {
      const currentDate = addMonths(startDate, monthOffset);
      const dateStr = formatDateForChart(currentDate);
      
      const actualSavings = actualSavingsData.get(dateStr);
      const hasActualData = actualSavings !== undefined;
      
      data.push({
        date: dateStr,
        month: monthOffset,
        projectedSavings: currentAmount,
        actualSavings: hasActualData ? actualSavings : undefined,
        target: bucket.target,
        savings: currentAmount // For backward compatibility
      });
      
      if (monthOffset < Math.min(monthsToTarget, 120) && currentAmount < bucket.target) {
        currentAmount += monthlyContribution;
      }
    }
    
    return data;
  };

  // Cash flow analysis data with projected vs actual
  const cashFlowData = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const startDate = getBudgetStartDate();
    const sortedCheckIns = [...monthlyCheckIns].sort((a, b) => a.month.localeCompare(b.month));
    
    // Create a comprehensive timeline from budget start to future projections
    const currentDate = new Date();
    const endDate = addMonths(currentDate, 12); // Project 12 months into future
    const totalMonths = getMonthsSinceStart(endDate, startDate);
    
    // Create map of actual data
    const actualDataMap = new Map<string, MonthlyCheckIn>();
    sortedCheckIns.forEach(checkIn => {
      actualDataMap.set(checkIn.month, checkIn);
    });
    
    for (let monthOffset = 0; monthOffset <= totalMonths; monthOffset++) {
      const currentDate = addMonths(startDate, monthOffset);
      const dateStr = formatDateForChart(currentDate);
      const actualData = actualDataMap.get(dateStr);
      
      data.push({
        date: dateStr,
        month: monthOffset,
        // Projected data (constant projections)
        projectedIncome: totalMonthlyIncome,
        projectedExpenses: monthlyExpenses,
        projectedSavings: availableForSavings,
        // Actual data (only if available)
        actualIncome: actualData?.actualIncome,
        actualExpenses: actualData?.actualExpenses,
        actualSavings: actualData?.actualSavings,
        // Legacy format for backward compatibility
        income: actualData?.actualIncome || totalMonthlyIncome,
        expenses: actualData?.actualExpenses || monthlyExpenses,
        savings: actualData?.actualSavings || availableForSavings
      });
    }
    
    return data;
  }, [monthlyCheckIns, totalMonthlyIncome, monthlyExpenses, availableForSavings, budgetStartDate]);

  // Net worth progression with real dates
  const netWorthData = useMemo(() => {
    const startDate = getBudgetStartDate();
    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0) +
                     installmentLoans.reduce((sum, loan) => sum + loan.balance, 0);
    const totalSavings = savingsBuckets.reduce((sum, bucket) => sum + bucket.current, 0);
    
    // Project net worth over 5 years
    const data: ChartDataPoint[] = [];
    let currentDebt = totalDebt;
    let currentSavings = totalSavings;
    
    const totalDebtPayments = debts.reduce((sum, debt) => sum + debt.minPayment, 0) +
                             installmentLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
    
    // Get actual net worth data from check-ins
    const actualNetWorthMap = new Map<string, number>();
    monthlyCheckIns.forEach(checkIn => {
      // Calculate net worth from actual data (simplified)
      const netWorth = checkIn.actualSavings - (totalDebt * 0.9); // Rough estimate
      actualNetWorthMap.set(checkIn.month, netWorth);
    });
    
    for (let monthOffset = 0; monthOffset <= 60; monthOffset++) {
      const currentDate = addMonths(startDate, monthOffset);
      const dateStr = formatDateForChart(currentDate);
      const actualNetWorth = actualNetWorthMap.get(dateStr);
      
      const projectedNetWorth = currentSavings - currentDebt;
      
      data.push({
        date: dateStr,
        month: monthOffset,
        debt: -currentDebt,
        savings: currentSavings,
        projectedBalance: projectedNetWorth,
        actualBalance: actualNetWorth,
        netWorth: projectedNetWorth // For backward compatibility
      });
      
      // Reduce debt by payments (simplified)
      currentDebt = Math.max(0, currentDebt - totalDebtPayments * 0.7); // Assume 70% goes to principal
      
      // Increase savings
      if (availableForSavings > 0) {
        currentSavings += availableForSavings;
      }
    }
    
    return data;
  }, [debts, installmentLoans, savingsBuckets, availableForSavings, monthlyCheckIns, budgetStartDate]);

  // Color schemes
  const debtColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
  const savingsColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Debt Payoff Analysis */}
      <AccordionSection
        title="Debt Payoff Analysis"
        subtitle={`${debts.length + installmentLoans.length} active debts`}
        icon={<Calculator className="h-5 w-5 text-red-500" />}
        isExpanded={expandedSections['debt-overview']}
        onToggle={() => toggleSection('debt-overview')}
        headerContent={
          <div className="text-right">
            <div className="text-lg font-semibold text-red-600">
              ${(debts.reduce((sum, debt) => sum + debt.balance, 0) + 
                 installmentLoans.reduce((sum, loan) => sum + loan.balance, 0)).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Debt</div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Overall Debt Payoff Timeline */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Overall Debt Reduction Timeline</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={netWorthData.map(d => ({ 
                date: d.date, 
                projectedDebt: d.debt ? -d.debt : 0,
                actualDebt: d.actualBalance ? -Math.abs(d.actualBalance) : undefined
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + '-01');
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${Math.abs(value).toLocaleString()}`, 
                    name === 'projectedDebt' ? 'Projected Total Debt' : 'Actual Total Debt'
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label + '-01');
                    return `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Total Debt`;
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="projectedDebt" 
                  stroke="#ef4444" 
                  fill="#fecaca" 
                  strokeWidth={2}
                  name="Projected Debt"
                />
                {monthlyCheckIns.length > 0 && (
                  <Area 
                    type="monotone" 
                    dataKey="actualDebt" 
                    stroke="#dc2626" 
                    fill="none" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="Actual Debt"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Individual Debt Analysis */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Individual Debt Analysis</h4>
            
            {debtCalculations.map((debt, index) => (
              <Card key={debt.id} className="border-l-4" style={{ borderLeftColor: debtColors[index % debtColors.length] }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{debt.name}</CardTitle>
                      <CardDescription>
                        ${debt.balance.toLocaleString()} at {debt.apr}% APR
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {debt.payoffTime < 600 ? `${Math.ceil(debt.payoffTime / 12)} years` : 'Never'}
                        </div>
                        <div className="text-xs text-muted-foreground">Payoff Time</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDebt(debt.id)}
                      >
                        {expandedDebts[debt.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress bar showing payoff progress */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{debt.payoffTime < 600 ? `${Math.ceil(debt.payoffTime)} months remaining` : 'Minimum payment insufficient'}</span>
                    </div>
                    <Progress 
                      value={debt.payoffTime < 600 ? Math.max(0, 100 - (debt.payoffTime / 360 * 100)) : 0} 
                      className="h-2"
                    />
                  </div>
                </CardHeader>
                
                {expandedDebts[debt.id] && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-red-50 rounded-lg dark:bg-red-950">
                        <div className="text-lg font-semibold text-red-600">
                          ${debt.minPayment.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Min Payment</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg dark:bg-orange-950">
                        <div className="text-lg font-semibold text-orange-600">
                          ${debt.monthlyInterest.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Monthly Interest</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg dark:bg-yellow-950">
                        <div className="text-lg font-semibold text-yellow-600">
                          ${debt.totalInterest.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Interest</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg dark:bg-green-950">
                        <div className="text-lg font-semibold text-green-600">
                          {debt.payoffTime < 600 ? Math.ceil(debt.payoffTime) : '∞'}
                        </div>
                        <div className="text-xs text-muted-foreground">Months to Payoff</div>
                      </div>
                    </div>
                    
                    {/* Extra Payment Control */}
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label htmlFor={`extra-payment-${debt.id}`} className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Extra Payment per Month
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">$</span>
                            <Input
                              id={`extra-payment-${debt.id}`}
                              type="number"
                              min="0"
                              step="10"
                              placeholder="0"
                              value={debtExtraPayments[debt.id] || ''}
                              onChange={(e) => updateExtraPayment(debt.id, parseFloat(e.target.value) || 0)}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground">per month</span>
                          </div>
                        </div>
                        {debtExtraPayments[debt.id] > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              ${(debt.minPayment + debtExtraPayments[debt.id]).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Payment</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="text-sm font-medium mb-2">Payoff Timeline {debtExtraPayments[debt.id] > 0 ? 'Comparison' : ''}</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={generateDebtPayoffData(debt, debtExtraPayments[debt.id] || 0)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date"
                            tickFormatter={(value) => {
                              const date = new Date(value + '-01');
                              return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                            }}
                          />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `$${value.toLocaleString()}`, 
                              name === 'projectedBalance' ? 'Min Payment Balance' : 
                              name === 'projectedBalanceWithExtra' ? 'With Extra Payment Balance' :
                              name === 'actualBalance' ? 'Actual Balance' : 'Payment'
                            ]}
                            labelFormatter={(label) => {
                              const date = new Date(label + '-01');
                              return `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - ${debt.name}`;
                            }}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="projectedBalance" 
                            stroke={debtColors[index % debtColors.length]} 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Min Payment Balance"
                          />
                          {debtExtraPayments[debt.id] > 0 && (
                            <Line 
                              type="monotone" 
                              dataKey="projectedBalanceWithExtra" 
                              stroke={debtColors[index % debtColors.length]} 
                              strokeWidth={3}
                              dot={false}
                              name="With Extra Payment Balance"
                            />
                          )}
                          {monthlyCheckIns.length > 0 && (
                            <Line 
                              type="monotone" 
                              dataKey="actualBalance" 
                              stroke="#22c55e" 
                              strokeWidth={3}
                              strokeDasharray="3 3"
                              dot={false}
                              name="Actual Balance"
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Current Extra Payment Impact */}
                    {debtExtraPayments[debt.id] > 0 && (
                      <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <h5 className="text-sm font-medium mb-2 text-green-700 dark:text-green-300">Your Extra Payment Impact</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {(() => {
                            const extraData = generateDebtPayoffData(debt, debtExtraPayments[debt.id]);
                            const newPayoffTime = extraData.findIndex(d => (d.projectedBalanceWithExtra || 0) <= 0.01);
                            const actualNewPayoffTime = newPayoffTime > 0 ? newPayoffTime : extraData.length - 1;
                            const timeSaved = debt.payoffTime - actualNewPayoffTime;
                            
                            // Calculate interest saved properly
                            const monthlyInterestRate = debt.apr / 100 / 12;
                            
                            // Total interest with minimum payments (original scenario)
                            const originalTotalInterest = debt.totalInterest;
                            
                            // Calculate total interest with extra payments
                            let extraBalance = debt.balance;
                            let totalInterestWithExtra = 0;
                            const totalPayment = debt.minPayment + debtExtraPayments[debt.id];
                            
                            for (let month = 0; month < actualNewPayoffTime && extraBalance > 0; month++) {
                              const interestPayment = extraBalance * monthlyInterestRate;
                              totalInterestWithExtra += interestPayment;
                              const principalPayment = Math.max(0, totalPayment - interestPayment);
                              extraBalance = Math.max(0, extraBalance - principalPayment);
                            }
                            
                            const interestSaved = originalTotalInterest - totalInterestWithExtra;
                            
                            return (
                              <>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-600">
                                    {Math.ceil(timeSaved)} months
                                  </div>
                                  <div className="text-xs text-muted-foreground">Time Saved</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-600">
                                    ${Math.max(0, interestSaved).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Interest Saved</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Extra Payment Scenarios */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Quick Impact Preview</h5>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {[50, 100, 200].map(extra => {
                          const extraData = generateDebtPayoffData(debt, extra);
                          const newPayoffTime = extraData.findIndex(d => d.projectedBalanceWithExtra === 0 || d.projectedBalanceWithExtra === undefined);
                          const actualNewPayoffTime = newPayoffTime > 0 ? newPayoffTime : extraData.length - 1;
                          const timeSaved = debt.payoffTime - actualNewPayoffTime;
                          return (
                            <div key={extra} className="p-2 bg-blue-50 rounded dark:bg-blue-950">
                              <div className="font-medium">+${extra}/month</div>
                              <div className="text-muted-foreground">
                                Saves {Math.ceil(timeSaved)} months
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Installment Loans */}
            {installmentLoans.map((loan) => (
              <Card key={`loan-${loan.id}`} className="border-l-4 border-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{loan.name}</CardTitle>
                      <CardDescription>
                        ${loan.balance.toLocaleString()} • {loan.remainingMonths} months remaining
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${loan.monthlyPayment.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Monthly Payment</div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{loan.remainingMonths} months remaining</span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (loan.remainingMonths / 360 * 100))} 
                      className="h-2"
                    />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* Savings Growth Projections */}
      <AccordionSection
        title="Savings Growth Projections"
        subtitle={`${savingsBuckets.length} savings goals`}
        icon={<Target className="h-5 w-5 text-green-500" />}
        isExpanded={expandedSections['savings-overview']}
        onToggle={() => toggleSection('savings-overview')}
        headerContent={
          <div className="text-right">
            <div className="text-lg font-semibold text-green-600">
              ${savingsBuckets.reduce((sum, bucket) => sum + bucket.current, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Current Savings</div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Overall Savings Growth */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Overall Savings Growth</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={netWorthData.map(d => ({ 
                date: d.date, 
                projectedSavings: d.savings,
                actualSavings: d.actualBalance && d.actualBalance > 0 ? d.actualBalance : undefined
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value + '-01');
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`, 
                    name === 'projectedSavings' ? 'Projected Total Savings' : 'Actual Total Savings'
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label + '-01');
                    return `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Overall Savings`;
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="projectedSavings" 
                  stroke="#22c55e" 
                  fill="#bbf7d0" 
                  strokeWidth={2}
                  name="Projected Savings"
                />
                {monthlyCheckIns.length > 0 && (
                  <Line 
                    type="monotone" 
                    dataKey="actualSavings" 
                    stroke="#16a34a" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Actual Savings"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Individual Savings Buckets */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Individual Savings Goals</h4>
            
            {savingsBuckets.map((bucket, index) => {
              const monthlyContribution = Math.max(0, availableForSavings / savingsBuckets.length);
              const progressPercent = (bucket.current / bucket.target) * 100;
              const monthsToTarget = Math.ceil((bucket.target - bucket.current) / Math.max(monthlyContribution, 1));
              
              return (
                <Card key={bucket.id} className="border-l-4" style={{ borderLeftColor: savingsColors[index % savingsColors.length] }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{bucket.name}</CardTitle>
                        <CardDescription>
                          ${bucket.current.toLocaleString()} of ${bucket.target.toLocaleString()} • {bucket.category}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {monthlyContribution > 0 && monthsToTarget < 1200 ? `${monthsToTarget} months` : 'No contributions'}
                          </div>
                          <div className="text-xs text-muted-foreground">Time to Goal</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSavings(bucket.id)}
                        >
                          {expandedSavings[bucket.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{progressPercent.toFixed(1)}% complete</span>
                      </div>
                      <Progress value={Math.min(progressPercent, 100)} className="h-2" />
                    </div>
                  </CardHeader>
                  
                  {expandedSavings[bucket.id] && (
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg dark:bg-blue-950">
                          <div className="text-lg font-semibold text-blue-600">
                            ${bucket.current.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Current Amount</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg dark:bg-green-950">
                          <div className="text-lg font-semibold text-green-600">
                            ${bucket.target.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Target Amount</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg dark:bg-purple-950">
                          <div className="text-lg font-semibold text-purple-600">
                            ${(bucket.target - bucket.current).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Remaining</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg dark:bg-orange-950">
                          <div className="text-lg font-semibold text-orange-600">
                            Priority {bucket.priority}
                          </div>
                          <div className="text-xs text-muted-foreground">Priority Level</div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2">Growth Timeline</h5>
                        <ResponsiveContainer width="100%" height={200}>
                          <ComposedChart data={generateSavingsGrowthData(bucket, monthlyContribution)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date"
                              tickFormatter={(value) => {
                                const date = new Date(value + '-01');
                                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                              }}
                            />
                            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                            <Tooltip 
                              formatter={(value: number, name: string) => [
                                `$${value.toLocaleString()}`, 
                                name === 'projectedSavings' ? 'Projected Savings' : 
                                name === 'actualSavings' ? 'Actual Savings' : 'Target Goal'
                              ]}
                              labelFormatter={(label) => {
                                const date = new Date(label + '-01');
                                return `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - ${bucket.name}`;
                              }}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: 'hsl(var(--foreground))'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="projectedSavings" 
                              stroke={savingsColors[index % savingsColors.length]} 
                              fill={savingsColors[index % savingsColors.length] + '20'}
                              strokeWidth={2}
                              name="Projected Amount"
                            />
                            {monthlyCheckIns.length > 0 && (
                              <Line 
                                type="monotone" 
                                dataKey="actualSavings" 
                                stroke={savingsColors[index % savingsColors.length]} 
                                strokeWidth={3}
                                strokeDasharray="3 3"
                                dot={false}
                                name="Actual Amount"
                              />
                            )}
                            <Line 
                              type="monotone" 
                              dataKey="target" 
                              stroke="#94a3b8" 
                              strokeDasharray="5 5"
                              dot={false}
                              name="Target"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </AccordionSection>

      {/* Cash Flow Analysis */}
      <AccordionSection
        title="Cash Flow Analysis"
        subtitle={`${monthlyCheckIns.length} months of data`}
        icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
        isExpanded={expandedSections['cash-flow']}
        onToggle={() => toggleSection('cash-flow')}
        headerContent={
          <div className="text-right">
            <div className="text-lg font-semibold text-blue-600">
              ${availableForSavings.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Monthly Surplus</div>
          </div>
        }
      >
        <div className="space-y-6">
          {cashFlowData.length > 0 ? (
            <>
              <div>
                <h4 className="text-md font-semibold mb-3">Income vs Expenses Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value + '-01');
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString()}`, 
                        name.includes('projected') ? name.replace('projected', 'Projected ') : 
                        name.includes('actual') ? name.replace('actual', 'Actual ') : name
                      ]}
                      labelFormatter={(label) => {
                        const date = new Date(label + '-01');
                        return `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Income vs Expenses`;
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="actualIncome" fill="#22c55e" name="Actual Income" />
                    <Bar dataKey="actualExpenses" fill="#ef4444" name="Actual Expenses" />
                    <Line type="monotone" dataKey="projectedIncome" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" name="Projected Income" />
                    <Line type="monotone" dataKey="projectedExpenses" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" name="Projected Expenses" />
                    <Line type="monotone" dataKey="actualSavings" stroke="#3b82f6" strokeWidth={3} name="Actual Savings" />
                    <Line type="monotone" dataKey="projectedSavings" stroke="#1d4ed8" strokeWidth={2} strokeDasharray="3 3" name="Projected Savings" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="text-md font-semibold mb-3">Projected vs Actual Performance</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value + '-01');
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString()}`, 
                        name.includes('projected') ? name.replace('projected', 'Projected ') : 
                        name.includes('actual') ? name.replace('actual', 'Actual ') : name
                      ]}
                      labelFormatter={(label) => {
                        const date = new Date(label + '-01');
                        return `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Performance Comparison`;
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="projectedSavings" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} name="Projected Savings" />
                    <Line type="monotone" dataKey="actualSavings" stroke="#3b82f6" strokeWidth={3} name="Actual Savings" />
                    <Line type="monotone" dataKey="projectedIncome" stroke="#16a34a" strokeDasharray="3 3" strokeWidth={1} name="Projected Income" />
                    <Line type="monotone" dataKey="actualIncome" stroke="#22c55e" strokeWidth={2} name="Actual Income" />
                    <Line type="monotone" dataKey="projectedExpenses" stroke="#dc2626" strokeDasharray="3 3" strokeWidth={1} name="Projected Expenses" />
                    <Line type="monotone" dataKey="actualExpenses" stroke="#ef4444" strokeWidth={2} name="Actual Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No monthly check-in data available yet.</p>
              <p className="text-sm">Start tracking your monthly performance to see cash flow trends.</p>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Net Worth Progression */}
      <AccordionSection
        title="Net Worth Progression"
        subtitle="Long-term wealth building projection"
        icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
        isExpanded={expandedSections['net-worth']}
        onToggle={() => toggleSection('net-worth')}
        headerContent={
          <div className="text-right">
            <div className="text-lg font-semibold text-purple-600">
              ${netWorthData[0]?.netWorth?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-muted-foreground">Current Net Worth</div>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-semibold mb-3">5-Year Net Worth Projection</h4>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={netWorthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value + '-01');
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`, 
                    name === 'debt' ? 'Total Debt' : 
                    name === 'savings' ? 'Total Savings' : 
                    name === 'projectedBalance' ? 'Projected Net Worth' :
                    name === 'actualBalance' ? 'Actual Net Worth' : name
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label + '-01');
                    return `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Net Worth`;
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="debt" stackId="1" stroke="#ef4444" fill="#fecaca" name="Total Debt" />
                <Area type="monotone" dataKey="savings" stackId="2" stroke="#22c55e" fill="#bbf7d0" name="Total Savings" />
                <Line type="monotone" dataKey="projectedBalance" stroke="#8b5cf6" strokeWidth={3} name="Projected Net Worth" />
                {monthlyCheckIns.length > 0 && (
                  <Line type="monotone" dataKey="actualBalance" stroke="#7c3aed" strokeWidth={4} strokeDasharray="5 5" name="Actual Net Worth" />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg dark:bg-purple-950">
              <div className="text-2xl font-bold text-purple-600">
                ${netWorthData[netWorthData.length - 1]?.netWorth?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Projected Net Worth (5 years)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600">
                ${((netWorthData[netWorthData.length - 1]?.netWorth || 0) - (netWorthData[0]?.netWorth || 0)).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Growth</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg dark:bg-blue-950">
              <div className="text-2xl font-bold text-blue-600">
                {availableForSavings > 0 ? 
                  `${(((netWorthData[netWorthData.length - 1]?.netWorth || 0) / (netWorthData[0]?.netWorth || 1) - 1) * 100 / 5).toFixed(1)}%` : 
                  '0%'
                }
              </div>
              <div className="text-sm text-muted-foreground">Avg Annual Growth</div>
            </div>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}
