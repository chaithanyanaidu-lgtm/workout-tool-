/**
 * CLAWW — PRESCRIPTION & PROGRESSION ENGINE
 *
 * Prescribes concrete sets, reps, rest periods, intensity (RIR), and
 * understandable progression guidelines grounded in exercise classification
 * and trainee goal/experience.
 *
 * Implements Section 16 & 17 requirements.
 */

const ROLE_SET_COUNTS = {
  primary_compound: { beginner: 3, intermediate: 4, advanced: 4 },
  secondary_compound: { beginner: 3, intermediate: 3, advanced: 4 },
  secondary_movement: { beginner: 3, intermediate: 3, advanced: 3 },
  isolation: { beginner: 2, intermediate: 3, advanced: 3 },
  accessory: { beginner: 2, intermediate: 3, advanced: 3 },
  finisher: { beginner: 2, intermediate: 2, advanced: 3 },
  // Backward compatibility with legacy role strings
  primary: { beginner: 3, intermediate: 4, advanced: 4 },
  secondary: { beginner: 3, intermediate: 3, advanced: 3 },
};

function formatRest(seconds) {
  if (seconds >= 120) {
    const mins = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return remainder > 0 ? `${mins}m ${remainder}s` : `${mins}–${mins + 1} minutes`;
  }
  if (seconds >= 60) {
    return `${seconds} seconds (~${Math.round(seconds / 60)} min)`;
  }
  return `${seconds} seconds`;
}

function generateProgressionText(progressionMethod, repMin, repMax, sets, rir, level) {
  if (level === "advanced") {
    return `Dynamic Double Progression & Wave Loading (${sets} × ${repMin}–${repMax} @ ${rir} RIR): Progress each set independently. When any set hits ${repMax} reps, increase load on that set next session without waiting for others. Wave volume over a 4-week mesocycle.`;
  }
  if (level === "beginner") {
    return `Linear Progression (${sets} × ${repMin}–${repMax} @ ${rir} RIR): Strive to add 1 rep per set or micro-load each week while maintaining strict form and leaving 2–3 reps in reserve.`;
  }

  switch (progressionMethod) {
    case "double_progression":
      return `Double Progression (${sets} × ${repMin}–${repMax}): Work in the ${repMin}–${repMax} rep window. Once all ${sets} sets reach ${repMax} reps with clean technique at ~${rir} RIR, increase load by 2.5–5% next session and reset to ${repMin} reps.`;
    case "rep_progression_then_load":
      return `Rep Progression (${sets} × ${repMin}–${repMax}): Add 1 rep per set each workout. Once all sets hit ${repMax} reps cleanly, increase machine pin/weight and reset to ${repMin}.`;
    case "reps_then_variation":
      return `Bodyweight Progression (${sets} × ${repMin}–${repMax}): Build to the top of the rep range. Once you exceed ${repMax} reps on all sets, progress to a harder mechanical leverage variation.`;
    default:
      return `Standard Progression: Work within ${repMin}–${repMax} reps with ${rir} RIR. Increase resistance once the prescribed volume is completed comfortably.`;
  }
}

export function prescribeExercise({ exercise, role = "secondary", programmingRole = null, classification = null, experienceProfile = {}, goalProfile = {} }) {
  const level = experienceProfile.level || "beginner";
  const resolvedRole = role || "secondary";
  const resolvedProgRole = programmingRole || (
    resolvedRole === "primary" ? "primary_compound" :
    resolvedRole === "secondary" && (exercise.classification === "compound" || classification === "compound") ? "secondary_compound" :
    (exercise.classification === "isolation" || classification === "isolation") ? "isolation" : "accessory"
  );
  const resolvedClassification = classification || exercise.classification || (resolvedRole === "primary" ? "compound" : "isolation");

  // Determine sets
  const sets = ROLE_SET_COUNTS[resolvedProgRole]?.[level] ??
               ROLE_SET_COUNTS[resolvedRole]?.[level] ??
               (level === "advanced" ? 4 : 3);

  // Determine rep ranges based on exercise, role, and goal
  let repMin = exercise.recommended_rep_range?.min ?? exercise.recommended_rep_min ?? 8;
  let repMax = exercise.recommended_rep_range?.max ?? exercise.recommended_rep_max ?? 12;

  const goalName = goalProfile?.goal || "general_fitness";

  if (resolvedClassification === "compound" && (resolvedProgRole === "primary_compound" || resolvedRole === "primary")) {
    if (goalName === "strength") {
      repMin = 4;
      repMax = 6;
    } else if (goalName === "hypertrophy") {
      repMin = level === "advanced" ? 6 : 8;
      repMax = level === "advanced" ? 10 : 12;
    } else if (goalName === "endurance") {
      repMin = 12;
      repMax = 15;
    }
  } else if (resolvedClassification === "isolation") {
    if (goalName === "strength") {
      repMin = 8;
      repMax = 12;
    } else if (goalName === "endurance") {
      repMin = 15;
      repMax = 20;
    } else {
      repMin = 10;
      repMax = 15;
    }
  }

  // RIR
  let rir = 2;
  if (level === "beginner") {
    rir = resolvedClassification === "compound" ? 2.5 : 2;
  } else if (level === "intermediate") {
    rir = resolvedClassification === "compound" ? 1.5 : 1;
  } else if (level === "advanced") {
    rir = resolvedClassification === "compound" ? 1 : 0.5;
  }

  // Rest intervals
  let restSeconds = exercise.recommended_rest ?? exercise.default_rest ?? 120;
  if (resolvedClassification === "compound" && (resolvedProgRole === "primary_compound" || resolvedRole === "primary")) {
    restSeconds = level === "advanced" ? 180 : level === "intermediate" ? 150 : 120;
    if (goalName === "strength") restSeconds = Math.max(restSeconds, 180);
  } else if (resolvedClassification === "isolation") {
    restSeconds = level === "advanced" ? 75 : 60;
  }

  // Progression method
  let progressionMethod = "double_progression";
  if (level === "advanced") {
    progressionMethod = "dynamic_double_progression";
  } else if (level === "beginner") {
    progressionMethod = "linear_simple";
  } else if (exercise.equipment?.includes("bodyweight") && !exercise.equipment?.includes("barbell")) {
    progressionMethod = "reps_then_variation";
  } else if (resolvedClassification === "isolation" && exercise.equipment?.includes("machine")) {
    progressionMethod = "rep_progression_then_load";
  }

  const progressionText = generateProgressionText(progressionMethod, repMin, repMax, sets, rir, level);

  // Intensity technique for Advanced trainees
  let intensityTechnique = null;
  if (level === "advanced" && (resolvedClassification === "isolation" || resolvedProgRole === "accessory")) {
    intensityTechnique = "Rest-Pause: On final set, pause 15s after reaching 0 RIR, then perform 3-4 additional reps to technical failure.";
  }

  const stimulusProfile = exercise.muscle_stimulus_profile || exercise.stimulus_contribution || {
    [(exercise.primary_muscle || exercise.primary_muscles?.[0] || "chest")]: 1.0,
  };

  return {
    id: exercise.exercise_id,
    exercise_id: exercise.exercise_id,
    name: exercise.name,
    primaryMuscle: exercise.primary_muscle || exercise.primary_muscles?.[0] || "",
    primary_muscle: exercise.primary_muscle || exercise.primary_muscles?.[0] || "",
    primaryMuscles: exercise.primary_muscles || [],
    primary_muscles: exercise.primary_muscles || [],
    secondaryMuscles: exercise.secondary_muscles || [],
    secondary_muscles: exercise.secondary_muscles || [],
    supportingMuscles: exercise.supporting_muscles || [],
    supporting_muscles: exercise.supporting_muscles || [],
    classification: resolvedClassification,
    programmingRole: resolvedProgRole,
    programming_role: resolvedProgRole,
    movementPattern: exercise.movement_pattern,
    movement_pattern: exercise.movement_pattern,
    equipment: exercise.equipment || [],
    difficulty: exercise.difficulty || 2,
    sets,
    repMin,
    rep_min: repMin,
    repMax,
    rep_max: repMax,
    reps: `${repMin}–${repMax}`,
    reps_display: `${repMin}–${repMax}`,
    restSeconds,
    rest_seconds: restSeconds,
    rest_display: formatRest(restSeconds),
    rir,
    rirTarget: rir,
    intensity_display: `${rir} RIR`,
    progression: progressionMethod,
    progressionType: progressionMethod,
    progression_instruction: progressionText,
    intensityTechnique,
    intensity_technique: intensityTechnique,
    stimulusContribution: stimulusProfile,
    stimulus_contribution: stimulusProfile,
    role: resolvedRole,
  };
}

