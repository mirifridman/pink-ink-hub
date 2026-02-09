import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, format } from 'date-fns';
import { he } from 'date-fns/locale';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceConfig {
  type: RecurrenceType;
  startDate: Date;
  endDate?: Date;
  lastCreated?: Date;
}

/**
 * Calculate the next occurrence date based on recurrence type
 */
export function getNextRecurrenceDate(
  recurrenceType: RecurrenceType,
  startDate: Date,
  lastCreated?: Date
): Date | null {
  const baseDate = lastCreated || startDate;
  let nextDate: Date;

  switch (recurrenceType) {
    case 'daily':
      nextDate = addDays(baseDate, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(baseDate, 1);
      break;
    case 'monthly':
      nextDate = addMonths(baseDate, 1);
      break;
    case 'yearly':
      nextDate = addYears(baseDate, 1);
      break;
    default:
      return null;
  }

  return nextDate;
}

/**
 * Check if a recurrence should create a new task instance
 */
export function shouldCreateRecurringTask(
  recurrenceType: RecurrenceType,
  startDate: Date,
  endDate: Date | undefined,
  lastCreated: Date | undefined
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If there's an end date and we've passed it, don't create
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (isAfter(today, end)) {
      return false;
    }
  }

  // If we haven't started yet, don't create
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  if (isBefore(today, start)) {
    return false;
  }

  // If no last created date, check if we should create based on start date
  if (!lastCreated) {
    return today >= start;
  }

  // Calculate next occurrence
  const nextDate = getNextRecurrenceDate(recurrenceType, startDate, lastCreated);
  if (!nextDate) {
    return false;
  }

  const next = new Date(nextDate);
  next.setHours(0, 0, 0, 0);

  // Create if today is the next occurrence date or later
  return today >= next;
}

/**
 * Get all occurrence dates between start and end (or up to a limit)
 */
export function getAllRecurrenceDates(
  recurrenceType: RecurrenceType,
  startDate: Date,
  endDate?: Date,
  limit: number = 100
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  let count = 0;

  while (count < limit) {
    dates.push(new Date(currentDate));

    const nextDate = getNextRecurrenceDate(recurrenceType, startDate, currentDate);
    if (!nextDate) {
      break;
    }

    // If we have an end date and next date exceeds it, stop
    if (end && isAfter(nextDate, end)) {
      break;
    }

    currentDate = nextDate;
    count++;
  }

  return dates;
}

/**
 * Format recurrence type for display
 */
export function formatRecurrenceType(type: RecurrenceType): string {
  const labels: Record<RecurrenceType, string> = {
    daily: 'יומי',
    weekly: 'שבועי',
    monthly: 'חודשי',
    yearly: 'שנתי',
  };
  return labels[type] || type;
}

/**
 * Get recurrence description for display
 */
export function getRecurrenceDescription(
  recurrenceType: RecurrenceType,
  startDate: Date,
  endDate?: Date
): string {
  const typeLabel = formatRecurrenceType(recurrenceType);
  const start = format(startDate, 'd בMMM yyyy', { locale: he });
  
  if (endDate) {
    const end = format(endDate, 'd בMMM yyyy', { locale: he });
    return `חזרתיות ${typeLabel} מ-${start} עד ${end}`;
  }
  
  return `חזרתיות ${typeLabel} החל מ-${start}`;
}
