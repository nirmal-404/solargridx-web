// Smart Solar Microgrid Trading System - Date & Time Utilities

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

// Calculates hours remaining between now and the scheduled start time.
export function getNoticeRemainingHours(scheduledStartTime: string): number {
  const start = new Date(scheduledStartTime).getTime();
  const now = Date.now();
  return (start - now) / (1000 * 60 * 60);
}

// Enforces whether the 12-hour modification/cancellation notice window is satisfied.
export function hasTwelveHourNotice(scheduledStartTime: string): boolean {
  return getNoticeRemainingHours(scheduledStartTime) >= 12;
}

// Validates that a candidate slot is in the future and does not exceed 7 calendar days.
export function isWithinSevenDayWindow(startTime: string): { valid: boolean; reason?: string } {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

  if (start <= now) {
    return { valid: false, reason: 'Slot start time must be in the future.' };
  }
  if (start > sevenDaysFromNow) {
    return { valid: false, reason: 'Reservations must start within the next 7 days.' };
  }
  return { valid: true };
}

// Provides human-readable notice indicator for UI badges.
export function formatNoticeStatus(scheduledStartTime: string): {
  canModify: boolean;
  text: string;
  hoursLeft: number;
} {
  const hours = getNoticeRemainingHours(scheduledStartTime);
  if (hours < 0) {
    return { canModify: false, text: 'Session Past', hoursLeft: 0 };
  }
  if (hours < 12) {
    return {
      canModify: false,
      text: `Locked (< 12h notice)`,
      hoursLeft: Math.max(0, Math.floor(hours)),
    };
  }
  const noticeHours = Math.floor(hours);
  return {
    canModify: true,
    text: `${noticeHours}h notice available`,
    hoursLeft: noticeHours,
  };
}
