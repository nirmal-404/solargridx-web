// Smart Solar Microgrid Trading System - Operational Pending Queue (Bookings & Account Requests)
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ReservationTable } from '@/components/reservations/ReservationTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  RotateCcw,
  Clock,
  AlertCircle,
  Check,
  UserX,
  CalendarDays,
  UserCheck,
  PowerOff,
  XCircle,
} from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { userService } from '@/services/userService';
import { parseApiError } from '@/utils/errorParser';
import type { ReservationResponse } from '@/types/reservation';
import type { User } from '@/types/auth';

export function PendingPage() {
  const { isStaff } = useAuth();

  const [activeTab, setActiveTab] = useState<'reservations' | 'accounts'>('reservations');
  const [pendingReservations, setPendingReservations] = useState<ReservationResponse[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Reservation dialogs
  const [selectedForApprove, setSelectedForApprove] = useState<ReservationResponse | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<ReservationResponse | null>(null);

  // Account request dialogs
  const [selectedAccountApprove, setSelectedAccountApprove] = useState<User | null>(null);
  const [selectedAccountReject, setSelectedAccountReject] = useState<User | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [reservationsData, usersData] = await Promise.all([
        reservationService.getPendingReservations(),
        userService.getPendingProsumers().catch(() => [] as User[]),
      ]);
      setPendingReservations(reservationsData);
      setPendingUsers(usersData);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to retrieve pending operational items.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveReservation = async () => {
    if (!selectedForApprove) return;
    setIsProcessing(true);
    try {
      await reservationService.approveReservation(selectedForApprove.reservationId);
      setSelectedForApprove(null);
      showToast(`Reservation ${selectedForApprove.reservationId} approved successfully.`);
      loadData();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Approval failed.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectReservation = async () => {
    if (!selectedForReject) return;
    setIsProcessing(true);
    try {
      await reservationService.rejectReservation(selectedForReject.reservationId);
      setSelectedForReject(null);
      showToast(`Reservation ${selectedForReject.reservationId} rejected and capacity restored.`);
      loadData();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Rejection failed.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Account deactivation: approve means deactivating the user
  const handleApproveAccountDeactivation = async () => {
    if (!selectedAccountApprove) return;
    setIsProcessing(true);
    try {
      await userService.updateProsumerStatus(selectedAccountApprove.id, 'Deactivated');
      const name = `${selectedAccountApprove.firstName} ${selectedAccountApprove.lastName}`.trim();
      setSelectedAccountApprove(null);
      showToast(`Account deactivation approved for ${name} (NIC: ${selectedAccountApprove.nic ?? 'N/A'}).`);
      loadData();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to process account deactivation.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Account request: reject means restoring or keeping active
  const handleRejectAccountDeactivation = async () => {
    if (!selectedAccountReject) return;
    setIsProcessing(true);
    try {
      await userService.updateProsumerStatus(selectedAccountReject.id, 'Active');
      const name = `${selectedAccountReject.firstName} ${selectedAccountReject.lastName}`.trim();
      setSelectedAccountReject(null);
      showToast(`Deactivation request rejected. Account ${name} remains Active.`);
      loadData();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to reject deactivation request.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const deactivationRequests = pendingUsers.filter(
    (u) => u.accountStatus === 'DeactivationRequested'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Pending Queue
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational review queue: Review energy slot reservations and official prosumer account requests.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="gap-1.5 text-xs h-8"
        >
          <RotateCcw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'reservations'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/60'
          }`}
        >
          <CalendarDays className="size-3.5" />
          <span>Pending Bookings</span>
          <span
            className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
              activeTab === 'reservations'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {pendingReservations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'accounts'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/60'
          }`}
        >
          <UserX className="size-3.5" />
          <span>Account Deactivation Requests</span>
          <span
            className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
              activeTab === 'accounts'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : deactivationRequests.length > 0
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {deactivationRequests.length}
          </span>
        </button>
      </div>

      {successToast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {activeTab === 'reservations' ? (
        <ReservationTable
          reservations={pendingReservations}
          isLoading={isLoading}
          isStaff={isStaff}
          onApprove={(r) => setSelectedForApprove(r)}
          onReject={(r) => setSelectedForReject(r)}
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              Official Prosumer Account Requests ({pendingUsers.length})
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Review and approve or reject deactivation requests submitted by prosumers, as well as pending registrations.
            </p>

            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No pending account requests at this time.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Prosumer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>NIC Identifier</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id} className="text-xs">
                      <TableCell className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        {user.nic ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phone ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-44 truncate">
                        {user.address ?? '—'}
                      </TableCell>
                      <TableCell>
                        {user.accountStatus === 'DeactivationRequested' ? (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px]"
                          >
                            Deactivation Requested
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]"
                          >
                            Pending Registration
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.accountStatus === 'DeactivationRequested' ? (
                            <>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2 text-[10px] gap-1"
                                onClick={() => setSelectedAccountApprove(user)}
                              >
                                <PowerOff className="size-3" />
                                <span>Approve Deactivation</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] gap-1"
                                onClick={() => setSelectedAccountReject(user)}
                              >
                                <XCircle className="size-3" />
                                <span>Reject Request</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="h-7 px-2 text-[10px] gap-1"
                                onClick={() => setSelectedAccountReject(user)}
                              >
                                <UserCheck className="size-3" />
                                <span>Activate</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] gap-1"
                                onClick={() => setSelectedAccountApprove(user)}
                              >
                                <span>Reject</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Reservation Dialogs */}
      <ConfirmDialog
        open={!!selectedForApprove}
        onOpenChange={(open) => !open && setSelectedForApprove(null)}
        title="Approve Energy Reservation"
        description={`Confirm approval for ${selectedForApprove?.reservationId} (${selectedForApprove?.requestedCapacity} kWh, Type: ${selectedForApprove?.transferType ?? 'Drop-Off'}${selectedForApprove?.notes ? `, Notes: "${selectedForApprove.notes}"` : ''})? A QR verification hash will be created.`}
        confirmText="Approve"
        variant="default"
        isLoading={isProcessing}
        onConfirm={handleApproveReservation}
      />

      <ConfirmDialog
        open={!!selectedForReject}
        onOpenChange={(open) => !open && setSelectedForReject(null)}
        title="Reject Energy Reservation"
        description={`Are you sure you want to reject ${selectedForReject?.reservationId}? The held capacity (${selectedForReject?.requestedCapacity} kWh) will be restored back to the microgrid slot.`}
        confirmText="Reject"
        variant="destructive"
        isLoading={isProcessing}
        onConfirm={handleRejectReservation}
      />

      {/* Account Deactivation Approval Dialog */}
      <ConfirmDialog
        open={!!selectedAccountApprove}
        onOpenChange={(open) => !open && setSelectedAccountApprove(null)}
        title="Approve Account Deactivation"
        description={`Are you sure you want to approve deactivation for ${selectedAccountApprove?.firstName} ${selectedAccountApprove?.lastName} (NIC: ${selectedAccountApprove?.nic ?? 'N/A'})? This will set their account status to Deactivated.`}
        confirmText="Deactivate Account"
        variant="destructive"
        isLoading={isProcessing}
        onConfirm={handleApproveAccountDeactivation}
      />

      {/* Account Deactivation Rejection Dialog */}
      <ConfirmDialog
        open={!!selectedAccountReject}
        onOpenChange={(open) => !open && setSelectedAccountReject(null)}
        title="Reject Deactivation Request"
        description={`Reject deactivation request for ${selectedAccountReject?.firstName} ${selectedAccountReject?.lastName} (NIC: ${selectedAccountReject?.nic ?? 'N/A'})? Their account will remain Active.`}
        confirmText="Keep Account Active"
        variant="default"
        isLoading={isProcessing}
        onConfirm={handleRejectAccountDeactivation}
      />
    </div>
  );
}
