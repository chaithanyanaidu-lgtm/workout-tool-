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
    target_exercises_per_session: 3,
    compound_sets: 3,
    isolation_sets: 2,
    preferred_split_complexity: "low",       // full body / simple upper-lower
    max_technical_demand: 3,                 // avoid highly technical lifts, favors machines/cables/stable DBs
    rir_target: { compound: 2.5, isolation: 2 },
    default_rir: 2.5,
    sets_per_muscle_per_week: { min: 8, max: 12 },
    exercise_rotation: "stable",              // keep exercises constant for measurable progress
    progression_style: "linear_simple",
    progression_name: "Linear Progression",
    progression_detail: "Add 1 rep per set or micro-load (1–2.5 kg) each week while maintaining strict form and 2–3 RIR. Avoid technical failure.",
    intensity_techniques_allowed: false,
    specialization_focus: false,
  },
  intermediate: {
    max_exercises_per_muscle_per_session: 3,
    target_exercises_per_session: 5,
    compound_sets: 3,
    isolation_sets: 3,
    preferred_split_complexity: "moderate",
    max_technical_demand: 4,                 // barbell, dumbbell, cable staples
    rir_target: { compound: 1.5, isolation: 1 },
    default_rir: 1.5,
    sets_per_muscle_per_week: { min: 10, max: 16 },
    exercise_rotation: "block_periodized",
    progression_style: "double_progression",
    progression_name: "Double Progression",
    progression_detail: "Work within the prescribed rep range. Once all sets reach the top rep ceiling with clean form at 1–2 RIR, increase load next session and reset to the bottom rep target.",
    intensity_techniques_allowed: false,
    specialization_focus: false,
  },
  advanced: {
    max_exercises_per_muscle_per_session: 4,
    target_exercises_per_session: 6,
    compound_sets: 4,
    isolation_sets: 3,
    preferred_split_complexity: "high",       // body-part specialization splits allowed
    max_technical_demand: 5,                 // full technical catalog
    rir_target: { compound: 1.0, isolation: 0.5 },
    default_rir: 1.0,
    sets_per_muscle_per_week: { min: 14, max: 20 },
    exercise_rotation: "individualized",
    progression_style: "dynamic_double_progression",
    progression_name: "Dynamic Double Progression & Wave Loading",
    progression_detail: "Progress each set independently at 0–1 RIR. When any individual set reaches the rep ceiling, increase the load for that specific set next week. Wave volume across 4-week mesocycles.",
    intensity_techniques_allowed: true,
    specialization_focus: true,
  },
};

export function getExperienceProfile(level) {
  if (!EXPERIENCE_PROFILES[level]) {
    throw new Error(`Unknown experience level "${level}". Must be one of: ${EXPERIENCE_LEVELS.join(", ")}`);
  }
  return { level, ...EXPERIENCE_PROFILES[level] };
}

