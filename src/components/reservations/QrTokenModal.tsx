// Smart Solar Microgrid Trading System - QR Token Display Modal
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, Copy, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { formatDateTime } from '@/utils/dateUtils';
import type { ReservationResponse, QrTokenResponse } from '@/types/reservation';

interface QrTokenModalProps {
  reservation: ReservationResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrTokenModal({ reservation, open, onOpenChange }: QrTokenModalProps) {
  const [tokenData, setTokenData] = useState<QrTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reservation || !open) {
      setTokenData(null);
      setErrorMessage(null);
      setCopied(false);
      return;
    }

    async function fetchToken() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await reservationService.getTransactionToken(reservation!.reservationId);
        setTokenData(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Could not retrieve QR transaction token.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchToken();
  }, [reservation, open]);

  const handleCopy = () => {
    if (!tokenData?.token) return;
    navigator.clipboard.writeText(tokenData.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <QrCode className="size-4.5" />
            </div>
            <div>
              <DialogTitle>Energy Session Token</DialogTitle>
              <DialogDescription className="text-xs">
                Microgrid Operator Verification Payload
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span>Generating fresh secure transaction token...</span>
          </div>
        ) : errorMessage ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : tokenData ? (
          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-xs">
              <div>
                <span className="text-muted-foreground">Transaction ID:</span>
                <p className="font-mono font-semibold text-foreground">{tokenData.transactionId}</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-[10px]">
                <ShieldCheck className="size-3" />
                Active
              </Badge>
            </div>

            {/* Token display box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Opaque Verification Token:</span>
                <span className="text-[11px] text-muted-foreground">
                  Expires: {formatDateTime(tokenData.expiresAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted p-2.5 font-mono text-xs break-all select-all text-foreground">
                  {tokenData.token}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-10 px-3 shrink-0"
                >
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Present this token to the Grid Operator at Station <span className="font-semibold text-foreground">{reservation.stationId}</span> to authorize power delivery. Each retrieval safely rotates the cryptographic token hash.
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
