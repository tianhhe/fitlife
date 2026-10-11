import { describe, it, expect } from "vitest";
import {
  getTemplateCycleLength,
  getTemplateStartDate,
  getPlanForDate,
  getNextWorkoutDate,
} from "./training-plan";
import type { WorkoutTemplate, TemplateDay, TemplateSchedule } from "./types";

function createTemplate(
  overrides: Partial<WorkoutTemplate> = {},
): WorkoutTemplate {
  const defaultDays: TemplateDay[] = [
    { dayIndex: 1, name: "Day 1", muscleGroups: ["chest"], exercises: [] },
    { dayIndex: 2, name: "Day 2", muscleGroups: ["back"], exercises: [] },
    { dayIndex: 3, name: "Day 3", muscleGroups: ["legs"], exercises: [] },
  ];

  return {
    id: "test-template",
    name: "Test Template",
    description: "Test",
    days: defaultDays,
    schedule: {
      trainingDaysPerWeek: 3,
      restDaysBetweenCycles: 1,
      startDate: "2024-01-01",
    },
    isPreset: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    ...overrides,
  };
}

describe("training-plan", () => {
  describe("getTemplateCycleLength", () => {
    it("should calculate cycle length with trainingDaysPerWeek and restDays", () => {
      const template = createTemplate({
        schedule: {
          trainingDaysPerWeek: 3,
          restDaysBetweenCycles: 1,
          startDate: "2024-01-01",
        },
        days: [{ dayIndex: 1, name: "D1", muscleGroups: [], exercises: [] }],
      });
      // trainingDays = min(3, 1) = 1, restDays = 1, cycle = 2
      expect(getTemplateCycleLength(template)).toBe(2);
    });

    it("should use days.length when trainingDaysPerWeek not set", () => {
      const template = createTemplate({
        schedule: {
          trainingDaysPerWeek: 5,
          restDaysBetweenCycles: 2,
          startDate: "2024-01-01",
        },
        days: [
          { dayIndex: 1, name: "D1", muscleGroups: [], exercises: [] },
          { dayIndex: 2, name: "D2", muscleGroups: [], exercises: [] },
          { dayIndex: 3, name: "D3", muscleGroups: [], exercises: [] },
          { dayIndex: 4, name: "D4", muscleGroups: [], exercises: [] },
        ],
      });
      // trainingDays = min(5, 4) = 4, restDays = 2, cycle = 6
      expect(getTemplateCycleLength(template)).toBe(6);
    });

    it("should handle zero rest days", () => {
      const template = createTemplate({
        schedule: {
          trainingDaysPerWeek: 3,
          restDaysBetweenCycles: 0,
          startDate: "2024-01-01",
        },
        days: [
          { dayIndex: 1, name: "D1", muscleGroups: [], exercises: [] },
          { dayIndex: 2, name: "D2", muscleGroups: [], exercises: [] },
          { dayIndex: 3, name: "D3", muscleGroups: [], exercises: [] },
        ],
      });
      expect(getTemplateCycleLength(template)).toBe(3);
    });

    it("should handle negative restDaysBetweenCycles (clamped to 0)", () => {
      const template = createTemplate({
        schedule: {
          trainingDaysPerWeek: 3,
          restDaysBetweenCycles: -5,
          startDate: "2024-01-01",
        },
        days: [
          { dayIndex: 1, name: "D1", muscleGroups: [], exercises: [] },
          { dayIndex: 2, name: "D2", muscleGroups: [], exercises: [] },
          { dayIndex: 3, name: "D3", muscleGroups: [], exercises: [] },
        ],
      });
      expect(getTemplateCycleLength(template)).toBe(3);
    });

    it("should return at least 1", () => {
      const template = createTemplate({
        schedule: {
          trainingDaysPerWeek: 0,
          restDaysBetweenCycles: 0,
          startDate: "2024-01-01",
        },
        days: [],
      });
      expect(getTemplateCycleLength(template)).toBe(1);
    });
  });

  describe("getTemplateStartDate", () => {
    it("should use schedule.startDate when provided", () => {
      const template = createTemplate({
        schedule: {
          trainingDaysPerWeek: 3,
          restDaysBetweenCycles: 1,
          startDate: "2024-06-15",
        },
      });
      expect(getTemplateStartDate(template)).toBe("2024-06-15");
    });

    it("should fall back to createdAt", () => {
      const template = createTemplate({
        schedule: { trainingDaysPerWeek: 3, restDaysBetweenCycles: 1 },
        createdAt: "2024-03-10",
      });
      expect(getTemplateStartDate(template)).toBe("2024-03-10");
    });
  });

  describe("getPlanForDate", () => {
    it("should return correct day for date within cycle", () => {
      const template = createTemplate();
      // startDate: 2024-01-01, cycleLength: 4 (3 training + 1 rest)
      // 2024-01-01 = day 0 (Day 1)
      const result = getPlanForDate(template, "2024-01-01");
      expect(result.isRestDay).toBe(false);
      expect(result.dayIndex).toBe(1);
      expect(result.day?.name).toBe("Day 1");
    });

    it("should return rest day correctly", () => {
      const template = createTemplate();
      // 2024-01-04 = day 3 (rest day, cycleLength=4)
      const result = getPlanForDate(template, "2024-01-04");
      expect(result.isRestDay).toBe(true);
    });

    it("should cycle correctly after multiple cycles", () => {
      const template = createTemplate();
      // 2024-01-05 = day 4 = cycleDay 0 (Day 1 again)
      const result = getPlanForDate(template, "2024-01-05");
      expect(result.isRestDay).toBe(false);
      expect(result.dayIndex).toBe(1);
    });

    it("should handle date before startDate (negative daysSince)", () => {
      const template = createTemplate();
      // Date before startDate: 2023-12-31 is 1 day before 2024-01-01
      // cycleLength = 4, daysSince = -1, cycleDay = 3 (rest day)
      const result = getPlanForDate(template, "2023-12-31");
      // Should wrap around correctly - day -1 = cycleDay 3 = rest day
      expect(result.isRestDay).toBe(true);
      expect(result.cycleDay).toBe(3);
    });

    it("should handle unsorted days array", () => {
      const template = createTemplate({
        days: [
          { dayIndex: 3, name: "Day 3", muscleGroups: ["legs"], exercises: [] },
          {
            dayIndex: 1,
            name: "Day 1",
            muscleGroups: ["chest"],
            exercises: [],
          },
          { dayIndex: 2, name: "Day 2", muscleGroups: ["back"], exercises: [] },
        ],
      });
      const result = getPlanForDate(template, "2024-01-01");
      expect(result.dayIndex).toBe(1);
      expect(result.day?.name).toBe("Day 1");
    });

    it("should handle empty days array gracefully", () => {
      const template = createTemplate({ days: [] });
      const result = getPlanForDate(template, "2024-01-01");
      expect(result.isRestDay).toBe(true);
      expect(result.day).toBeUndefined();
    });
  });

  describe("getNextWorkoutDate", () => {
    it("should return next workout date when on rest day", () => {
      const template = createTemplate();
      // 2024-01-04 is rest day, next workout is 2024-01-05 (Day 1)
      const result = getNextWorkoutDate(template, "2024-01-04");
      expect(result).toBe("2024-01-05");
    });

    it("should return next workout date when on training day", () => {
      const template = createTemplate();
      // 2024-01-01 is Day 1, next workout is 2024-01-02 (Day 2)
      const result = getNextWorkoutDate(template, "2024-01-01");
      expect(result).toBe("2024-01-02");
    });

    it("should handle date before startDate (BUG: currently returns fromDate)", () => {
      const template = createTemplate();
      // Date before startDate - should return first workout date (startDate)
      const result = getNextWorkoutDate(template, "2023-12-31");
      // Current buggy behavior returns fromDate, correct behavior should return startDate
      expect(result).toBe("2024-01-01");
    });

    it("should handle last training day before rest", () => {
      const template = createTemplate();
      // 2024-01-03 is Day 3 (last training day), next is 2024-01-05 (after rest day)
      const result = getNextWorkoutDate(template, "2024-01-03");
      expect(result).toBe("2024-01-05");
    });
  });
});
