/**
 * PHASE 8, 15-18 — SESSION GENERATOR
 *
 * Assembles: warm-up -> primary -> secondary compound -> secondary
 * movement -> isolation/accessory -> optional accessory -> core/cardio,
 * respecting session_duration by trimming lowest-priority work first
 * (never a random truncation), and pairs compatible low-fatigue
 * isolation exercises into supersets when time is tight.
 */

import { getRequiredPatterns } from "./movementPatternEngine.js";
import { selectExercisesForSession } from "./selectionEngine.js";
import { prescribeExercise } from "./prescriptionEngine.js";

const SECONDS_PER_SET_WORK = 40; // rough time-on-set estimate for duration budgeting
const WARMUP_MINUTES_BY_SESSION = { full_body: 8, upper: 6, lower: 8, push: 6, pull: 6, legs: 8 };

function buildWarmup(sessionType, primaryExercise) {
  const general = "5 minutes light general cardio (bike or brisk walk) to raise core temperature.";
  let specific;
  if (["lower", "legs", "full_body"].includes(sessionType)) {
    specific = "Bodyweight squats, hip hinges, and leg swings to prepare the hips and knees.";
  } else {
    specific = "Band pull-aparts and shoulder circles to prepare the shoulders and scapula.";
  }
  const rampSets = primaryExercise
    ? [`2 progressively heavier warm-up sets of ${primaryExercise.name} building to your working weight.`]
    : [];

  return {
    duration_minutes: WARMUP_MINUTES_BY_SESSION[sessionType] ?? 6,
    general_preparation: general,
    movement_preparation: specific,
    ramp_sets: rampSets,
  };
}

function estimateExerciseSeconds(rx) {
  return rx.sets * (SECONDS_PER_SET_WORK + rx.rest_seconds);
}

/** PHASE 17 — SUPERSET ENGINE: pair only compatible, low-fatigue accessory slots. */
function applySupersets(prescriptions) {
  const paired = [];
  const isolationAccessories = prescriptions.filter((p) => p.role === "accessory" && p._exerciseType === "isolation" && p._fatigueCost <= 2);
  const usedIds = new Set();

  for (let i = 0; i < isolationAccessories.length; i++) {
    const a = isolationAccessories[i];
    if (usedIds.has(a.exercise_id)) continue;
    const b = isolationAccessories.slice(i + 1).find((cand) =>
      !usedIds.has(cand.exercise_id) &&
      cand._movementPattern !== a._movementPattern // avoid pairing same movement pattern twice
    );
    if (b) {
      paired.push({ superset_with: [a.exercise_id, b.exercise_id] });
      usedIds.add(a.exercise_id);
      usedIds.add(b.exercise_id);
    }
  }

  return prescriptions.map((p) => {
    const group = paired.find((g) => g.superset_with.includes(p.exercise_id));
    return group ? { ...p, superset_group: group.superset_with } : p;
  });
}

/** PHASE 16 — SESSION-TIME OPTIMIZATION: trim lowest priority first, never randomly. */
function fitToDuration(prescriptions, warmup, availableMinutes) {
  const priorityOrder = { primary: 0, secondary: 1, accessory: 2 };
  const sorted = [...prescriptions].sort((a, b) => priorityOrder[a.role] - priorityOrder[b.role]);

  const budgetSeconds = availableMinutes * 60 - warmup.duration_minutes * 60;
  let used = 0;
  const kept = [];
  const trimmed = [];

  for (const rx of sorted) {
    const cost = estimateExerciseSeconds(rx);
    if (used + cost <= budgetSeconds || rx.role === "primary") {
      kept.push(rx);
      used += cost;
    } else {
      trimmed.push(rx.name);
    }
  }
  // restore original order (primary..accessory as generated) for kept items
  const keptIds = new Set(kept.map((k) => k.exercise_id));
  const ordered = prescriptions.filter((p) => keptIds.has(p.exercise_id));
  return { ordered, trimmed, estimated_minutes: Math.round((used + warmup.duration_minutes * 60) / 60) };
}

export function generateSession({
  dayIndex, sessionType, availableEquipment, experienceProfile, goalProfile, goal,
  userPrefs, stableSelections = {}, sessionDurationMinutes, cardioPlan = null,
}) {
  if (sessionType === "rest") {
    return { day_index: dayIndex, session_type: "rest", exercises: [], is_rest_day: true };
  }

  const requiredPatterns = getRequiredPatterns(sessionType);
  const selections = selectExercisesForSession({
    requiredPatterns, availableEquipment, experienceProfile, userPrefs, goal, stableSelections,
  }).filter((s) => s.exercise);

  const prescriptions = selections.map((s) => {
    const rx = prescribeExercise({ exercise: s.exercise, role: s.role, experienceProfile, goalProfile });
    return {
      ...rx,
      _movementPattern: s.pattern,
      _exerciseType: s.exercise.type,
      _fatigueCost: s.exercise.fatigue_cost,
      explanation: s.reason,
    };
  });

  const primaryEx = selections.find((s) => s.role === "primary")?.exercise || null;
  const warmup = buildWarmup(sessionType, primaryEx);

  let { ordered, trimmed, estimated_minutes } = fitToDuration(prescriptions, warmup, sessionDurationMinutes);
  ordered = applySupersets(ordered);

  // Strip internal bookkeeping fields before returning to API consumers.
  const cleanExercises = ordered.map(({ _movementPattern, _exerciseType, _fatigueCost, ...rest }) => rest);

  const includeCardio = cardioPlan && ["full_body", "lower", "legs"].includes(sessionType) === false
    ? false
    : Boolean(cardioPlan);

  return {
    day_index: dayIndex,
    session_type: sessionType,
    is_rest_day: false,
    warmup,
    exercises: cleanExercises,
    optional_cardio: includeCardio ? { note: `Optional ${cardioPlan.modality_name}, 10-15 min low/moderate intensity.` } : null,
    estimated_duration_minutes: estimated_minutes,
    trimmed_for_time: trimmed,
    locked_selections: Object.fromEntries(selections.map((s) => [s.pattern, s.exercise.exercise_id])),
  };
}
