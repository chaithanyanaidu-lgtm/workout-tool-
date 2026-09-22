/**
 * PHASE 5 — MUSCLE VOLUME ENGINE
 *
 * Determines weekly target volume (sets) per muscle group from
 * experience-level ranges, then distributes it across the week's
 * training days that emphasize that muscle. Tracks direct + secondary
 * (fractional) contribution so overlapping exercises don't silently
 * stack hidden volume.
 *
 * SECONDARY_SET_WEIGHT: a secondary-mover set counts as a fraction of a
 * direct set toward that muscle's weekly total. This is an internal
 * accounting convention (not a physiological claim) used purely to stop
 * volume double-counting when exercises overlap.
 */

import { MUSCLES } from "../data/exercises.js";

const SECONDARY_SET_WEIGHT = 0.5;

/**
 * weeklyTargets: { muscle: {min, max} } sourced from the experience profile,
 * nudged slightly by goal emphasis (bulking trends toward the top of the
 * range over a block; cutting stays mid-range to manage fatigue).
 */
export function computeWeeklyMuscleTargets({ experienceProfile, goalProfile }) {
  const { min, max } = experienceProfile.sets_per_muscle_per_week;
  const trend = goalProfile.emphasis.volume_trend;

  const targets = {};
  for (const muscle of MUSCLES) {
    let target = Math.round((min + max) / 2);
    if (trend === "progressive_increase") target = Math.round(min + (max - min) * 0.65);
    if (trend === "maintain_or_reduce") target = Math.round(min + (max - min) * 0.35);
    if (trend === "maintain") target = Math.round(min + (max - min) * 0.5);
    if (trend === "maintain_resistance_grow_cardio") target = Math.round(min + (max - min) * 0.4);
    targets[muscle] = { min, max, target };
  }
  return targets;
}

/**
 * Given the split's training days (with emphasis_muscles), distribute each
 * muscle's weekly target across the days that train it, weighted by how
 * central that muscle is to the day's session_type.
 * Returns: { day_index: { muscle: setsAllocated } }
 */
export function distributeVolumeAcrossWeek({ splitDays, weeklyTargets }) {
  const trainingDays = splitDays.filter((d) => d.session_type !== "rest");
  const allocation = {};
  for (const day of trainingDays) allocation[day.day_index] = {};

  for (const muscle of MUSCLES) {
    const daysHitting = trainingDays.filter((d) => d.emphasis_muscles.includes(muscle));
    if (daysHitting.length === 0) continue;
    const target = weeklyTargets[muscle].target;
    const perDay = Math.max(2, Math.round(target / daysHitting.length));
    for (const day of daysHitting) {
      allocation[day.day_index][muscle] = perDay;
    }
  }
  return allocation;
}

/**
 * Given a list of already-selected exercises for a session, compute the
 * effective volume contributed per muscle (direct sets full weight,
 * secondary sets fractional) so the validation engine can check against
 * the day's allocation without double-counting overlap.
 */
export function computeSessionVolume(sessionExercises) {
  const totals = {};
  for (const ex of sessionExercises) {
    const sets = ex.sets;
    for (const m of ex.exercise.primary_muscles) {
      totals[m] = (totals[m] || 0) + sets;
    }
    for (const m of ex.exercise.secondary_muscles) {
      totals[m] = (totals[m] || 0) + sets * SECONDARY_SET_WEIGHT;
    }
  }
  return totals;
}

export { SECONDARY_SET_WEIGHT };
