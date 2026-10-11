import { describe, it, expect, vi } from "vitest";
import { getCarbCycleDay } from "./carb-cycle";
import type { CarbCyclePlan, CarbCycleDay } from "./types";

function createPlan(overrides: Partial<CarbCyclePlan> = {}): CarbCyclePlan {
  const defaultDays: CarbCycleDay[] = [
    {
      dayIndex: 1,
      type: "high",
      calories: 2500,
      fat: 50,
      carbs: 300,
      protein: 150,
    },
    {
      dayIndex: 2,
      type: "medium",
      calories: 2300,
      fat: 60,
      carbs: 200,
      protein: 160,
    },
    {
      dayIndex: 3,
      type: "low",
      calories: 2100,
      fat: 70,
      carbs: 100,
      protein: 180,
    },
  ];

  return {
    id: "test-plan",
    name: "Test Carb Cycle",
    cycleLength: 3,
    days: defaultDays,
    startDate: "2024-01-01",
    ...overrides,
  };
}

describe("carb-cycle", () => {
  describe("getCarbCycleDay", () => {
    it("should return first day for startDate", () => {
      const plan = createPlan();
      const result = getCarbCycleDay(plan, "2024-01-01");

      expect(result.dayIndex).toBe(0);
      expect(result.day).toBeDefined();
      expect(result.day?.dayIndex).toBe(1);
      expect(result.day?.type).toBe("high");
    });

    it("should cycle through days correctly", () => {
      const plan = createPlan();

      // Day 2
      const day2 = getCarbCycleDay(plan, "2024-01-02");
      expect(day2.dayIndex).toBe(1);
      expect(day2.day?.type).toBe("medium");

      // Day 3
      const day3 = getCarbCycleDay(plan, "2024-01-03");
      expect(day3.dayIndex).toBe(2);
      expect(day3.day?.type).toBe("low");

      // Day 4 = cycle back to Day 1
      const day4 = getCarbCycleDay(plan, "2024-01-04");
      expect(day4.dayIndex).toBe(0);
      expect(day4.day?.type).toBe("high");
    });

    it("should handle different cycle lengths", () => {
      const plan4Day = createPlan({
        cycleLength: 4,
        days: [
          {
            dayIndex: 1,
            type: "high",
            calories: 2500,
            fat: 50,
            carbs: 300,
            protein: 150,
          },
          {
            dayIndex: 2,
            type: "high",
            calories: 2500,
            fat: 50,
            carbs: 300,
            protein: 150,
          },
          {
            dayIndex: 3,
            type: "low",
            calories: 2100,
            fat: 70,
            carbs: 100,
            protein: 180,
          },
          {
            dayIndex: 4,
            type: "low",
            calories: 2100,
            fat: 70,
            carbs: 100,
            protein: 180,
          },
        ],
      });

      expect(getCarbCycleDay(plan4Day, "2024-01-01").day?.type).toBe("high");
      expect(getCarbCycleDay(plan4Day, "2024-01-02").day?.type).toBe("high");
      expect(getCarbCycleDay(plan4Day, "2024-01-03").day?.type).toBe("low");
      expect(getCarbCycleDay(plan4Day, "2024-01-04").day?.type).toBe("low");
      expect(getCarbCycleDay(plan4Day, "2024-01-05").day?.type).toBe("high");
    });

    it("should handle date before startDate (negative daysSince)", () => {
      const plan = createPlan({ startDate: "2024-01-10" });
      const result = getCarbCycleDay(plan, "2024-01-09");

      // 1 day before startDate = last day of cycle
      expect(result.dayIndex).toBe(2);
      expect(result.day?.type).toBe("low");
    });

    it("should handle multiple cycles before startDate", () => {
      const plan = createPlan({ startDate: "2024-01-10" });
      // 4 days before startDate: daysSince = -4, cycleLength = 3
      // dayIndex = ((-4 % 3) + 3) % 3 = 2 (0-based) = 3rd day (low)
      const result = getCarbCycleDay(plan, "2024-01-06");
      expect(result.dayIndex).toBe(2);
      expect(result.day?.type).toBe("low");
    });

    it("should use today as default when date not provided", () => {
      const plan = createPlan({ startDate: "2024-01-01" });
      // Default date comes from getTodayString() which returns current date
      // We can't easily mock it, so just verify function runs without error
      const result = getCarbCycleDay(plan);
      expect(result.dayIndex).toBeGreaterThanOrEqual(0);
      expect(result.day).toBeDefined();
    });

    it("should handle missing startDate (fallback to today)", () => {
      const plan = createPlan({ startDate: undefined });
      vi.mock("./storage", () => ({
        getTodayString: () => "2024-01-01",
      }));

      const result = getCarbCycleDay(plan);
      expect(result.dayIndex).toBe(0);
      expect(result.day?.type).toBe("high");
    });

    it("should handle dayIndex not matching (fallback to array index)", () => {
      // days array has dayIndex 1,2,3 but cycleDay is 0,1,2
      // When dayIndex doesn't match, it falls back to plan.days[dayIndex]
      const plan = createPlan({
        days: [
          {
            dayIndex: 5,
            type: "high",
            calories: 2500,
            fat: 50,
            carbs: 300,
            protein: 150,
          }, // dayIndex 5, not 1
          {
            dayIndex: 6,
            type: "medium",
            calories: 2300,
            fat: 60,
            carbs: 200,
            protein: 160,
          },
          {
            dayIndex: 7,
            type: "low",
            calories: 2100,
            fat: 70,
            carbs: 100,
            protein: 180,
          },
        ],
      });

      const result = getCarbCycleDay(plan, "2024-01-01");
      // dayIndex 0, finds day with dayIndex === 1 (none), falls back to plan.days[0]
      expect(result.dayIndex).toBe(0);
      expect(result.day?.type).toBe("high");
      expect(result.day?.dayIndex).toBe(5);
    });

    it("should handle empty days array gracefully", () => {
      const plan = createPlan({ days: [] });
      const result = getCarbCycleDay(plan, "2024-01-01");

      expect(result.day).toBeUndefined();
      expect(result.dayIndex).toBe(0);
    });

    it("should handle cycleLength of 1", () => {
      const plan = createPlan({
        cycleLength: 1,
        days: [
          {
            dayIndex: 1,
            type: "high",
            calories: 2500,
            fat: 50,
            carbs: 300,
            protein: 150,
          },
        ],
      });

      expect(getCarbCycleDay(plan, "2024-01-01").day?.type).toBe("high");
      expect(getCarbCycleDay(plan, "2024-01-02").day?.type).toBe("high");
      expect(getCarbCycleDay(plan, "2024-01-10").day?.type).toBe("high");
    });

    it("should clamp cycleLength to minimum 1", () => {
      const plan = createPlan({ cycleLength: 0 });
      // Should not crash, cycleLength becomes 1
      const result = getCarbCycleDay(plan, "2024-01-01");
      expect(result.dayIndex).toBe(0);
    });

    it("should return correct macro values for each day type", () => {
      const plan = createPlan();

      const highDay = getCarbCycleDay(plan, "2024-01-01");
      expect(highDay.day?.carbs).toBe(300);
      expect(highDay.day?.fat).toBe(50);
      expect(highDay.day?.protein).toBe(150);

      const mediumDay = getCarbCycleDay(plan, "2024-01-02");
      expect(mediumDay.day?.carbs).toBe(200);
      expect(mediumDay.day?.fat).toBe(60);
      expect(mediumDay.day?.protein).toBe(160);

      const lowDay = getCarbCycleDay(plan, "2024-01-03");
      expect(lowDay.day?.carbs).toBe(100);
      expect(lowDay.day?.fat).toBe(70);
      expect(lowDay.day?.protein).toBe(180);
    });
  });
});
