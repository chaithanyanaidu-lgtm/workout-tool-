/**
 * PHASE 3 — GOAL ENGINE
 *
 * ONE training engine, five priority profiles. Never a percentage
 * allocation ("85% strength") — a ranked list of priorities that every
 * downstream engine (volume, selection, prescription, cardio) consults
 * to break ties and order emphasis.
 */

export const GOALS = ["bulking", "cutting", "recomposition", "endurance", "general_fitness"];

const GOAL_PRIORITIES = {
  bulking: {
    primary: ["hypertrophy", "progressive_overload"],
    secondary: ["strength", "recovery", "low_fatigue_cardio"],
  },
  cutting: {
    primary: ["muscle_retention", "strength_maintenance"],
    secondary: ["cardio", "fatigue_management"],
  },
  recomposition: {
    primary: ["hypertrophy", "strength"],
    secondary: ["conditioning", "recovery"],
  },
  endurance: {
    primary: ["aerobic_development", "conditioning"],
    secondary: ["strength_maintenance", "fatigue_management"],
  },
  general_fitness: {
    primary: ["consistency", "strength", "muscle_development", "cardiovascular_fitness"],
    secondary: [],
  },
};

/** Rep-range / RIR emphasis derived from goal priority, not a hard rule. */
const GOAL_TRAINING_EMPHASIS = {
  bulking: { rep_bias: "moderate", rir_bias: 2, volume_trend: "progressive_increase" },
  cutting: { rep_bias: "moderate", rir_bias: 1, volume_trend: "maintain_or_reduce" },
  recomposition: { rep_bias: "moderate", rir_bias: 1.5, volume_trend: "maintain" },
  endurance: { rep_bias: "high", rir_bias: 2, volume_trend: "maintain_resistance_grow_cardio" },
  general_fitness: { rep_bias: "moderate", rir_bias: 2, volume_trend: "maintain" },
};

export function getGoalProfile(goal) {
  if (!GOAL_PRIORITIES[goal]) {
    throw new Error(`Unknown goal "${goal}". Must be one of: ${GOALS.join(", ")}`);
  }
  return {
    goal,
    priorities: GOAL_PRIORITIES[goal],
    emphasis: GOAL_TRAINING_EMPHASIS[goal],
  };
}
