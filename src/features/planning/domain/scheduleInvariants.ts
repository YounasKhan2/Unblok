/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoadmapDayColumn } from '../types';

/**
 * Generates an array of daily columns for a specified start date and window length.
 */
export function generateScheduleDays(
  windowStartDate: Date,
  daysCount: number = 7,
  referenceDate: Date = new Date()
): RoadmapDayColumn[] {
  const days: RoadmapDayColumn[] = [];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const refDateStr = formatUtcDate(referenceDate);

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(windowStartDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = formatUtcDate(d);
    const dayNum = d.getUTCDate();
    const dayOfWeek = weekdays[d.getUTCDay()];
    const monthName = months[d.getUTCMonth()];
    const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
    const isToday = dateStr === refDateStr;

    days.push({
      dateStr,
      dayNum,
      dayOfWeek,
      monthName,
      isWeekend,
      isToday,
    });
  }

  return days;
}

/**
 * Format a Date object to YYYY-MM-DD using UTC values.
 */
export function formatUtcDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format date range label: e.g. "28 Sep - 04 Oct 2026"
 */
export function formatRangeLabel(days: RoadmapDayColumn[]): string {
  if (days.length === 0) return '';
  const first = days[0];
  const last = days[days.length - 1];
  return `${first.dayNum} ${first.monthName} – ${last.dayNum} ${last.monthName} ${first.dateStr.slice(0, 4)}`;
}

/**
 * Validates canonical schedule dates.
 */
export function validateScheduleDates(
  startDate?: string,
  dueDate?: string
): { valid: boolean; error?: string } {
  if (!startDate && !dueDate) {
    return { valid: true };
  }

  if (startDate && dueDate) {
    const s = new Date(startDate).getTime();
    const e = new Date(dueDate).getTime();
    if (isNaN(s) || isNaN(e)) {
      return { valid: false, error: 'Invalid date format (must be YYYY-MM-DD).' };
    }
    if (s > e) {
      return { valid: false, error: 'Start date cannot be after due date.' };
    }
  }

  return { valid: true };
}

/**
 * Calculate column placement of an issue inside a window of dates.
 */
export function calculateTimelineSpan(
  issueStart: string | undefined,
  issueDue: string | undefined,
  windowDays: RoadmapDayColumn[]
): {
  inWindow: boolean;
  startCol: number;
  spanCols: number;
  startsBeforeWindow: boolean;
  endsAfterWindow: boolean;
} | null {
  if (!issueStart && !issueDue) {
    return null;
  }

  // Normalize single date to 1-day span
  const effectiveStart = issueStart || issueDue!;
  const effectiveDue = issueDue || issueStart!;

  const windowFirstDate = windowDays[0].dateStr;
  const windowLastDate = windowDays[windowDays.length - 1].dateStr;

  // Check if issue overlaps the window at all
  if (effectiveDue < windowFirstDate || effectiveStart > windowLastDate) {
    return null;
  }

  const startsBeforeWindow = effectiveStart < windowFirstDate;
  const endsAfterWindow = effectiveDue > windowLastDate;

  // Find column indices
  let startCol = 0;
  if (!startsBeforeWindow) {
    startCol = windowDays.findIndex(d => d.dateStr === effectiveStart);
    if (startCol === -1) startCol = 0;
  }

  let endCol = windowDays.length - 1;
  if (!endsAfterWindow) {
    endCol = windowDays.findIndex(d => d.dateStr === effectiveDue);
    if (endCol === -1) endCol = windowDays.length - 1;
  }

  const spanCols = Math.max(1, endCol - startCol + 1);

  return {
    inWindow: true,
    startCol,
    spanCols,
    startsBeforeWindow,
    endsAfterWindow,
  };
}
