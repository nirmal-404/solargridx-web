// Smart Solar Microgrid Trading System - Login Page
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SunMedium, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { parseApiError } from '@/utils/errorParser';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Authentication failed. Check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <SunMedium className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">SolarGridX</h1>
          <p className="text-xs text-muted-foreground">
            Smart Solar Microgrid Energy Trading & Booking Portal
          </p>
        </div>

        <Card className="border-border shadow-xs">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access your microgrid account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="text-xs"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full gap-2 text-xs">
                {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                Sign In
              </Button>
            </form>

            {/* Quick-fill helper for university grading & testing */}
            <div className="pt-3 border-t">
              <p className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <KeyRound className="size-3 text-amber-500" />
                <span>Quick Test Accounts:</span>
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[10px] h-7"
                  onClick={() => handleQuickFill('admin@solargridx.local', 'Admin@1234')}
                >
                  Backoffice
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[10px] h-7"
                  onClick={() => handleQuickFill('operator@solargridx.local', 'Operator@1234')}
                >
                  Operator
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[10px] h-7"
                  onClick={() => handleQuickFill('kamal.silva@prosumer.local', 'Prosumer@1234')}
                >
                  Prosumer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
