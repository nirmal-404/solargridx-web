// Smart Solar Microgrid Trading System - User Profile Page
import { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Shield, BadgeCheck, KeyRound,
  Pencil, Check, X, AlertCircle, CheckCircle2, Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { parseApiError } from '@/utils/errorParser';
import type { AccountStatus, UserRole } from '@/types/auth';

// ── Helpers ──────────────────────────────────────────────────────────────────

function roleBadge(role: UserRole) {
  const map: Record<UserRole, { label: string; cls: string }> = {
    Backoffice:   { label: 'Backoffice',    cls: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
    GridOperator: { label: 'Grid Operator', cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
    Prosumer:     { label: 'Prosumer',      cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  };
  const { label, cls } = map[role] ?? { label: role, cls: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      <Shield className="size-3" />
      {label}
    </span>
  );
}

function statusBadge(status: AccountStatus) {
  const map: Record<AccountStatus, { label: string; cls: string; dot: string }> = {
    Active:                { label: 'Active',                cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    Pending:               { label: 'Pending Approval',      cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',       dot: 'bg-amber-500' },
    DeactivationRequested: { label: 'Deactivation Pending',  cls: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',    dot: 'bg-orange-500' },
    Deactivated:           { label: 'Deactivated',           cls: 'bg-red-500/15 text-red-600 dark:text-red-400',             dot: 'bg-red-500' },
  };
  const { label, cls, dot } = map[status] ?? { label: status, cls: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      <span className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function avatarInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function avatarGradient(role: UserRole) {
  const map: Record<UserRole, string> = {
    Backoffice:   'from-violet-500 to-purple-700',
    GridOperator: 'from-sky-500 to-blue-700',
    Prosumer:     'from-emerald-500 to-teal-700',
  };
  return map[role] ?? 'from-slate-500 to-slate-700';
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface InfoRowProps { icon: React.ReactNode; label: string; value?: string | null; }
function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
      <span className="mt-0.5 size-7 shrink-0 flex items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground break-all">
          {value || <span className="text-muted-foreground/50 italic">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, login } = useAuth();

  // ── Edit profile state ────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast,  setEditLast]  = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddr,  setEditAddr]  = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError,   setProfileError]   = useState<string | null>(null);

  // ── Change password state ─────────────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [pwSuccess,  setPwSuccess]  = useState<string | null>(null);
  const [pwError,    setPwError]    = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw,     setShowNewPw]     = useState(false);

  if (!user) return null;

  const gradient = avatarGradient(user.role);
  const initials = avatarInitials(user.firstName, user.lastName);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openEdit = () => {
    setEditFirst(user.firstName);
    setEditLast(user.lastName);
    setEditPhone(user.phone ?? '');
    setEditAddr(user.address ?? '');
    setProfileError(null);
    setProfileSuccess(null);
    setIsEditing(true);
  };

  const cancelEdit = () => { setIsEditing(false); setProfileError(null); };

  const saveProfile = async () => {
    if (!editFirst.trim() || !editLast.trim()) {
      setProfileError('First and last name are required.');
      return;
    }
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      await authService.updateProfile({
        firstName: editFirst.trim(),
        lastName:  editLast.trim(),
        phone:     editPhone.trim() || undefined,
        address:   editAddr.trim() || undefined,
      });
      // Re-fetch to sync auth context
      const fresh = await authService.getCurrentUser();
      localStorage.setItem('solargridx_user', JSON.stringify(fresh));
      // Trigger a page re-mount by re-reading localStorage on next render
      window.dispatchEvent(new Event('storage'));
      setProfileSuccess('Profile updated successfully.');
      setIsEditing(false);
      // Force a quick page refresh to reflect name changes in sidebar
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setProfileError(parseApiError(err, 'Failed to update profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const pwConfirmError = confirmPw && newPw !== confirmPw ? 'Passwords do not match.' : null;
  const pwStrengthOk   = newPw.length >= 8;

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwStrengthOk)    { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setIsSavingPw(true);
    setPwError(null);
    setPwSuccess(null);
    try {
      await authService.changePassword(currentPw, newPw);
      setPwSuccess('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(parseApiError(err, 'Failed to change password.'));
    } finally {
      setIsSavingPw(false);
    }
  };

  const inputBase =
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border-border transition-colors';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">My Profile</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          View and manage your account information.
        </p>
      </div>

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* gradient band */}
        <div className={`h-28 bg-gradient-to-br ${gradient} opacity-80`} />

        {/* avatar + identity */}
        <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end gap-4 px-6 pb-5">
          {/* avatar */}
          <div className={`size-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-card shrink-0`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground leading-tight">
                {user.firstName} {user.lastName}
              </h2>
              {roleBadge(user.role)}
              {statusBadge(user.accountStatus)}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="size-3" />
              {user.email}
            </p>
          </div>

          {/* edit button */}
          {!isEditing && (
            <button
              id="btn-edit-profile"
              onClick={openEdit}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="size-3.5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Feedback banners ── */}
      {profileSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          {profileSuccess}
        </div>
      )}

      {/* ── Two-column grid ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* ── Profile details card ── */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="size-4 text-primary" />
              Personal Information
            </h3>
          </div>

          {isEditing ? (
            <div className="p-5 space-y-3">
              {profileError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {profileError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">First Name *</label>
                  <input value={editFirst} onChange={e => setEditFirst(e.target.value)}
                    maxLength={50} placeholder="Jane" className={inputBase} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Last Name *</label>
                  <input value={editLast} onChange={e => setEditLast(e.target.value)}
                    maxLength={50} placeholder="Doe" className={inputBase} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Phone Number</label>
                <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                  type="tel" maxLength={20} placeholder="+94771234567" className={inputBase} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Address</label>
                <textarea value={editAddr} onChange={e => setEditAddr(e.target.value)}
                  rows={2} maxLength={200} placeholder="123 Main Street"
                  className={`${inputBase} resize-none`} />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  id="btn-save-profile"
                  onClick={() => void saveProfile()}
                  disabled={isSavingProfile}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Check className="size-3.5" />
                  {isSavingProfile ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={cancelEdit}
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors">
                  <X className="size-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-1">
              <InfoRow icon={<User className="size-3.5" />}   label="Full Name"  value={`${user.firstName} ${user.lastName}`} />
              <InfoRow icon={<Mail className="size-3.5" />}   label="Email"      value={user.email} />
              <InfoRow icon={<Phone className="size-3.5" />}  label="Phone"      value={user.phone} />
              <InfoRow icon={<MapPin className="size-3.5" />} label="Address"    value={user.address} />
              {user.nic && (
                <InfoRow icon={<BadgeCheck className="size-3.5" />} label="NIC" value={user.nic} />
              )}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Account meta card */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                Account Details
              </h3>
            </div>
            <div className="px-5 py-1">
              <div className="flex items-start gap-3 py-3 border-b border-border/60">
                <span className="mt-0.5 size-7 shrink-0 flex items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Shield className="size-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Role</p>
                  <div className="mt-1">{roleBadge(user.role)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 py-3">
                <span className="mt-0.5 size-7 shrink-0 flex items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <BadgeCheck className="size-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                  <div className="mt-1">{statusBadge(user.accountStatus)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Change password card */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                Change Password
              </h3>
            </div>
            <form onSubmit={e => void changePassword(e)} className="p-5 space-y-3">
              {pwError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />{pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5 shrink-0" />{pwSuccess}
                </div>
              )}

              {/* Current password */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Current Password</label>
                <div className="relative mt-1">
                  <input
                    id="input-current-pw"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={inputBase}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowCurrentPw(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <Lock className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">New Password</label>
                <div className="relative mt-1">
                  <input
                    id="input-new-pw"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    required minLength={8}
                    placeholder="Min 8 characters"
                    className={`${inputBase} ${newPw && !pwStrengthOk ? 'border-destructive/60' : ''}`}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowNewPw(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <Lock className="size-3.5" />
                  </button>
                </div>
                {/* strength bar */}
                {newPw && (
                  <div className="mt-1.5 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        newPw.length >= (i + 1) * 3
                          ? newPw.length >= 12 ? 'bg-emerald-500'
                          : newPw.length >= 8  ? 'bg-amber-500'
                          :                      'bg-red-500'
                          : 'bg-muted'
                      }`} />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {newPw.length < 8 ? 'Too short' : newPw.length < 12 ? 'Fair' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Confirm New Password</label>
                <input
                  id="input-confirm-pw"
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className={`${inputBase} ${pwConfirmError ? 'border-destructive/60' : ''}`}
                />
                {pwConfirmError && (
                  <p className="mt-1 text-[10px] text-destructive">{pwConfirmError}</p>
                )}
              </div>

              <button
                id="btn-change-password"
                type="submit"
                disabled={isSavingPw || !!pwConfirmError || !pwStrengthOk}
                className="w-full flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
              >
                <KeyRound className="size-3.5" />
                {isSavingPw ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
