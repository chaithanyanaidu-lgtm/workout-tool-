/**
 * PHASE 3 (cont.) — TRAINING EXPERIENCE ENGINE
 *
 * Program complexity scales with experience. This is consulted by the
 * split engine (structure), selection engine (exercise variety &
 * technical demand ceiling), volume engine (sets per muscle), and
 * progression engine (progression sophistication).
 */

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"];

const EXPERIENCE_PROFILES = {
  beginner: {
    max_exercises_per_muscle_per_session: 2,
    preferred_split_complexity: "low",       // full body / simple upper-lower
    max_technical_demand: 3,                 // avoid highly technical lifts
    sets_per_muscle_per_week: { min: 8, max: 12 },
    exercise_rotation: "stable",              // keep exercises constant for measurable progress
    progression_style: "linear_simple",
  },
  intermediate: {
    max_exercises_per_muscle_per_session: 3,
    preferred_split_complexity: "moderate",
    max_technical_demand: 4,
    sets_per_muscle_per_week: { min: 10, max: 16 },
    exercise_rotation: "block_periodized",
    progression_style: "double_progression",
  },
  advanced: {
    max_exercises_per_muscle_per_session: 4,
    preferred_split_complexity: "high",       // body-part specialization splits allowed
    max_technical_demand: 5,
    sets_per_muscle_per_week: { min: 12, max: 20 },
    exercise_rotation: "individualized",
    progression_style: "exercise_specific",
  },
};

export function getExperienceProfile(level) {
  if (!EXPERIENCE_PROFILES[level]) {
    throw new Error(`Unknown experience level "${level}". Must be one of: ${EXPERIENCE_LEVELS.join(", ")}`);
  }
  return { level, ...EXPERIENCE_PROFILES[level] };
}
