import { describe, it, expect } from 'vitest';
import { calculateNutritionRecommendation, getRecommendedFoods, getAllFoods, searchFoods } from './nutrition-engine';
import type { UserProfile } from './types';

describe('nutrition-engine', () => {
  const baseProfile: UserProfile = {
    weightUnit: 'kg',
    restTimerMode: 'countUp',
    defaultRestSeconds: 90,
    includeWarmupInStats: false,
    activityLevel: 'moderate',
    nutritionGoal: 'maintenance',
    favoriteFoodIds: [],
    sleepHours: 7,
    age: 30,
    gender: 'male',
    height: 180,
  };

  describe('calculateNutritionRecommendation', () => {
    it('should calculate fat_loss correctly', () => {
      const result = calculateNutritionRecommendation(baseProfile, 'fat_loss', 80);
      
      expect(result.dailyCalories).toBeGreaterThan(0);
      expect(result.protein.grams).toBe(176); // 80 * 2.2
      expect(result.fats.grams).toBe(64); // 80 * 0.8
      expect(result.carbs.grams).toBeGreaterThanOrEqual(0);
      expect(result.goal).toBe('fat_loss');
    });

    it('should calculate muscle_gain correctly', () => {
      const result = calculateNutritionRecommendation(baseProfile, 'muscle_gain', 80);
      
      expect(result.dailyCalories).toBeGreaterThan(0);
      expect(result.protein.grams).toBe(176); // 80 * 2.2
      expect(result.fats.grams).toBe(80); // 80 * 1
      expect(result.carbs.grams).toBeGreaterThanOrEqual(0);
      expect(result.goal).toBe('muscle_gain');
    });

    it('should calculate maintenance correctly (BUG: was returning NaN)', () => {
      const result = calculateNutritionRecommendation(baseProfile, 'maintenance', 80);
      
      expect(result.dailyCalories).toBeGreaterThan(0);
      expect(result.protein.grams).toBe(144); // 80 * 1.8
      expect(result.fats.grams).toBe(72); // 80 * 0.9
      expect(result.carbs.grams).toBeGreaterThanOrEqual(0);
      expect(result.goal).toBe('maintenance');
      // Critical: ensure no NaN values
      expect(Number.isNaN(result.dailyCalories)).toBe(false);
      expect(Number.isNaN(result.protein.grams)).toBe(false);
      expect(Number.isNaN(result.fats.grams)).toBe(false);
      expect(Number.isNaN(result.carbs.grams)).toBe(false);
    });

    it('should handle different activity levels', () => {
      const sedentary = calculateNutritionRecommendation(baseProfile, 'maintenance', 80, 'sedentary');
      const veryActive = calculateNutritionRecommendation(baseProfile, 'maintenance', 80, 'very_active');
      
      // very_active should have higher calories than sedentary
      expect(veryActive.dailyCalories).toBeGreaterThan(sedentary.dailyCalories);
    });

    it('should handle female gender', () => {
      const femaleProfile = { ...baseProfile, gender: 'female' as const, height: 165, age: 25 };
      const result = calculateNutritionRecommendation(femaleProfile, 'maintenance', 60);
      
      expect(result.dailyCalories).toBeGreaterThan(0);
      expect(result.protein.grams).toBe(108); // 60 * 1.8
    });

    it('should handle other gender', () => {
      const otherProfile = { ...baseProfile, gender: 'other' as const };
      const result = calculateNutritionRecommendation(otherProfile, 'maintenance', 70);
      
      expect(result.dailyCalories).toBeGreaterThan(0);
      expect(Number.isNaN(result.dailyCalories)).toBe(false);
    });
  });

  describe('getRecommendedFoods', () => {
    it('should filter by goal', () => {
      const fatLossFoods = getRecommendedFoods('fat_loss');
      const muscleGainFoods = getRecommendedFoods('muscle_gain');
      
      expect(fatLossFoods.length).toBeGreaterThan(0);
      expect(muscleGainFoods.length).toBeGreaterThan(0);
      
      // muscle_gain should include foods marked for muscle_gain
      const whiteRice = muscleGainFoods.find(f => f.id === 'white_rice');
      expect(whiteRice).toBeDefined();
    });

    it('should filter by category', () => {
      const proteins = getRecommendedFoods('fat_loss', 'protein');
      const carbs = getRecommendedFoods('fat_loss', 'carbs');
      
      expect(proteins.every(f => f.category === 'protein')).toBe(true);
      expect(carbs.every(f => f.category === 'carbs')).toBe(true);
    });
  });

  describe('getAllFoods', () => {
    it('should return all foods', () => {
      const all = getAllFoods();
      expect(all.length).toBeGreaterThan(20);
    });
  });

  describe('searchFoods', () => {
    it('should find foods by name', () => {
      const results = searchFoods('鸡');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(f => f.name.includes('鸡'))).toBe(true);
    });

    it('should return empty for non-existent', () => {
      const results = searchFoods('不存在的食物xyz');
      expect(results.length).toBe(0);
    });
  });
});