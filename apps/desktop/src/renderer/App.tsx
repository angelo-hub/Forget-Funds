import { AuthScreen } from '@/components/AuthScreen';
import { BudgetSystem } from '@/components/BudgetSystem';
import { ThemeProvider } from '@/contexts/ThemeContext';
// import { debugDataFlow } from '@/debug-data-flow'; // Disabled to prevent auto-overwrite of user data
import '@/index.css';
import { useBudgetStore } from '@/stores/budgetStore';
import { BudgetData } from '@forgetfunds/shared-types';
import { useEffect, useState } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Use Zustand store for budget data
  const { 
    budgetData, 
    isLoading, 
    setBudgetData, 
    setLoading
  } = useBudgetStore();

  useEffect(() => {
    checkAuthStatus();
    
    // Debug script disabled to prevent overwriting user data
    // To enable, uncomment the import above and this block
    // if (process.env.NODE_ENV === 'development') {
    //   (window as any).debugDataFlow = debugDataFlow;
    //   console.log('🔧 [App] Debug function available: call debugDataFlow() in console');
    // }
  }, []);

  const checkAuthStatus = async () => {
    console.log('🔐 [App] Checking authentication status...');
    try {
      if (window.electronAPI) {
        console.log('🔍 [App] Querying authentication status from backend...');
        const status = await window.electronAPI.checkAuthStatus();
        console.log('📋 [App] Auth status received:', status);
        
        if (!status.isLocked && status.isAuthenticated) {
          console.log('✅ [App] User is authenticated - loading data');
          setIsAuthenticated(true);
          await loadData();
        } else {
          console.log('🔐 [App] User needs to authenticate - showing auth screen');
          setLoading(false);
          // Auth screen will be shown by the render logic
        }
      } else {
        console.error('❌ [App] electronAPI not found!');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ [App] Failed to check auth status:', error);
      setLoading(false);
    }
  };

  const loadData = async () => {
    console.log('📂 [App] Loading budget data from SQLite...');
    try {
      if (window.electronAPI) {
        console.log('🔍 [App] Fetching data via Electron API...');
        const data = await window.electronAPI.getBudgetData();
        console.log('📊 [App] Data received from SQLite:', {
          income: data.income?.length || 0,
          recurringExpenses: data.recurringExpenses?.length || 0,
          oneTimeExpenses: data.oneTimeExpenses?.length || 0,
          debts: data.debts?.length || 0,
          installmentLoans: data.installmentLoans?.length || 0,
          savingsBuckets: data.savingsBuckets?.length || 0,
          checkingAccounts: data.checkingAccounts?.length || 0,
          monthlyCheckIns: data.monthlyCheckIns?.length || 0,
        });
        console.log('🔄 [App] Initializing Zustand store with SQLite data...');
        setBudgetData(data);
      }
    } catch (error) {
      console.error('❌ [App] Failed to load budget data:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('authenticate first')) {
        console.log('🔐 [App] Authentication error - user needs to log in');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Don't set fallback data - let user authenticate first
      console.log('⚠️ [App] Data loading failed, but not setting fallback data to preserve user data integrity');
      setLoading(false);
      return;
      
      // Fallback data disabled to prevent overwriting user data
      // Only uncomment this if you want demo data for development
      /*
      console.log('🔧 [App] Setting default fallback data...');
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
      */
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = async () => {
    console.log('🎉 [App] User authenticated successfully');
    setIsAuthenticated(true);
    setLoading(true);
    
    try {
      await loadData();
      console.log('✅ [App] Data loaded successfully after authentication');
    } catch (error) {
      console.error('❌ [App] Failed to load data after authentication:', error);
    }
  };

  useEffect(() => {
    // Set up menu event listeners only when authenticated
    if (isAuthenticated && window.electronAPI) {
      const handleMenuExport = () => {
        if (budgetData) {
          handleExport();
        }
      };

      const handleMenuImport = () => {
        handleImport();
      };

      // const handleAppLocked = () => {
      //   setIsAuthenticated(false);
      //   resetBudgetStore();
      // };

      window.electronAPI.onMenuExport(handleMenuExport);
      window.electronAPI.onMenuImport(handleMenuImport);
      // window.electronAPI.onAppLocked(handleAppLocked);

      // Cleanup listeners on unmount
      return () => {
        window.electronAPI.removeAllListeners('menu-export');
        window.electronAPI.removeAllListeners('menu-import');
        window.electronAPI.removeAllListeners('app-locked');
      };
    }
  }, [budgetData, isAuthenticated]);

  // Zustand store handles all data saving automatically
  // This function is no longer needed but kept for interface compatibility
  const saveBudgetData = async (_data: BudgetData) => {
    // No-op: Zustand store handles all data persistence
    console.log('ℹ️ [App] saveBudgetData called but Zustand handles persistence automatically');
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
      <ThemeProvider>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">
              Loading your budget data...
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </ThemeProvider>
    );
  }

  if (!budgetData) {
    return (
      <ThemeProvider>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <p className="text-destructive">Failed to load budget data</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BudgetSystem
        onDataChange={saveBudgetData}
        onExport={handleExport}
        onImport={handleImport}
      />
    </ThemeProvider>
  );
}

export default App;
