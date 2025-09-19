import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { useBudgetStore } from '@/stores/budgetStore';
import {
    Database,
    ExternalLink,
    Gift,
    Heart,
    Monitor,
    Moon,
    Palette,
    RotateCcw,
    Sun
} from 'lucide-react';
import { useState } from 'react';

export function SettingsPanel() {
  const { theme, setTheme, actualTheme } = useTheme();
  const { reset } = useBudgetStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleReset = async () => {
    try {
      // Reset the Zustand store
      reset();
      
      // If we have Electron API, also clear the database
      if (window.electronAPI) {
        // You might want to add a clearAllData method to your Electron API
        console.log('Clearing database data...');
        // await window.electronAPI.clearAllData();
      }
      
      console.log('All data has been reset');
      setShowResetDialog(false);
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const currentThemeOption = themeOptions.find(option => option.value === theme);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how ForgetFunds looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-select">Theme</Label>
            <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
              <SelectTrigger id="theme-select" className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {currentThemeOption && (
                      <>
                        <currentThemeOption.icon className="h-4 w-4" />
                        {currentThemeOption.label}
                        {theme === 'system' && (
                          <span className="text-xs text-muted-foreground">
                            ({actualTheme})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred theme. System will match your device's theme.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your budget data and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Reset All Data</Label>
            <p className="text-sm text-muted-foreground">
              This will permanently delete all your budget data including income, expenses, debts, and savings goals.
            </p>
            <Button 
              variant="destructive" 
              onClick={() => setShowResetDialog(true)}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Support Development
          </CardTitle>
          <CardDescription>
            Help support the continued development of ForgetFunds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              ForgetFunds is free and open-source. If you find it helpful, consider supporting its development.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.open('https://github.com/sponsors/forgetfunds', '_blank')}
                className="w-full"
              >
                <Heart className="mr-2 h-4 w-4 text-red-500" />
                Sponsor on GitHub
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://buymeacoffee.com/forgetfunds', '_blank')}
                className="w-full"
              >
                ☕ Buy me a coffee
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://paypal.me/forgetfunds', '_blank')}
                className="w-full"
              >
                💳 PayPal
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleReset}
        title="Reset All Data"
        description="Are you sure you want to reset all data? This action cannot be undone and will permanently delete all your budget information including income, expenses, debts, savings goals, and settings."
        confirmText="Reset All Data"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
