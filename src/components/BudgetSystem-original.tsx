import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  MinusCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  PieChart,
  Download,
  Upload,
  Target,
  Zap,
  Bot,
  MapPin,
  Coffee,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from 'recharts';

const BudgetSystem = () => {
  // State for debts
  const [debts, setDebts] = useState([
    {
      id: 1,
      name: 'Credit Card',
      balance: 5000,
      apr: 18.99,
      minPayment: 150,
      type: 'revolving',
    },
  ]);

  // State for installment loans
  const [installmentLoans, setInstallmentLoans] = useState([
    {
      id: 1,
      name: 'Car Lease',
      balance: 12000,
      monthlyPayment: 350,
      remainingMonths: 24,
      type: 'installment',
    },
  ]);

  // State for income
  const [income, setIncome] = useState([
    { id: 1, source: 'Salary', amount: 4500, frequency: 'monthly' },
  ]);

  // State for recurring expenses
  const [recurringExpenses, setRecurringExpenses] = useState([
    { id: 1, category: 'Rent', amount: 1200 },
    { id: 2, category: 'Utilities', amount: 150 },
    { id: 3, category: 'Groceries', amount: 400 },
  ]);

  // State for one-time expenses
  const [oneTimeExpenses, setOneTimeExpenses] = useState([
    { id: 1, description: 'Movers', amount: 800 },
    { id: 2, description: 'Security Deposit', amount: 1200 },
  ]);

  // Enhanced savings goals with categories
  const [savingsBuckets, setSavingsBuckets] = useState([
    {
      id: 1,
      name: 'Emergency Fund',
      target: 6000,
      current: 500,
      category: 'Emergency',
      priority: 1,
    },
    {
      id: 2,
      name: 'Vacation Fund',
      target: 3000,
      current: 200,
      category: 'Lifestyle',
      priority: 2,
    },
    {
      id: 3,
      name: 'House Down Payment',
      target: 50000,
      current: 5000,
      category: 'Investment',
      priority: 1,
    },
  ]);

  // AI estimation state
  const [aiEstimations, setAiEstimations] = useState({
    city: 'Austin',
    groceryEstimate: 0,
    entertainmentEstimate: 0,
    isEstimating: false,
  });

  // Survey questions state
  const [surveyAnswers, setSurveyAnswers] = useState({
    diningOutFrequency: 2,
    movieFrequency: 1,
    concertFrequency: 2,
    hasStreamingServices: true,
    gymMembership: false,
  });

  const [debtStrategy, setDebtStrategy] = useState('avalanche');
  const [activeTab, setActiveTab] = useState('overview');

  // Colors for charts
  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#82CA9D',
  ];

  // Helper functions for CRUD operations
  const addDebt = () => {
    const newId = Math.max(...debts.map(d => d.id), 0) + 1;
    setDebts([
      ...debts,
      {
        id: newId,
        name: '',
        balance: 0,
        apr: 0,
        minPayment: 0,
        type: 'revolving',
      },
    ]);
  };

  const updateDebt = (id, field, value) => {
    setDebts(
      debts.map(debt => (debt.id === id ? { ...debt, [field]: value } : debt))
    );
  };

  const removeDebt = id => {
    setDebts(debts.filter(debt => debt.id !== id));
  };

  const addInstallmentLoan = () => {
    const newId = Math.max(...installmentLoans.map(l => l.id), 0) + 1;
    setInstallmentLoans([
      ...installmentLoans,
      {
        id: newId,
        name: '',
        balance: 0,
        monthlyPayment: 0,
        remainingMonths: 0,
        type: 'installment',
      },
    ]);
  };

  const updateInstallmentLoan = (id, field, value) => {
    setInstallmentLoans(
      installmentLoans.map(loan =>
        loan.id === id ? { ...loan, [field]: value } : loan
      )
    );
  };

  const removeInstallmentLoan = id => {
    setInstallmentLoans(installmentLoans.filter(loan => loan.id !== id));
  };

  const addIncome = () => {
    const newId = Math.max(...income.map(i => i.id), 0) + 1;
    setIncome([
      ...income,
      { id: newId, source: '', amount: 0, frequency: 'monthly' },
    ]);
  };

  const updateIncome = (id, field, value) => {
    setIncome(
      income.map(inc => (inc.id === id ? { ...inc, [field]: value } : inc))
    );
  };

  const addRecurringExpense = () => {
    const newId = Math.max(...recurringExpenses.map(e => e.id), 0) + 1;
    setRecurringExpenses([
      ...recurringExpenses,
      { id: newId, category: '', amount: 0 },
    ]);
  };

  const updateRecurringExpense = (id, field, value) => {
    setRecurringExpenses(
      recurringExpenses.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const addOneTimeExpense = () => {
    const newId = Math.max(...oneTimeExpenses.map(e => e.id), 0) + 1;
    setOneTimeExpenses([
      ...oneTimeExpenses,
      { id: newId, description: '', amount: 0 },
    ]);
  };

  const updateOneTimeExpense = (id, field, value) => {
    setOneTimeExpenses(
      oneTimeExpenses.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const addSavingsBucket = () => {
    const newId = Math.max(...savingsBuckets.map(g => g.id), 0) + 1;
    setSavingsBuckets([
      ...savingsBuckets,
      {
        id: newId,
        name: '',
        target: 0,
        current: 0,
        category: 'General',
        priority: 1,
      },
    ]);
  };

  const updateSavingsBucket = (id, field, value) => {
    setSavingsBuckets(
      savingsBuckets.map(bucket =>
        bucket.id === id ? { ...bucket, [field]: value } : bucket
      )
    );
  };

  // AI Estimation Functions (Simulated)
  const estimateGroceries = async () => {
    setAiEstimations(prev => ({ ...prev, isEstimating: true }));

    // Simulate AI call with realistic estimation based on city
    await new Promise(resolve => setTimeout(resolve, 2000));

    const cityMultipliers = {
      Austin: 1.0,
      'New York': 1.4,
      'San Francisco': 1.5,
      Chicago: 1.1,
      Atlanta: 0.9,
      Dallas: 0.95,
      'Los Angeles': 1.3,
      Miami: 1.2,
    };

    const baseGrocery = 350;
    const multiplier = cityMultipliers[aiEstimations.city] || 1.0;
    const estimate = Math.round(baseGrocery * multiplier);

    setAiEstimations(prev => ({
      ...prev,
      groceryEstimate: estimate,
      isEstimating: false,
    }));
  };

  const estimateEntertainment = async () => {
    setAiEstimations(prev => ({ ...prev, isEstimating: true }));

    // Simulate AI call
    await new Promise(resolve => setTimeout(resolve, 2000));

    let entertainment = 0;

    // Dining out
    entertainment += surveyAnswers.diningOutFrequency * 45; // $45 per meal

    // Movies
    entertainment += surveyAnswers.movieFrequency * 15; // $15 per ticket

    // Concerts
    entertainment += (surveyAnswers.concertFrequency / 12) * 80; // $80 per concert, monthly average

    // Streaming services
    if (surveyAnswers.hasStreamingServices) {
      entertainment += 45; // Multiple streaming services
    }

    // Gym membership
    if (surveyAnswers.gymMembership) {
      entertainment += 50;
    }

    setAiEstimations(prev => ({
      ...prev,
      entertainmentEstimate: Math.round(entertainment),
      isEstimating: false,
    }));
  };

  const applyAIEstimates = () => {
    if (aiEstimations.groceryEstimate > 0) {
      const groceryExpense = recurringExpenses.find(e =>
        e.category.toLowerCase().includes('grocer')
      );
      if (groceryExpense) {
        updateRecurringExpense(
          groceryExpense.id,
          'amount',
          aiEstimations.groceryEstimate
        );
      } else {
        const newId = Math.max(...recurringExpenses.map(e => e.id), 0) + 1;
        setRecurringExpenses([
          ...recurringExpenses,
          {
            id: newId,
            category: 'Groceries (AI Estimated)',
            amount: aiEstimations.groceryEstimate,
          },
        ]);
      }
    }

    if (aiEstimations.entertainmentEstimate > 0) {
      const entertainmentExpense = recurringExpenses.find(e =>
        e.category.toLowerCase().includes('entertainment')
      );
      if (entertainmentExpense) {
        updateRecurringExpense(
          entertainmentExpense.id,
          'amount',
          aiEstimations.entertainmentEstimate
        );
      } else {
        const newId = Math.max(...recurringExpenses.map(e => e.id), 0) + 1;
        setRecurringExpenses([
          ...recurringExpenses,
          {
            id: newId,
            category: 'Entertainment (AI Estimated)',
            amount: aiEstimations.entertainmentEstimate,
          },
        ]);
      }
    }
  };

  // Import/Export functions
  const exportData = () => {
    const data = {
      debts,
      installmentLoans,
      income,
      recurringExpenses,
      oneTimeExpenses,
      savingsBuckets,
      aiEstimations,
      surveyAnswers,
      debtStrategy,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `budget-data-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.debts) setDebts(data.debts);
          if (data.installmentLoans) setInstallmentLoans(data.installmentLoans);
          if (data.income) setIncome(data.income);
          if (data.recurringExpenses)
            setRecurringExpenses(data.recurringExpenses);
          if (data.oneTimeExpenses) setOneTimeExpenses(data.oneTimeExpenses);
          if (data.savingsBuckets) setSavingsBuckets(data.savingsBuckets);
          if (data.aiEstimations) setAiEstimations(data.aiEstimations);
          if (data.surveyAnswers) setSurveyAnswers(data.surveyAnswers);
          if (data.debtStrategy) setDebtStrategy(data.debtStrategy);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Calculations
  const totalMonthlyIncome = income.reduce((sum, inc) => {
    const multiplier =
      inc.frequency === 'weekly'
        ? 4.33
        : inc.frequency === 'biweekly'
          ? 2.17
          : 1;
    return sum + inc.amount * multiplier;
  }, 0);

  const totalDebtPayments = debts.reduce(
    (sum, debt) => sum + debt.minPayment,
    0
  );
  const totalInstallmentPayments = installmentLoans.reduce(
    (sum, loan) => sum + loan.monthlyPayment,
    0
  );
  const totalRecurringExpenses = recurringExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );
  const totalOneTimeExpenses = oneTimeExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const monthlyExpenses =
    totalDebtPayments + totalInstallmentPayments + totalRecurringExpenses;
  const availableForSavings = totalMonthlyIncome - monthlyExpenses;

  const totalDebtBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalInstallmentBalance = installmentLoans.reduce(
    (sum, loan) => sum + loan.balance,
    0
  );

  // Generate debt burndown chart data
  const generateDebtBurndownData = () => {
    const data = [];
    let currentBalance = totalDebtBalance;
    const monthlyPayment = totalDebtPayments;
    const avgAPR =
      debts.length > 0
        ? debts.reduce((sum, debt) => sum + debt.apr, 0) / debts.length
        : 0;

    for (let month = 0; month <= 60 && currentBalance > 0; month++) {
      data.push({
        month,
        balance: Math.max(0, currentBalance),
        payment: monthlyPayment,
      });

      const monthlyInterest = (currentBalance * (avgAPR / 100)) / 12;
      currentBalance = currentBalance + monthlyInterest - monthlyPayment;
    }

    return data;
  };

  // Generate savings projection data
  const generateSavingsProjectionData = () => {
    const data = [];
    const monthlySavings = Math.max(0, availableForSavings);
    let cumulativeSavings = savingsBuckets.reduce(
      (sum, bucket) => sum + bucket.current,
      0
    );

    for (let month = 0; month <= 60; month++) {
      data.push({
        month,
        savings: cumulativeSavings,
        target: savingsBuckets.reduce((sum, bucket) => sum + bucket.target, 0),
      });

      cumulativeSavings += monthlySavings;
    }

    return data;
  };

  // Advanced debt calculations
  const debtInterestCalculations = debts.map(debt => ({
    ...debt,
    monthlyInterest: (debt.balance * (debt.apr / 100)) / 12,
    payoffTime:
      debt.minPayment > 0
        ? Math.ceil(
            -Math.log(
              1 - (debt.balance * debt.apr) / 100 / 12 / debt.minPayment
            ) / Math.log(1 + debt.apr / 100 / 12)
          )
        : 0,
    totalInterest:
      debt.minPayment > 0
        ? debt.minPayment *
            Math.ceil(
              -Math.log(
                1 - (debt.balance * debt.apr) / 100 / 12 / debt.minPayment
              ) / Math.log(1 + debt.apr / 100 / 12)
            ) -
          debt.balance
        : 0,
  }));

  // Group savings buckets by category
  const savingsByCategory = savingsBuckets.reduce((acc, bucket) => {
    if (!acc[bucket.category]) {
      acc[bucket.category] = { current: 0, target: 0, buckets: [] };
    }
    acc[bucket.category].current += bucket.current;
    acc[bucket.category].target += bucket.target;
    acc[bucket.category].buckets.push(bucket);
    return acc;
  }, {});

  // Prepare pie chart data
  const expensePieData = [
    { name: 'Debt Payments', value: totalDebtPayments, color: '#FF8042' },
    {
      name: 'Installment Loans',
      value: totalInstallmentPayments,
      color: '#FFBB28',
    },
    {
      name: 'Recurring Expenses',
      value: totalRecurringExpenses,
      color: '#00C49F',
    },
    {
      name: 'Available Savings',
      value: Math.max(0, availableForSavings),
      color: '#0088FE',
    },
  ].filter(item => item.value > 0);

  // Tab navigation component
  const TabButton = ({ tabId, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        activeTab === tabId
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </button>
  );

  const debtBurndownData = generateDebtBurndownData();
  const savingsProjectionData = generateSavingsProjectionData();

  return (
    <div className="mx-auto min-h-screen max-w-7xl bg-gray-50 p-6">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Advanced Budget & Debt Management
            </h1>
            <p className="text-gray-600">
              AI-powered financial planning with comprehensive tracking
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportData}
              className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </button>
            <label className="flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
              <Upload className="mr-2 h-4 w-4" />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex flex-wrap space-x-2">
          <TabButton tabId="overview" label="Dashboard" icon={PieChart} />
          <TabButton tabId="income" label="Income" icon={TrendingUp} />
          <TabButton tabId="expenses" label="Expenses" icon={TrendingDown} />
          <TabButton tabId="debts" label="Debts" icon={Calculator} />
          <TabButton
            tabId="loans"
            label="Installment Loans"
            icon={DollarSign}
          />
          <TabButton tabId="savings" label="Savings Buckets" icon={Target} />
          <TabButton tabId="ai-assistant" label="AI Assistant" icon={Bot} />
          <TabButton tabId="charts" label="Analytics" icon={Zap} />
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Monthly Income
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalMonthlyIncome.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Monthly Expenses
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    ${monthlyExpenses.toFixed(2)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Available for Savings
                  </p>
                  <p
                    className={`text-2xl font-bold ${availableForSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    ${availableForSavings.toFixed(2)}
                  </p>
                </div>
                <DollarSign
                  className={`h-8 w-8 ${availableForSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Debt
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${(totalDebtBalance + totalInstallmentBalance).toFixed(2)}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Quick Overview Charts */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Monthly Budget Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value}`}
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => [`$${value}`, 'Amount']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Savings by Category
              </h3>
              <div className="space-y-4">
                {Object.entries(savingsByCategory).map(([category, data]) => {
                  const progress =
                    data.target > 0 ? (data.current / data.target) * 100 : 0;
                  return (
                    <div key={category}>
                      <div className="mb-1 flex justify-between text-sm font-medium text-gray-700">
                        <span>{category}</span>
                        <span>
                          ${data.current.toFixed(0)} / ${data.target.toFixed(0)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {progress.toFixed(1)}% complete
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Financial Health Overview */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Financial Health Overview
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 font-medium text-blue-900">
                  Monthly Surplus
                </h3>
                <p
                  className={`text-2xl font-bold ${availableForSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  ${availableForSavings.toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {availableForSavings >= 0
                    ? 'Available for savings and investments'
                    : 'Budget deficit - reduce expenses'}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <h3 className="mb-2 font-medium text-green-900">
                  Emergency Fund Goal
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  ${(monthlyExpenses * 3).toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  3 months of expenses
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <h3 className="mb-2 font-medium text-purple-900">
                  Total Debt-to-Income
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {totalMonthlyIncome > 0
                    ? (
                        ((totalDebtPayments + totalInstallmentPayments) /
                          totalMonthlyIncome) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {totalMonthlyIncome > 0 &&
                  (totalDebtPayments + totalInstallmentPayments) /
                    totalMonthlyIncome <
                    0.36
                    ? 'Healthy ratio'
                    : 'Consider debt reduction'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ai-assistant' && (
        <div className="space-y-6">
          {/* Location Input */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Location-Based Estimates
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Your City
                </label>
                <select
                  value={aiEstimations.city}
                  onChange={e =>
                    setAiEstimations(prev => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Austin">Austin, TX</option>
                  <option value="New York">New York, NY</option>
                  <option value="San Francisco">San Francisco, CA</option>
                  <option value="Chicago">Chicago, IL</option>
                  <option value="Atlanta">Atlanta, GA</option>
                  <option value="Dallas">Dallas, TX</option>
                  <option value="Los Angeles">Los Angeles, CA</option>
                  <option value="Miami">Miami, FL</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={estimateGroceries}
                  disabled={aiEstimations.isEstimating}
                  className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  {aiEstimations.isEstimating
                    ? 'Estimating...'
                    : 'Estimate Groceries'}
                </button>
              </div>
            </div>
            {aiEstimations.groceryEstimate > 0 && (
              <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="text-blue-800">
                  AI estimates your monthly grocery budget at{' '}
                  <strong>${aiEstimations.groceryEstimate}</strong> for{' '}
                  {aiEstimations.city}.
                </p>
              </div>
            )}
          </div>

          {/* Entertainment Survey */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center">
              <Coffee className="mr-2 h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Entertainment & Lifestyle Survey
              </h2>
            </div>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Dining out per week
                </label>
                <input
                  type="number"
                  value={surveyAnswers.diningOutFrequency}
                  onChange={e =>
                    setSurveyAnswers(prev => ({
                      ...prev,
                      diningOutFrequency: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Movies per month
                </label>
                <input
                  type="number"
                  value={surveyAnswers.movieFrequency}
                  onChange={e =>
                    setSurveyAnswers(prev => ({
                      ...prev,
                      movieFrequency: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Concerts/events per year
                </label>
                <input
                  type="number"
                  value={surveyAnswers.concertFrequency}
                  onChange={e =>
                    setSurveyAnswers(prev => ({
                      ...prev,
                      concertFrequency: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={surveyAnswers.hasStreamingServices}
                    onChange={e =>
                      setSurveyAnswers(prev => ({
                        ...prev,
                        hasStreamingServices: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Multiple streaming services
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={surveyAnswers.gymMembership}
                    onChange={e =>
                      setSurveyAnswers(prev => ({
                        ...prev,
                        gymMembership: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Gym membership
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={estimateEntertainment}
                disabled={aiEstimations.isEstimating}
                className="flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Bot className="mr-2 h-4 w-4" />
                {aiEstimations.isEstimating
                  ? 'Estimating...'
                  : 'Estimate Entertainment'}
              </button>

              {(aiEstimations.groceryEstimate > 0 ||
                aiEstimations.entertainmentEstimate > 0) && (
                <button
                  onClick={applyAIEstimates}
                  className="flex items-center rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                >
                  Apply Estimates
                </button>
              )}
            </div>

            {aiEstimations.entertainmentEstimate > 0 && (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
                <p className="text-green-800">
                  AI estimates your monthly entertainment budget at{' '}
                  <strong>${aiEstimations.entertainmentEstimate}</strong> based
                  on your lifestyle preferences.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Debt Burndown Chart */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Debt Burndown Projection
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={debtBurndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  label={{
                    value: 'Months',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: 'Balance ($)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  formatter={value => [`${value.toFixed(2)}`, 'Balance']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#FF8042"
                  strokeWidth={2}
                  name="Debt Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Savings Projection Chart */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Savings Growth Projection
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={savingsProjectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  label={{
                    value: 'Months',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: 'Amount ($)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  formatter={value => [`${value.toFixed(2)}`, 'Amount']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#0088FE"
                  strokeWidth={2}
                  name="Projected Savings"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#00C49F"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Savings Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Debt vs Savings Strategy Chart */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Monthly Cash Flow
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    category: 'Income',
                    amount: totalMonthlyIncome,
                    color: '#00C49F',
                  },
                  {
                    category: 'Debt Payments',
                    amount: -totalDebtPayments,
                    color: '#FF8042',
                  },
                  {
                    category: 'Loan Payments',
                    amount: -totalInstallmentPayments,
                    color: '#FFBB28',
                  },
                  {
                    category: 'Expenses',
                    amount: -totalRecurringExpenses,
                    color: '#8884D8',
                  },
                  {
                    category: 'Net Available',
                    amount: availableForSavings,
                    color: availableForSavings >= 0 ? '#0088FE' : '#FF0000',
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis
                  label={{
                    value: 'Amount ($)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  formatter={value => [
                    `${Math.abs(value).toFixed(2)}`,
                    value >= 0 ? 'Income' : 'Expense',
                  ]}
                />
                <Bar dataKey="amount" fill="#8884d8">
                  {[
                    {
                      category: 'Income',
                      amount: totalMonthlyIncome,
                      color: '#00C49F',
                    },
                    {
                      category: 'Debt Payments',
                      amount: -totalDebtPayments,
                      color: '#FF8042',
                    },
                    {
                      category: 'Loan Payments',
                      amount: -totalInstallmentPayments,
                      color: '#FFBB28',
                    },
                    {
                      category: 'Expenses',
                      amount: -totalRecurringExpenses,
                      color: '#8884D8',
                    },
                    {
                      category: 'Net Available',
                      amount: availableForSavings,
                      color: availableForSavings >= 0 ? '#0088FE' : '#FF0000',
                    },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Income Sources
              </h2>
              <button
                onClick={addIncome}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="mr-1 h-5 w-5" />
                Add Income
              </button>
            </div>
          </div>
          <div className="p-6">
            {income.map(inc => (
              <div key={inc.id} className="mb-3 grid grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder="Income source"
                  value={inc.source}
                  onChange={e => updateIncome(inc.id, 'source', e.target.value)}
                  className="col-span-5 rounded-md border border-gray-300 px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={inc.amount}
                  onChange={e =>
                    updateIncome(
                      inc.id,
                      'amount',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="col-span-3 rounded-md border border-gray-300 px-3 py-2"
                />
                <select
                  value={inc.frequency}
                  onChange={e =>
                    updateIncome(inc.id, 'frequency', e.target.value)
                  }
                  className="col-span-3 rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <button
                  onClick={() => setIncome(income.filter(i => i.id !== inc.id))}
                  className="col-span-1 text-red-600"
                >
                  <MinusCircle className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white shadow">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recurring Monthly Expenses
                </h2>
                <button
                  onClick={addRecurringExpense}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <PlusCircle className="mr-1 h-5 w-5" />
                  Add Expense
                </button>
              </div>
            </div>
            <div className="p-6">
              {recurringExpenses.map(expense => (
                <div key={expense.id} className="mb-3 grid grid-cols-12 gap-3">
                  <input
                    type="text"
                    placeholder="Category"
                    value={expense.category}
                    onChange={e =>
                      updateRecurringExpense(
                        expense.id,
                        'category',
                        e.target.value
                      )
                    }
                    className="col-span-7 rounded-md border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={expense.amount}
                    onChange={e =>
                      updateRecurringExpense(
                        expense.id,
                        'amount',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="col-span-4 rounded-md border border-gray-300 px-3 py-2"
                  />
                  <button
                    onClick={() =>
                      setRecurringExpenses(
                        recurringExpenses.filter(e => e.id !== expense.id)
                      )
                    }
                    className="col-span-1 text-red-600"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white shadow">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  One-time Moving Expenses
                </h2>
                <button
                  onClick={addOneTimeExpense}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <PlusCircle className="mr-1 h-5 w-5" />
                  Add Expense
                </button>
              </div>
              <p className="mt-1 px-6 text-sm text-gray-600">
                Total: ${totalOneTimeExpenses.toFixed(2)} (not included in
                monthly budget)
              </p>
            </div>
            <div className="p-6">
              {oneTimeExpenses.map(expense => (
                <div key={expense.id} className="mb-3 grid grid-cols-12 gap-3">
                  <input
                    type="text"
                    placeholder="Description"
                    value={expense.description}
                    onChange={e =>
                      updateOneTimeExpense(
                        expense.id,
                        'description',
                        e.target.value
                      )
                    }
                    className="col-span-7 rounded-md border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={expense.amount}
                    onChange={e =>
                      updateOneTimeExpense(
                        expense.id,
                        'amount',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="col-span-4 rounded-md border border-gray-300 px-3 py-2"
                  />
                  <button
                    onClick={() =>
                      setOneTimeExpenses(
                        oneTimeExpenses.filter(e => e.id !== expense.id)
                      )
                    }
                    className="col-span-1 text-red-600"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Revolving Debts (Credit Cards, Lines of Credit)
              </h2>
              <button
                onClick={addDebt}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="mr-1 h-5 w-5" />
                Add Debt
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Total Debt: ${totalDebtBalance.toFixed(2)}
            </p>
          </div>
          <div className="p-6">
            {debts.map(debt => {
              const calculation = debtInterestCalculations.find(
                d => d.id === debt.id
              );
              return (
                <div
                  key={debt.id}
                  className="mb-4 rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Debt name"
                      value={debt.name}
                      onChange={e =>
                        updateDebt(debt.id, 'name', e.target.value)
                      }
                      className="rounded-md border border-gray-300 px-3 py-2"
                    />
                    <button
                      onClick={() => removeDebt(debt.id)}
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mb-2 grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        Balance
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={debt.balance}
                        onChange={e =>
                          updateDebt(
                            debt.id,
                            'balance',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        APR (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={debt.apr}
                        onChange={e =>
                          updateDebt(
                            debt.id,
                            'apr',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        Min Payment
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={debt.minPayment}
                        onChange={e =>
                          updateDebt(
                            debt.id,
                            'minPayment',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  {calculation && (
                    <div className="rounded bg-gray-50 p-2 text-xs text-gray-600">
                      Monthly Interest: $
                      {calculation.monthlyInterest.toFixed(2)} | Payoff Time:{' '}
                      {calculation.payoffTime > 0
                        ? `${calculation.payoffTime} months`
                        : 'N/A'}{' '}
                      | Total Interest: ${calculation.totalInterest.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Installment Loans (Car Loans, Leases, Personal Loans)
              </h2>
              <button
                onClick={addInstallmentLoan}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="mr-1 h-5 w-5" />
                Add Loan
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Total Loan Balance: ${totalInstallmentBalance.toFixed(2)}
            </p>
          </div>
          <div className="p-6">
            {installmentLoans.map(loan => (
              <div
                key={loan.id}
                className="mb-4 rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Loan name (e.g., Car Lease, Personal Loan)"
                    value={loan.name}
                    onChange={e =>
                      updateInstallmentLoan(loan.id, 'name', e.target.value)
                    }
                    className="rounded-md border border-gray-300 px-3 py-2"
                  />
                  <button
                    onClick={() => removeInstallmentLoan(loan.id)}
                    className="text-sm text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <div className="mb-2 grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">
                      Remaining Balance
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={loan.balance}
                      onChange={e =>
                        updateInstallmentLoan(
                          loan.id,
                          'balance',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">
                      Monthly Payment
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={loan.monthlyPayment}
                      onChange={e =>
                        updateInstallmentLoan(
                          loan.id,
                          'monthlyPayment',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">
                      Remaining Months
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={loan.remainingMonths}
                      onChange={e =>
                        updateInstallmentLoan(
                          loan.id,
                          'remainingMonths',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="rounded bg-gray-50 p-2 text-xs text-gray-600">
                  Total Remaining Payments: $
                  {(loan.monthlyPayment * loan.remainingMonths).toFixed(2)} |
                  Payoff Date:{' '}
                  {loan.remainingMonths > 0
                    ? new Date(
                        Date.now() +
                          loan.remainingMonths * 30 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'savings' && (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Savings Buckets by Category
              </h2>
              <button
                onClick={addSavingsBucket}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="mr-1 h-5 w-5" />
                Add Savings Goal
              </button>
            </div>
          </div>
          <div className="p-6">
            {savingsBuckets.map(bucket => {
              const progress =
                bucket.target > 0 ? (bucket.current / bucket.target) * 100 : 0;
              const timeToComplete =
                availableForSavings > 0
                  ? Math.ceil(
                      (bucket.target - bucket.current) /
                        (availableForSavings * 0.3)
                    )
                  : 0;

              return (
                <div
                  key={bucket.id}
                  className="mb-4 rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Savings goal name"
                      value={bucket.name}
                      onChange={e =>
                        updateSavingsBucket(bucket.id, 'name', e.target.value)
                      }
                      className="rounded-md border border-gray-300 px-3 py-2"
                    />
                    <button
                      onClick={() =>
                        setSavingsBuckets(
                          savingsBuckets.filter(g => g.id !== bucket.id)
                        )
                      }
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mb-3 grid grid-cols-4 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        Category
                      </label>
                      <select
                        value={bucket.category}
                        onChange={e =>
                          updateSavingsBucket(
                            bucket.id,
                            'category',
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="Emergency">Emergency</option>
                        <option value="Investment">Investment</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Education">Education</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        Target Amount
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={bucket.target}
                        onChange={e =>
                          updateSavingsBucket(
                            bucket.id,
                            'target',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        Current Amount
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={bucket.current}
                        onChange={e =>
                          updateSavingsBucket(
                            bucket.id,
                            'current',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        Priority
                      </label>
                      <select
                        value={bucket.priority}
                        onChange={e =>
                          updateSavingsBucket(
                            bucket.id,
                            'priority',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value={1}>High</option>
                        <option value={2}>Medium</option>
                        <option value={3}>Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="rounded bg-gray-50 p-3">
                    <div className="mb-1 flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}% complete</span>
                    </div>
                    <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {timeToComplete > 0 && timeToComplete < 1000
                        ? `Estimated completion: ${timeToComplete} months at current savings rate`
                        : 'Adjust savings allocation to see completion estimate'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSystem;
