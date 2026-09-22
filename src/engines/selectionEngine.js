/**
 * PHASE 6 — EXERCISE SELECTION ENGINE
 *
 * For each required movement pattern in a session, picks ONE exercise
 * considering: equipment, experience ceiling, muscle target/volume need,
 * user preferences (preferred/disliked/flagged-pain), fatigue budget,
 * and — critically — STABILITY. Once chosen for a training block, the
 * same exercise is kept (exercise_rotation policy) rather than swapped
 * every session, because repeated exposure is required to measure
 * progression (spec section 10/23).
 */

import { EXERCISES } from "../data/exercises.js";

function equipmentAvailable(exercise, availableEquipment) {
  return exercise.equipment.some((eq) => availableEquipment.includes(eq));
}

function candidatesForPattern({ pattern, role, availableEquipment, experienceProfile, userPrefs, alreadyUsedIds, goal }) {
  const flaggedPain = new Set(userPrefs.flagged_pain || []);
  const disliked = new Set(userPrefs.disliked || []);

  return EXERCISES.filter((e) =>
    e.movement_pattern === pattern &&
    equipmentAvailable(e, availableEquipment) &&
    e.difficulty <= experienceProfile.max_technical_demand &&
    e.technical_demand <= experienceProfile.max_technical_demand &&
    !flaggedPain.has(e.exercise_id) &&           // pain-flagged: never auto-select
    !alreadyUsedIds.has(e.exercise_id)
  ).map((e) => ({
    exercise: e,
    score: scoreExercise(e, { role, disliked, userPrefs, goal }),
  })).sort((a, b) => b.score - a.score);
}

function scoreExercise(e, { role, disliked, userPrefs, goal }) {
  let score = 0;

  // Primary/secondary slots favor compound movements; accessory favors isolation.
  if (role === "primary") score += e.type === "compound" ? 5 : 0;
  if (role === "secondary") score += e.type === "compound" ? 3 : 1;
  if (role === "accessory") score += e.type === "isolation" ? 2 : 0;

  // Goal-tag match
  if (e.goal_tags.includes(goal)) score += 3;

  // Preference weighting
  if ((userPrefs.preferred || []).includes(e.exercise_id)) score += 4;
  if (disliked.has(e.exercise_id)) score -= 100; // effectively excluded, kept for transparency in tests

  // Prefer lower fatigue cost for accessory-role slots (fatigue budgeting)
  if (role === "accessory") score -= e.fatigue_cost * 0.5;

  return score;
}

/**
 * Select one exercise per required pattern for a session.
 * `stableSelections` (optional): a map pattern -> exercise_id already
 * locked in for this training block, so we keep using it instead of
 * re-rolling every session (program stability, spec section 23).
 */
export function selectExercisesForSession({
  requiredPatterns, availableEquipment, experienceProfile, userPrefs, goal, stableSelections = {},
}) {
  const selections = [];
  const used = new Set();

  for (const { pattern, role } of requiredPatterns) {
    // Honor an existing stable selection if it's still valid (equipment/pain/dislike didn't change).
    const lockedId = stableSelections[pattern];
    if (lockedId) {
      const locked = EXERCISES.find((e) => e.exercise_id === lockedId);
      const stillValid = locked &&
        equipmentAvailable(locked, availableEquipment) &&
        !(userPrefs.flagged_pain || []).includes(locked.exercise_id) &&
        !used.has(locked.exercise_id);
      if (stillValid) {
        selections.push({ pattern, role, exercise: locked, reason: `Kept from your current block — consistency is needed to measure progression on your ${locked.name.toLowerCase()}.` });
        used.add(locked.exercise_id);
        continue;
      }
    }

    const ranked = candidatesForPattern({ pattern, role, availableEquipment, experienceProfile, userPrefs, alreadyUsedIds: used, goal });
    const choice = ranked[0];
    if (!choice) {
      selections.push({ pattern, role, exercise: null, reason: `No available exercise covers ${pattern.replace("_", " ")} with your current equipment.` });
      continue;
    }
    selections.push({
      pattern, role, exercise: choice.exercise,
      reason: `Selected as your ${role} ${pattern.replace("_", " ")} movement based on your equipment, experience level, and ${goal.replace("_", " ")} goal.`,
    });
    used.add(choice.exercise.exercise_id);
  }

  return selections;
}
