import type {
  Debt,
  InstallmentLoan,
  RecurringExpense,
  SavingsBucket,
  SavingsFormula,
} from '@/types/budget';

interface CalculationContext {
  monthlyIncome: number;
  monthlyExpenses: number;
  recurringExpenses: RecurringExpense[];
  debts: Debt[];
  installmentLoans: InstallmentLoan[];
}

/**
 * Calculate dynamic savings targets based on formulas
 */
export function calculateDynamicTarget(
  bucket: SavingsBucket,
  context: CalculationContext
): number {
  if (!bucket.isDynamic || !bucket.dynamicFormula) {
    return bucket.target;
  }

  const formula = bucket.dynamicFormula;

  switch (formula.type) {
    case 'emergency_fund':
      return calculateEmergencyFund(formula, context);

    case 'percentage_income':
      return calculatePercentageIncome(formula, context);

    case 'percentage_expenses':
      return calculatePercentageExpenses(formula, context);

    case 'custom':
      return calculateCustomFormula(formula, context);

    default:
      return bucket.target;
  }
}

/**
 * Calculate emergency fund: X months of expenses
 */
function calculateEmergencyFund(
  formula: SavingsFormula,
  context: CalculationContext
): number {
  const months = formula.months || 3;
  let baseExpenses = context.monthlyExpenses;

  // If specific categories are specified, calculate based on those
  if (formula.includeCategories || formula.excludeCategories) {
    baseExpenses = calculateFilteredExpenses(
      formula,
      context.recurringExpenses
    );
  }

  return baseExpenses * months;
}

/**
 * Calculate percentage of monthly income
 */
function calculatePercentageIncome(
  formula: SavingsFormula,
  context: CalculationContext
): number {
  const percentage = formula.percentage || 0.1; // Default 10%
  return context.monthlyIncome * percentage;
}

/**
 * Calculate percentage of monthly expenses
 */
function calculatePercentageExpenses(
  formula: SavingsFormula,
  context: CalculationContext
): number {
  const percentage = formula.percentage || 0.1; // Default 10%
  let baseExpenses = context.monthlyExpenses;

  // If specific categories are specified, calculate based on those
  if (formula.includeCategories || formula.excludeCategories) {
    baseExpenses = calculateFilteredExpenses(
      formula,
      context.recurringExpenses
    );
  }

  return baseExpenses * percentage;
}

/**
 * Calculate custom formula (JavaScript expression)
 */
function calculateCustomFormula(
  formula: SavingsFormula,
  context: CalculationContext
): number {
  if (!formula.customExpression) {
    return 0;
  }

  try {
    // Create safe evaluation context
    const evalContext = {
      monthlyIncome: context.monthlyIncome,
      monthlyExpenses: context.monthlyExpenses,
      totalDebtPayments:
        context.debts.reduce((sum, debt) => sum + debt.minPayment, 0) +
        context.installmentLoans.reduce(
          (sum, loan) => sum + loan.monthlyPayment,
          0
        ),
      Math: Math, // Allow Math functions
    };

    // Simple and safe evaluation (in a real app, consider a proper expression parser)
    const result = Function(
      ...Object.keys(evalContext),
      `"use strict"; return (${formula.customExpression});`
    )(...Object.values(evalContext));

    return typeof result === 'number' && !isNaN(result)
      ? Math.max(0, result)
      : 0;
  } catch (error) {
    console.error('Error evaluating custom savings formula:', error);
    return 0;
  }
}

/**
 * Calculate expenses filtered by categories
 */
function calculateFilteredExpenses(
  formula: SavingsFormula,
  recurringExpenses: RecurringExpense[]
): number {
  let filteredExpenses = [...recurringExpenses];

  // Include only specific categories
  if (formula.includeCategories && formula.includeCategories.length > 0) {
    filteredExpenses = filteredExpenses.filter(expense =>
      formula.includeCategories!.some((category: string) =>
        expense.category.toLowerCase().includes(category.toLowerCase())
      )
    );
  }

  // Exclude specific categories
  if (formula.excludeCategories && formula.excludeCategories.length > 0) {
    filteredExpenses = filteredExpenses.filter(
      expense =>
        !formula.excludeCategories!.some((category: string) =>
          expense.category.toLowerCase().includes(category.toLowerCase())
        )
    );
  }

  return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Update all savings buckets with computed dynamic targets
 */
export function updateSavingsBucketsWithDynamicTargets(
  buckets: SavingsBucket[],
  context: CalculationContext
): SavingsBucket[] {
  return buckets.map(bucket => {
    if (bucket.isDynamic) {
      const computedTarget = calculateDynamicTarget(bucket, context);
      return {
        ...bucket,
        computedTarget,
        // Update the target to the computed value for display purposes
        target: computedTarget,
      };
    }
    return {
      ...bucket,
      computedTarget: bucket.target,
    };
  });
}

/**
 * Get preset formulas for common savings goals
 */
export function getPresetFormulas(): {
  name: string;
  formula: SavingsFormula;
}[] {
  return [
    {
      name: '3-Month Emergency Fund',
      formula: {
        type: 'emergency_fund',
        months: 3,
        description: '3 months of total expenses',
      },
    },
    {
      name: '6-Month Emergency Fund',
      formula: {
        type: 'emergency_fund',
        months: 6,
        description: '6 months of total expenses',
      },
    },
    {
      name: 'Essential Emergency Fund (3 months)',
      formula: {
        type: 'emergency_fund',
        months: 3,
        excludeCategories: [
          'entertainment',
          'dining',
          'hobbies',
          'subscription',
        ],
        description: '3 months of essential expenses only',
      },
    },
    {
      name: '10% of Income',
      formula: {
        type: 'percentage_income',
        percentage: 0.1,
        description: '10% of monthly income',
      },
    },
    {
      name: '20% of Income',
      formula: {
        type: 'percentage_income',
        percentage: 0.2,
        description: '20% of monthly income',
      },
    },
    {
      name: 'Vacation Fund (15% of Income)',
      formula: {
        type: 'percentage_income',
        percentage: 0.15,
        description: '15% of monthly income for vacation',
      },
    },
    {
      name: 'House Down Payment (20% of Income)',
      formula: {
        type: 'percentage_income',
        percentage: 0.2,
        description: '20% of monthly income for house down payment',
      },
    },
    {
      name: 'Car Replacement Fund',
      formula: {
        type: 'custom',
        customExpression: 'Math.max(monthlyIncome * 0.15, 300)',
        description: 'At least $300 or 15% of income for car replacement',
      },
    },
    {
      name: 'Annual Vacation Budget',
      formula: {
        type: 'custom',
        customExpression: 'monthlyIncome * 0.08 * 12',
        description: '8% of annual income for vacation',
      },
    },
    {
      name: 'Medical Emergency Fund',
      formula: {
        type: 'custom',
        customExpression: 'Math.max(monthlyExpenses * 1, 2500)',
        description:
          'At least $2,500 or 1 month expenses for medical emergencies',
      },
    },
  ];
}

/**
 * Format formula description for display
 */
export function formatFormulaDescription(
  formula: SavingsFormula,
  context: CalculationContext
): string {
  switch (formula.type) {
    case 'emergency_fund':
      const months = formula.months || 3;
      const baseAmount =
        formula.includeCategories || formula.excludeCategories
          ? calculateFilteredExpenses(formula, context.recurringExpenses)
          : context.monthlyExpenses;
      return `${months} months × $${baseAmount.toLocaleString()} = $${(baseAmount * months).toLocaleString()}`;

    case 'percentage_income':
      const incomePercentage = (formula.percentage || 0.1) * 100;
      return `${incomePercentage}% of $${context.monthlyIncome.toLocaleString()} = $${(context.monthlyIncome * (formula.percentage || 0.1)).toLocaleString()}`;

    case 'percentage_expenses':
      const expensePercentage = (formula.percentage || 0.1) * 100;
      const expenseBase =
        formula.includeCategories || formula.excludeCategories
          ? calculateFilteredExpenses(formula, context.recurringExpenses)
          : context.monthlyExpenses;
      return `${expensePercentage}% of $${expenseBase.toLocaleString()} = $${(expenseBase * (formula.percentage || 0.1)).toLocaleString()}`;

    case 'custom':
      return (
        formula.description || formula.customExpression || 'Custom calculation'
      );

    default:
      return 'Fixed amount';
  }
}
