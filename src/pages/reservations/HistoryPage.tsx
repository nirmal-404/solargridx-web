// Smart Solar Microgrid Trading System - Booking History Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ReservationTable } from '@/components/reservations/ReservationTable';
import { Button } from '@/components/ui/button';
import { RotateCcw, History, AlertCircle } from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { parseApiError } from '@/utils/errorParser';
import type { ReservationResponse } from '@/types/reservation';

export function HistoryPage() {
  const { isStaff } = useAuth();

  const [historyReservations, setHistoryReservations] = useState<ReservationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await reservationService.getBookingHistory();
      setHistoryReservations(data);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to load booking history.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Booking History
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of completed, cancelled, rejected, and expired microgrid trading reservations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
          disabled={isLoading}
          className="gap-1.5 text-xs h-8"
        >
          <RotateCcw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <ReservationTable
        reservations={historyReservations}
        isLoading={isLoading}
        isStaff={isStaff}
      />
    </div>
  );
}
