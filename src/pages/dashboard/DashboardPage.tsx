// Smart Solar Microgrid Trading System - Reservation Dashboard Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/common/StatCard';
import { ReservationTable } from '@/components/reservations/ReservationTable';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CalendarCheck,
  Zap,
  CheckCircle2,
  PlusCircle,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { parseApiError } from '@/utils/errorParser';
import type { DashboardSummaryResponse, ReservationResponse } from '@/types/reservation';

export function DashboardPage() {
  const { isProsumer, isStaff, user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummaryResponse>({
    pendingReservations: 0,
    approvedFutureReservations: 0,
    currentActiveReservations: 0,
    completedReservations: 0,
  });
  const [recentReservations, setRecentReservations] = useState<ReservationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [summaryData, reservationsData] = await Promise.all([
        reservationService.getDashboardSummary(),
        reservationService.getReservations(),
      ]);
      setSummary(summaryData);
      setRecentReservations(reservationsData.slice(0, 5));
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to load dashboard summary metrics.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reservation Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Welcome back, {user?.firstName}. Real-time solar microgrid slot bookings and capacity status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="gap-1.5 text-xs h-8"
          >
            <RotateCcw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {isProsumer && (
            <Button
              size="sm"
              onClick={() => navigate('/reservations/create')}
              className="gap-1.5 text-xs h-8"
            >
              <PlusCircle className="size-3.5" />
              <span>Book Slot</span>
            </Button>
          )}

          {isStaff && (
            <Button
              size="sm"
              variant="default"
              onClick={() => navigate('/reservations/pending')}
              className="gap-1.5 text-xs h-8"
            >
              <Clock className="size-3.5" />
              <span>Pending Queue ({summary.pendingReservations})</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Bookings"
          value={summary.pendingReservations}
          description="Awaiting operational approval"
          icon={Clock}
          variant="amber"
          onClick={isStaff ? () => navigate('/reservations/pending') : undefined}
        />

        <StatCard
          title="Approved Future"
          value={summary.approvedFutureReservations}
          description="Confirmed slots scheduled ahead"
          icon={CalendarCheck}
          variant="blue"
          onClick={() => navigate('/reservations')}
        />

        <StatCard
          title="Active Sessions"
          value={summary.currentReservations ?? summary.currentActiveReservations ?? 0}
          description="Currently ongoing or open"
          icon={Zap}
          variant="emerald"
        />

        <StatCard
          title="Completed Bookings"
          value={summary.completedReservations}
          description="Successfully fulfilled sessions"
          icon={CheckCircle2}
          variant="slate"
          onClick={() => navigate('/reservations/history')}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Bookings</h2>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/reservations')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all reservations &rarr;
          </Button>
        </div>

        <ReservationTable
          reservations={recentReservations}
          isLoading={isLoading}
          isStaff={isStaff}
        />
      </div>
    </div>
  );
}
