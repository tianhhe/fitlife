import type { WorkoutTemplate, TemplateDay } from "./types";
import { getTodayString } from "./storage";

function toUtcDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

function diffInDays(start: string, end: string): number {
  const startDate = toUtcDate(start);
  const endDate = toUtcDate(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getTrainingDays(template: WorkoutTemplate): number {
  return Math.max(
    1,
    Math.min(
      template.schedule?.trainingDaysPerWeek ?? template.days.length,
      template.days.length,
    ),
  );
}

export function getTemplateCycleLength(template: WorkoutTemplate): number {
  const trainingDays = getTrainingDays(template);
  const restDays = template.schedule?.restDaysBetweenCycles ?? 0;
  return Math.max(1, trainingDays + Math.max(0, restDays));
}

export function getTemplateStartDate(template: WorkoutTemplate): string {
  return template.schedule?.startDate || template.createdAt || getTodayString();
}

export function getPlanForDate(template: WorkoutTemplate, date: string) {
  const startDate = getTemplateStartDate(template);
  const cycleLength = getTemplateCycleLength(template);
  const trainingDays = getTrainingDays(template);
  const daysSince = diffInDays(startDate, date);
  const cycleDay = ((daysSince % cycleLength) + cycleLength) % cycleLength;

  if (cycleDay >= trainingDays) {
    return {
      isRestDay: true,
      cycleDay,
      dayIndex: undefined,
      day: undefined,
    };
  }

  const sortedDays = [...template.days].sort((a, b) => a.dayIndex - b.dayIndex);
  if (sortedDays.length === 0) {
    return {
      isRestDay: true,
      cycleDay,
      dayIndex: undefined,
      day: undefined,
    };
  }

  const day = sortedDays[cycleDay] || sortedDays[0];
  return {
    isRestDay: false,
    cycleDay,
    dayIndex: day?.dayIndex,
    day: day as TemplateDay | undefined,
  };
}

export function getNextWorkoutDate(
  template: WorkoutTemplate,
  fromDate: string,
): string {
  const startDate = getTemplateStartDate(template);
  const cycleLength = getTemplateCycleLength(template);
  const trainingDays = getTrainingDays(template);
  const daysSince = diffInDays(startDate, fromDate);
  const cycleDay = ((daysSince % cycleLength) + cycleLength) % cycleLength;

  // If fromDate is before startDate, return startDate
  if (daysSince < 0) {
    return startDate;
  }

  // If today is a rest day, find next training day
  if (cycleDay >= trainingDays) {
    const daysUntilNext = cycleLength - cycleDay;
    const nextDate = toUtcDate(fromDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + daysUntilNext);
    return nextDate.toISOString().split("T")[0];
  }

  // If today is the last training day, next workout is after rest days
  if (cycleDay === trainingDays - 1) {
    const daysUntilNext = cycleLength - cycleDay;
    const nextDate = toUtcDate(fromDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + daysUntilNext);
    return nextDate.toISOString().split("T")[0];
  }

  // Otherwise, next workout is tomorrow
  const nextDate = toUtcDate(fromDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString().split("T")[0];
}
