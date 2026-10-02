/**
 * CLAWW — VOLUME ENGINE
 *
 * Tracks direct sets, secondary stimulus, effective sets, per-session volume,
 * and weekly frequency across all muscle groups.
 *
 * Implements Section 9 & 10.
 */

import { MUSCLES, getExerciseById } from "../data/exercises.js";

const SECONDARY_SET_WEIGHT = 0.5;

/**
 * Computes weekly volume targets (min, max, target) per muscle.
 * Trainee priority muscles receive an appropriate volume bump (+2 to 3 sets),
 * bounded within the safe experience-level ceiling.
 */
export function computeWeeklyMuscleTargets({ experienceProfile, goalProfile, priorityMuscles = [] }) {
  const { min, max } = experienceProfile.sets_per_muscle_per_week || { min: 8, max: 14 };
  const trend = goalProfile?.emphasis?.volume_trend || "maintain";
  const prioritySet = new Set(priorityMuscles.map((m) => m.toLowerCase()));

  const targets = {};
  for (const muscle of MUSCLES) {
    let target = Math.round((min + max) / 2);

    if (trend === "progressive_increase") target = Math.round(min + (max - min) * 0.65);
    else if (trend === "maintain_or_reduce") target = Math.round(min + (max - min) * 0.35);
    else if (trend === "maintain_resistance_grow_cardio") target = Math.round(min + (max - min) * 0.4);

    // Give priority muscles a controlled volume emphasis without exceeding safe guidelines
    if (prioritySet.has(muscle)) {
      target = Math.min(max, target + 3);
    }

    targets[muscle] = { min, max, target, is_priority: prioritySet.has(muscle) };
  }

  return targets;
}

/**
 * Distribute muscle targets across training days in the split.
 */
export function distributeVolumeAcrossWeek({ splitDays, weeklyTargets }) {
  const trainingDays = splitDays.filter((d) => d.session_type !== "rest");
  const allocation = {};
  for (const day of trainingDays) allocation[day.day_index] = {};

  for (const muscle of MUSCLES) {
    const daysHitting = trainingDays.filter((d) => (d.emphasis_muscles || []).includes(muscle));
    if (daysHitting.length === 0) continue;

    const target = weeklyTargets[muscle]?.target || 10;
    const perDay = Math.max(2, Math.round(target / daysHitting.length));

    for (const day of daysHitting) {
      allocation[day.day_index][muscle] = perDay;
    }
  }

  return allocation;
}

/**
 * Computes detailed direct sets, secondary stimulus, and effective volume
 * for a single session.
 */
export function computeSessionVolume(sessionExercises) {
  const direct = {};
  const secondary = {};
  const effective = {};

  for (const item of sessionExercises) {
    const sets = item.sets || 3;
    const ex = item.exercise || getExerciseById(item.exercise_id);
    if (!ex) continue;

    const stimulus = ex.muscle_stimulus_profile || ex.stimulus_contribution || item.stimulusContribution || {};

    // Direct sets to primary muscles
    for (const m of (ex.primary_muscles || [])) {
      direct[m] = (direct[m] || 0) + sets;
      const weight = stimulus[m] ?? 1.0;
      effective[m] = (effective[m] || 0) + sets * weight;
    }

    // Secondary sets to secondary muscles
    for (const m of (ex.secondary_muscles || [])) {
      if (!(ex.primary_muscles || []).includes(m)) {
        secondary[m] = (secondary[m] || 0) + sets;
        const weight = stimulus[m] ?? SECONDARY_SET_WEIGHT;
        effective[m] = (effective[m] || 0) + sets * weight;
      }
    }
  }

  for (const m of Object.keys(effective)) {
    effective[m] = Math.round(effective[m] * 100) / 100;
  }

  return { direct, secondary, effective };
}

/**
 * Computes weekly volume summary across all generated sessions.
 * Returns direct sets, secondary sets, effective sets, and frequency per muscle.
 */
export function computeWeeklyVolumeSummary(sessions = []) {
  const summary = {};

  for (const m of MUSCLES) {
    summary[m] = {
      direct_sets: 0,
      secondary_sets: 0,
      effective_sets: 0,
      frequency_days: 0,
    };
  }

  for (const session of sessions) {
    if (session.is_rest_day || !session.exercises) continue;

    const measured = computeSessionVolume(session.exercises);
    const dayMusclesStimulated = new Set();

    for (const [m, sets] of Object.entries(measured.direct)) {
      if (summary[m]) {
        summary[m].direct_sets += sets;
        dayMusclesStimulated.add(m);
      }
    }

    for (const [m, sets] of Object.entries(measured.secondary)) {
      if (summary[m]) {
        summary[m].secondary_sets += sets;
        dayMusclesStimulated.add(m);
      }
    }

    for (const [m, eff] of Object.entries(measured.effective)) {
      if (summary[m]) {
        summary[m].effective_sets += eff;
      }
    }

    for (const m of dayMusclesStimulated) {
      if (summary[m]) summary[m].frequency_days += 1;
    }
  }

  for (const m of MUSCLES) {
    summary[m].effective_sets = Math.round(summary[m].effective_sets * 10) / 10;
  }

  return summary;
}


export { SECONDARY_SET_WEIGHT };
