import { BudgetSystem } from '@/components/BudgetSystem';
import '@/index.css';
import { BudgetData } from '@/types/budget';
import { useEffect, useState } from 'react';

function App() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data from Electron store on startup
    const loadData = async () => {
      try {
        if (window.electronAPI) {
          const data = await window.electronAPI.getBudgetData();
          setBudgetData(data);
        }
      } catch (error) {
        console.error('Failed to load budget data:', error);
        // Set default data if loading fails
        setBudgetData({
          debts: [
            {
              id: 1,
              name: 'Credit Card',
              balance: 5000,
              apr: 18.99,
              minPayment: 150,
              type: 'revolving',
            },
          ],
          installmentLoans: [
            {
              id: 1,
              name: 'Car Lease',
              balance: 12000,
              monthlyPayment: 350,
              remainingMonths: 24,
              type: 'installment',
            },
          ],
          income: [
            { id: 1, source: 'Salary', amount: 4500, frequency: 'monthly' },
          ],
          recurringExpenses: [
            { id: 1, category: 'Rent', amount: 1200 },
            { id: 2, category: 'Utilities', amount: 150 },
            { id: 3, category: 'Groceries', amount: 400 },
          ],
          oneTimeExpenses: [
            { id: 1, description: 'Movers', amount: 800 },
            { id: 2, description: 'Security Deposit', amount: 1200 },
          ],
          savingsBuckets: [
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
          ],
          aiEstimations: {
            city: 'Austin',
            groceryEstimate: 0,
            entertainmentEstimate: 0,
            isEstimating: false,
            apiProvider: 'none',
          },
          surveyAnswers: {
            diningOutFrequency: 2,
            movieFrequency: 1,
            concertFrequency: 2,
            hasStreamingServices: true,
            gymMembership: false,
          },
          monthlyCheckIns: [],
          checkingAccounts: [],
          retirementAccounts: [],
          debtStrategy: 'avalanche',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up menu event listeners
    if (window.electronAPI) {
      const handleMenuExport = () => {
        if (budgetData) {
          handleExport();
        }
      };

      const handleMenuImport = () => {
        handleImport();
      };

      window.electronAPI.onMenuExport(handleMenuExport);
      window.electronAPI.onMenuImport(handleMenuImport);

      // Cleanup listeners on unmount
      return () => {
        window.electronAPI.removeAllListeners('menu-export');
        window.electronAPI.removeAllListeners('menu-import');
      };
    }
  }, [budgetData]);

  const saveBudgetData = async (data: BudgetData) => {
    setBudgetData(data);
    if (window.electronAPI) {
      try {
        await window.electronAPI.saveBudgetData(data);
      } catch (error) {
        console.error('Failed to save budget data:', error);
      }
    }
  };

  const handleExport = async () => {
    if (window.electronAPI && budgetData) {
      try {
        const result = await window.electronAPI.exportBudgetData();
        if (result.success) {
          // You could show a success message here
          console.log('Data exported successfully');
        } else if (!result.cancelled) {
          console.error('Export failed:', result.error);
        }
      } catch (error) {
        console.error('Export error:', error);
      }
    }
  };

  const handleImport = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.importBudgetData();
        if (result.success && result.data) {
          setBudgetData(result.data);
          console.log('Data imported successfully');
        } else if (!result.cancelled) {
          console.error('Import failed:', result.error);
        }
      } catch (error) {
        console.error('Import error:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">
            Loading your budget data...
          </p>
        </div>
      </div>
    );
  }

  if (!budgetData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive">Failed to load budget data</p>
        </div>
      </div>
    );
  }

  return (
    <BudgetSystem
      initialData={budgetData}
      onDataChange={saveBudgetData}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
}

export default App;
