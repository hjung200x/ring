import type { UserScheduleUnit } from '@ring/types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const FIXED_RUN_HOUR = 16;

const WEEKDAY_SLOTS: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

const startOfDay = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const atFixedRunHour = (value: Date) => {
  const next = new Date(value);
  next.setHours(FIXED_RUN_HOUR, 0, 0, 0);
  return next;
};

const calculateNextWeeklyRunAt = (value: number, from: Date) => {
  const slots = WEEKDAY_SLOTS[Math.max(1, Math.min(7, value))] ?? WEEKDAY_SLOTS[1];

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = atFixedRunHour(new Date(startOfDay(from).getTime() + offset * DAY_MS));
    if (candidate <= from) {
      continue;
    }
    if (slots.includes(candidate.getDay())) {
      return candidate;
    }
  }

  return atFixedRunHour(new Date(startOfDay(from).getTime() + DAY_MS));
};

const calculateNextDailyRunAt = (value: number, from: Date) => {
  const intervalDays = Math.max(1, value);
  const todayAtRunHour = atFixedRunHour(from);
  if (todayAtRunHour > from) {
    return todayAtRunHour;
  }

  return atFixedRunHour(new Date(startOfDay(from).getTime() + intervalDays * DAY_MS));
};

export const getScheduleBounds = (unit: UserScheduleUnit) => {
  switch (unit) {
    case 'week':
      return { min: 1, max: 7 };
    case 'day':
      return { min: 1, max: 30 };
    case 'hour':
      return { min: 1, max: 24 };
  }
};

export const getScheduleDescription = (unit: UserScheduleUnit) => {
  switch (unit) {
    case 'week':
      return '\u0031\uC8FC\uC5D0 \uBA87 \uD68C \uC2E4\uD589\uD560\uC9C0 (\uC624\uD6C4 4\uC2DC \uACE0\uC815)';
    case 'day':
      return '\uBA87 \uC77C\uB9C8\uB2E4 \uC2E4\uD589\uD560\uC9C0 (\uC624\uD6C4 4\uC2DC \uACE0\uC815)';
    case 'hour':
      return '\uBA87 \uC2DC\uAC04\uB9C8\uB2E4 \uC2E4\uD589\uD560\uC9C0';
  }
};

export const calculateIntervalMs = (unit: UserScheduleUnit, value: number) => {
  switch (unit) {
    case 'week':
      return 7 * DAY_MS;
    case 'day':
      return Math.max(1, value) * DAY_MS;
    case 'hour':
      return value * HOUR_MS;
  }
};

export const calculateNextRunAt = (unit: UserScheduleUnit, value: number, from: Date) => {
  switch (unit) {
    case 'week':
      return calculateNextWeeklyRunAt(value, from);
    case 'day':
      return calculateNextDailyRunAt(value, from);
    case 'hour':
      return new Date(from.getTime() + calculateIntervalMs(unit, value));
  }
};
