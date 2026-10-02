/**
 * CLAWW — GOAL ENGINE
 *
 * Deterministic goal priority profiles. Never fake percentage allocations.
 * Consulted by volume, selection, prescription, and cardio engines.
 *
 * Supported goals per Section 13:
 *  - hypertrophy (aliases bulking)
 *  - strength
 *  - fat_loss (aliases cutting)
 *  - recomposition
 *  - general_fitness
 *  - endurance
 *  - athletic_performance
 *  - beginner_fitness
 */

export const GOALS = [
  "hypertrophy",
  "strength",
  "fat_loss",
  "recomposition",
  "general_fitness",
  "endurance",
  "athletic_performance",
  "beginner_fitness",
  // Legacy aliases
  "bulking",
  "cutting",
];

const GOAL_ALIASES = {
  bulking: "hypertrophy",
  cutting: "fat_loss",
};

const GOAL_PRIORITIES = {
  hypertrophy: {
    primary: ["hypertrophy", "progressive_overload", "mechanical_tension"],
    secondary: ["strength", "recovery", "low_fatigue_cardio"],
  },
  strength: {
    primary: ["maximal_strength", "neural_adaptation", "progressive_overload"],
    secondary: ["hypertrophy", "fatigue_management"],
  },
  fat_loss: {
    primary: ["muscle_retention", "strength_maintenance", "energy_expenditure"],
    secondary: ["cardio", "fatigue_management"],
  },
  recomposition: {
    primary: ["hypertrophy", "strength"],
    secondary: ["conditioning", "recovery"],
  },
  general_fitness: {
    primary: ["consistency", "strength", "muscle_development", "cardiovascular_fitness"],
    secondary: ["mobility"],
  },
  endurance: {
    primary: ["aerobic_development", "conditioning", "muscular_endurance"],
    secondary: ["strength_maintenance", "fatigue_management"],
  },
  athletic_performance: {
    primary: ["power_output", "functional_strength", "multiplanar_movement", "athletic_durability"],
    secondary: ["hypertrophy", "aerobic_conditioning"],
  },
  beginner_fitness: {
    primary: ["movement_mastery", "habit_formation", "linear_progression"],
    secondary: ["aerobic_health", "confidence"],
  },
};

const GOAL_TRAINING_EMPHASIS = {
  hypertrophy: { rep_bias: "moderate", rep_range_override: { min: 8, max: 12 }, rir_bias: 2, volume_trend: "progressive_increase", rest_bias_seconds: 120 },
  strength: { rep_bias: "low", rep_range_override: { min: 4, max: 6 }, rir_bias: 2, volume_trend: "maintain", rest_bias_seconds: 180 },
  fat_loss: { rep_bias: "moderate", rep_range_override: { min: 8, max: 12 }, rir_bias: 1, volume_trend: "maintain_or_reduce", rest_bias_seconds: 90 },
  recomposition: { rep_bias: "moderate", rep_range_override: { min: 6, max: 10 }, rir_bias: 1.5, volume_trend: "maintain", rest_bias_seconds: 120 },
  general_fitness: { rep_bias: "moderate", rep_range_override: { min: 8, max: 12 }, rir_bias: 2, volume_trend: "maintain", rest_bias_seconds: 90 },
  endurance: { rep_bias: "high", rep_range_override: { min: 12, max: 20 }, rir_bias: 2, volume_trend: "maintain_resistance_grow_cardio", rest_bias_seconds: 60 },
  athletic_performance: { rep_bias: "low_moderate", rep_range_override: { min: 5, max: 8 }, rir_bias: 2, volume_trend: "maintain", rest_bias_seconds: 150 },
  beginner_fitness: { rep_bias: "moderate", rep_range_override: { min: 8, max: 12 }, rir_bias: 2.5, volume_trend: "maintain", rest_bias_seconds: 120 },
};

export function getGoalProfile(rawGoal = "general_fitness") {
  const goal = GOAL_ALIASES[rawGoal] || rawGoal;
  if (!GOAL_PRIORITIES[goal]) {
    throw new Error(`Unknown goal "${rawGoal}". Must be one of: ${GOALS.join(", ")}`);
  }
  return {
    goal,
    raw_goal: rawGoal,
    priorities: GOAL_PRIORITIES[goal],
    emphasis: GOAL_TRAINING_EMPHASIS[goal],
  };
}
