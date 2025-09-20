import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Key, Lock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

interface AuthStatus {
  isLocked: boolean;
  isAuthenticated: boolean;
  hasLegacyData: boolean;
  isPinConfigured: boolean;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<any>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.checkAuthStatus();
        setAuthStatus(status);
        if (!status.isLocked && status.isAuthenticated) {
          onAuthenticated();
        }
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setError('Failed to check authentication status');
    }
  };

  const validatePassword = async (pwd: string) => {
    if (window.electronAPI && pwd.length > 0) {
      const validation = await window.electronAPI.validatePassword(pwd);
      setPasswordValidation(validation);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.unlockWithPassword(password);
        if (result.success) {
          if (result.isNewDatabase) {
            setSetupMode(true);
            setError('');
          } else {
            onAuthenticated();
          }
        } else {
          setError(result.error || 'Authentication failed');
        }
      }
    } catch (error) {
      setError('Authentication failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.unlockWithPin(pin);
        if (result.success) {
          onAuthenticated();
        } else {
          setError(result.error || 'Invalid PIN');
        }
      }
    } catch (error) {
      setError('PIN authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.setupPin(newPin);
        if (result.success) {
          setSetupMode(false);
          onAuthenticated();
        } else {
          setError(result.error || 'Failed to setup PIN');
        }
      }
    } catch (error) {
      setError('Failed to setup PIN');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  if (!authStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">
            Initializing security system...
          </p>
        </div>
      </div>
    );
  }

  if (setupMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Key className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Setup Complete!</CardTitle>
            <CardDescription>
              Your secure database has been created. You can now optionally set up a PIN for quick access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupPin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPin">New PIN (4-8 digits, optional)</Label>
                <Input
                  id="newPin"
                  type="password"
                  placeholder="Enter PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSetupMode(false);
                    onAuthenticated();
                  }}
                  className="flex-1"
                >
                  Skip PIN Setup
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !newPin || newPin !== confirmPin}
                  className="flex-1"
                >
                  {loading ? 'Setting up...' : 'Setup PIN'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Welcome to ForgetFunds</CardTitle>
          <CardDescription>
            {authStatus.hasLegacyData 
              ? 'Your data will be migrated to a secure encrypted database.'
              : 'Please authenticate to access your secure budget data.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={authStatus.isPinConfigured ? "pin" : "password"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </TabsTrigger>
              <TabsTrigger value="pin" disabled={!authStatus.isPinConfigured}>
                <Key className="h-4 w-4" />
                PIN
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="password" className="space-y-4">
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Master Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your master password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        validatePassword(e.target.value);
                      }}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordValidation && password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Password Strength</span>
                        <span>{getPasswordStrengthText(passwordValidation.strength)}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded">
                        <div
                          className={`h-full rounded transition-all ${getPasswordStrengthColor(passwordValidation.strength)}`}
                          style={{ width: `${passwordValidation.strength}%` }}
                        />
                      </div>
                      {passwordValidation.errors.length > 0 && (
                        <ul className="text-sm text-red-600 space-y-1">
                          {passwordValidation.errors.map((error: string, index: number) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
                  {loading ? 'Authenticating...' : 'Unlock Database'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="pin" className="space-y-4">
              <form onSubmit={handlePinAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter your PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                    maxLength={8}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading || !pin.trim()}>
                  {loading ? 'Authenticating...' : 'Unlock with PIN'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Your data is protected with enterprise-grade encryption
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
