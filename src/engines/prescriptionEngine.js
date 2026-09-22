/**
 * PHASE 7 — SET / REP / RIR / REST PRESCRIPTION ENGINE
 *
 * Turns a selected exercise + role + experience + goal into a concrete
 * prescription. Rep ranges/RIR come from the exercise's own recommended
 * range (grounded in its metadata), narrowed by role and goal emphasis —
 * never invented per call, never "failure for everything".
 */

const ROLE_SET_COUNTS = {
  primary: { beginner: 3, intermediate: 4, advanced: 4 },
  secondary: { beginner: 3, intermediate: 3, advanced: 4 },
  accessory: { beginner: 2, intermediate: 3, advanced: 3 },
};

function pickProgressionMethod(exercise, experienceProfile) {
  if (exercise.type === "compound" && ["barbell", "dumbbell"].some((eq) => exercise.equipment.includes(eq))) {
    return "double_progression";
  }
  if (exercise.equipment.includes("machine")) return "rep_progression_then_load";
  if (exercise.type === "isolation") return "rep_progression_small_load_increases";
  if (exercise.equipment.includes("bodyweight")) return "reps_then_external_load_then_harder_variation";
  return experienceProfile.progression_style === "exercise_specific" ? "exercise_specific" : "double_progression";
}

export function prescribeExercise({ exercise, role, experienceProfile, goalProfile }) {
  const sets = ROLE_SET_COUNTS[role]?.[experienceProfile.level] ?? 3;

  // RIR: start from exercise's own recommended RIR, nudge by goal emphasis, clamp to sane bounds.
  let rir = exercise.recommended_RIR;
  const goalRirBias = goalProfile.emphasis.rir_bias;
  if (typeof rir === "number" && typeof goalRirBias === "number") {
    rir = Math.round(((rir + goalRirBias) / 2) * 2) / 2; // average, keep half-steps
  }

  return {
    exercise_id: exercise.exercise_id,
    name: exercise.name,
    role,
    sets,
    rep_min: exercise.recommended_rep_min,
    rep_max: exercise.recommended_rep_max,
    rir,
    rest_seconds: exercise.default_rest,
    progression: pickProgressionMethod(exercise, experienceProfile),
  };
}
