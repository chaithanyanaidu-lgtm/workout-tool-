/**
 * CLAWW — SESSION GENERATOR
 *
 * Assembles a structured workout session:
 *  1. Movement Preparation & Warm-up (general + movement-specific ramp sets)
 *  2. Exercise Roles: Primary Compound -> Secondary Compound -> Isolation -> Accessory
 *  3. Dynamic Ordering: Promotes exercises targeting Trainee Priority Muscles
 *  4. Duration Budgeting: Trims accessory volume first when time is constrained,
 *     protecting primary compound lifts
 *  5. Data Completeness (Section 17): Attaches primary/secondary muscles,
 *     movement pattern, classification, prescription, progression, and alternatives.
 */

import { getRequiredPatterns } from "./movementPatternEngine.js";
import { selectExercisesForSession } from "./selectionEngine.js";
import { prescribeExercise } from "./prescriptionEngine.js";
import { getAlternatives } from "./alternativeEngine.js";

const SECONDS_PER_SET_WORK = 40;
const SECONDS_TRANSITION_BETWEEN_EXERCISES = 60;
const WARMUP_MINUTES_BY_SESSION = {
  full_body: 8, upper: 6, lower: 8, push: 6, pull: 6, legs: 8,
  chest: 6, back: 6, shoulders: 6, arms: 5, chest_back: 6,
  shoulders_arms: 6, quads_focus: 8, posterior_focus: 8, conditioning: 5,
};

function buildWarmup(sessionType, primaryExercise) {
  const general = "5 minutes light cardio (incline walking or stationary bike) to raise core body temperature.";
  let specific;

  if (["lower", "legs", "quads_focus", "posterior_focus"].includes(sessionType)) {
    specific = "Dynamic hip openers, leg swings, bodyweight squats, and ankle mobility drill.";
  } else if (["upper", "push", "pull", "chest", "back", "shoulders", "chest_back"].includes(sessionType)) {
    specific = "Band pull-aparts, shoulder dislocates, scapular push-ups, and thoracic spine rotations.";
  } else {
    specific = "Full-body dynamic mobility: world's greatest stretch, inchworms, and bodyweight squats.";
  }

  const rampSets = primaryExercise
    ? [`2-3 progressively heavier warm-up sets on ${primaryExercise.name} ramping up to working weight.`]
    : ["1-2 light specific warm-up sets ramping into first exercise."];

  return {
    duration_minutes: WARMUP_MINUTES_BY_SESSION[sessionType] ?? 6,
    general_preparation: general,
    movement_preparation: specific,
    ramp_sets: rampSets,
  };
}

function estimateExerciseSeconds(rx) {
  const rest = rx.rest_seconds ?? rx.restSeconds ?? 90;
  return (rx.sets * (SECONDS_PER_SET_WORK + rest)) + SECONDS_TRANSITION_BETWEEN_EXERCISES;
}

/**
 * Exercise Ordering (Section 8 & 10 & 27.7):
 * Primary compounds -> Secondary compounds -> Secondary movements -> Isolations -> Accessories -> Finishers.
 * Exercises targeting trainee priority muscles are elevated within their tier.
 */
function orderExercises(prescriptions, priorityMuscles = []) {
  const prioritySet = new Set(priorityMuscles.map((m) => m.toLowerCase()));
  const roleRank = {
    primary_compound: 0,
    primary: 0,
    secondary_compound: 1,
    secondary: 1,
    secondary_movement: 2,
    isolation: 3,
    accessory: 4,
    finisher: 5,
  };

  return [...prescriptions].sort((a, b) => {
    const rankA = roleRank[a.programming_role] ?? roleRank[a.role] ?? 2;
    const rankB = roleRank[b.programming_role] ?? roleRank[b.role] ?? 2;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Within same tier, promote priority muscles earlier
    const aIsPriority = (a.primary_muscles || []).some((m) => prioritySet.has(m)) || prioritySet.has(a.primary_muscle);
    const bIsPriority = (b.primary_muscles || []).some((m) => prioritySet.has(m)) || prioritySet.has(b.primary_muscle);

    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;

    return 0;
  });
}

/**
 * Duration Budgeting (Section 14 & 27.12 & 27.13):
 * Fits exercises realistically to available duration.
 * Protects primary compound lifts.
 */
function fitToDuration(prescriptions, warmup, availableMinutes) {
  const targetMins = availableMinutes || 60;
  const budgetSeconds = targetMins * 60 - (warmup.duration_minutes * 60);

  // Target minimum and maximum exercise counts by duration bracket:
  let minCount = 3;
  let maxCount = 5;
  if (targetMins <= 35) { minCount = 2; maxCount = 3; }
  else if (targetMins <= 50) { minCount = 3; maxCount = 5; }
  else if (targetMins <= 65) { minCount = 4; maxCount = 6; }
  else if (targetMins <= 80) { minCount = 5; maxCount = 7; }
  else { minCount = 6; maxCount = 8; }

  let used = 0;
  const kept = [];
  const trimmed = [];

  for (const rx of prescriptions) {
    const cost = estimateExerciseSeconds(rx);
    const isPrimary = rx.programming_role === "primary_compound" || rx.role === "primary";

    if (isPrimary || (kept.length < maxCount && (used + cost <= budgetSeconds + 300 || kept.length < minCount))) {
      kept.push(rx);
      used += cost;
    } else {
      trimmed.push(rx.name);
    }
  }

  // Ensure at least minCount exercises remain if available
  if (kept.length < minCount && prescriptions.length >= minCount) {
    for (const p of prescriptions) {
      if (!kept.some((k) => k.exercise_id === p.exercise_id)) {
        kept.push(p);
        used += estimateExerciseSeconds(p);
        if (kept.length >= minCount) break;
      }
    }
  }

  const estimatedMinutes = Math.round((used + warmup.duration_minutes * 60) / 60);
  return { ordered: kept, trimmed, estimated_minutes: estimatedMinutes };
}

export function generateSession({
  dayIndex,
  sessionType,
  emphasisMuscles = [],
  availableEquipment = "full_gym",
  experienceProfile,
  goalProfile,
  goal = "general_fitness",
  priorityMuscles = [],
  userPrefs = {},
  stableSelections = {},
  sessionDurationMinutes = 60,
  cardioPlan = null,
}) {
  if (sessionType === "rest") {
    return {
      day: dayIndex,
      day_index: dayIndex,
      session_type: "rest",
      exercises: [],
      is_rest_day: true,
      total_sets: 0,
      totalSets: 0,
      estimated_duration_minutes: 0,
      estimatedDuration: 0,
    };
  }

  // 1. Resolve required patterns taking duration, experience & priorities into account
  const requiredPatterns = getRequiredPatterns(sessionType, emphasisMuscles, {
    duration: sessionDurationMinutes,
    experience: experienceProfile?.level,
    priorityMuscles,
  });

  // 2. Select exercises
  const selections = selectExercisesForSession({
    requiredPatterns,
    availableEquipment,
    experienceProfile,
    userPrefs,
    goal,
    priorityMuscles,
    stableSelections,
  }).filter((s) => s.exercise);

  // 3. Prescribe exercise parameters (Sets, Reps, Rest, RIR, Progression)
  const prescriptions = selections.map((s) => {
    const rx = prescribeExercise({
      exercise: s.exercise,
      role: s.role,
      programmingRole: s.programming_role,
      classification: s.classification,
      experienceProfile,
      goalProfile,
    });

    // 4. Attach purpose-preserving alternatives (Section 11 & 17 & 27.10)
    const alternatives = getAlternatives({
      exerciseId: s.exercise.exercise_id,
      availableEquipment,
      excludeIds: [s.exercise.exercise_id],
      limit: 4,
    });

    return {
      ...rx,
      _movementPattern: s.pattern,
      _fatigueCost: s.exercise.fatigue_cost,
      explanation: s.reason,
      alternatives,
    };
  });

  // 5. Order exercises respecting compounds and priority muscles (Section 8 & 10 & 27.7)
  const orderedByPriority = orderExercises(prescriptions, priorityMuscles);

  // 6. Build warm-up
  const primaryEx = selections.find((s) => s.programming_role === "primary_compound" || s.role === "primary")?.exercise || selections[0]?.exercise || null;
  const warmup = buildWarmup(sessionType, primaryEx);

  // 7. Fit to duration budget (Section 14 & 27.12)
  const { ordered: finalExercises, trimmed, estimated_minutes } = fitToDuration(
    orderedByPriority,
    warmup,
    sessionDurationMinutes
  );

  // Clean internal bookkeeping underscores
  const cleanExercises = finalExercises.map(({ _movementPattern, _fatigueCost, ...rest }) => rest);

  const totalSets = cleanExercises.reduce((sum, e) => sum + (e.sets || 0), 0);

  const includeCardio = cardioPlan && !["legs", "lower", "quads_focus"].includes(sessionType)
    ? { note: `Optional ${cardioPlan.modality_name || "Zone 2 Cardio"}, 10-15 min post-workout or off-time.` }
    : null;

  return {
    day: dayIndex,
    day_index: dayIndex,
    title: sessionType,
    session_type: sessionType,
    is_rest_day: false,
    warmup,
    exercises: cleanExercises,
    optional_cardio: includeCardio,
    totalSets,
    total_sets: totalSets,
    estimatedDuration: estimated_minutes,
    estimated_duration_minutes: estimated_minutes,
    trimmed_for_time: trimmed,
    locked_selections: Object.fromEntries(selections.map((s) => [s.pattern, s.exercise.exercise_id])),
  };
}

