// Smart Solar Microgrid Trading System - Staff User Management Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { parseApiError } from '@/utils/errorParser';
import type { User, CreateUserRequest } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, ShieldAlert, Check, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

export function CreateUserPage() {
  const { isBackoffice } = useAuth();

  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'GridOperator' | 'Backoffice'>('GridOperator');

  const loadStaffUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await userService.getStaffUsers();
      setStaffUsers(data);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to load staff accounts.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isBackoffice) {
      loadStaffUsers();
    }
  }, [isBackoffice]);

  if (!isBackoffice) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="size-12 text-destructive mb-3" />
        <h2 className="text-xl font-semibold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Staff user creation is restricted to Backoffice administration personnel only.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestPayload: CreateUserRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
      };

      const newUser = await userService.createStaffUser(requestPayload);
      setSuccessMessage(
        `Staff user ${newUser.firstName} ${newUser.lastName} (${newUser.role}) successfully created.`
      );
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole('GridOperator');

      loadStaffUsers();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to create staff account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              User Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administrative portal to create and oversee Grid Operator and Backoffice staff accounts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadStaffUsers}
          disabled={isLoading}
          className="gap-1.5 text-xs h-8"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </Button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User Creation Form */}
        <Card className="lg:col-span-1 border shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-primary" />
              <CardTitle className="text-base">Create Staff Account</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Add new staff user with Grid Operator or Backoffice privilege.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs">
                  Account Role *
                </Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'GridOperator' | 'Backoffice')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="GridOperator">Grid Operator</option>
                  <option value="Backoffice">Backoffice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="e.g. Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@solargridx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password (min 8 chars) *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-xs h-9 gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5" />
                    <span>Create User</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Staff Users List */}
        <Card className="lg:col-span-2 border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Staff Members</CardTitle>
            <CardDescription className="text-xs">
              List of active system administrators and microgrid dispatch operators.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading staff directory...</span>
              </div>
            ) : staffUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No staff accounts found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffUsers.map((user) => (
                    <TableRow key={user.id} className="text-xs">
                      <TableCell className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'Backoffice' ? 'default' : 'secondary'}
                          className="text-[10px] uppercase font-semibold"
                        >
                          {user.role === 'GridOperator' ? 'Grid Operator' : user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
                        >
                          {user.accountStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
