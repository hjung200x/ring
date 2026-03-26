import type { UserScheduleUnit } from '@ring/types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export const getScheduleBounds = (unit: UserScheduleUnit) => {
  switch (unit) {
    case 'week':
      return { min: 1, max: 7 };
    case 'day':
      return { min: 1, max: 12 };
    case 'hour':
      return { min: 1, max: 24 };
  }
};

export const getScheduleDescription = (unit: UserScheduleUnit) => {
  switch (unit) {
    case 'week':
      return '\u0031\uC8FC\uC5D0 \uBA87 \uD68C \uC2E4\uD589\uD560\uC9C0';
    case 'day':
      return '\u0031\uC77C\uC5D0 \uBA87 \uD68C \uC2E4\uD589\uD560\uC9C0';
    case 'hour':
      return '\uBA87 \uC2DC\uAC04\uB9C8\uB2E4 \uC2E4\uD589\uD560\uC9C0';
  }
};

export const calculateIntervalMs = (unit: UserScheduleUnit, value: number) => {
  switch (unit) {
    case 'week':
      return WEEK_MS / value;
    case 'day':
      return DAY_MS / value;
    case 'hour':
      return value * HOUR_MS;
  }
};

export const calculateNextRunAt = (unit: UserScheduleUnit, value: number, from: Date) =>
  new Date(from.getTime() + calculateIntervalMs(unit, value));
