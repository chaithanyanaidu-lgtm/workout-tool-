/**
 * CLAWW — ALTERNATIVE EXERCISE & SUBSTITUTION ENGINE
 *
 * "Change Exercise" must preserve TRAINING PURPOSE, not just muscle group.
 * A cable fly is a chest exercise but is NOT a valid alternative to a
 * bench press, because it drops the compound / heavy-loading role that
 * bench press serves in the program.
 *
 * Implements Section 11 & Section 17.
 */

import { EXERCISES, getExerciseById, resolveEquipmentPreset } from "../data/exercises.js";

function equipmentAvailable(exercise, availableEquipment) {
  const resolved = resolveEquipmentPreset(availableEquipment);
  return exercise.equipment.some((eq) => resolved.includes(eq));
}

function similarityScore(base, candidate) {
  let score = 0;
  score += Math.abs((base.difficulty || 2) - (candidate.difficulty || 2));
  score += Math.abs((base.stability || 2) - (candidate.stability || 2));
  score += Math.abs((base.fatigue_cost || 2) - (candidate.fatigue_cost || 2));
  score += (base.classification || base.type) === (candidate.classification || candidate.type) ? 0 : 5;
  return score;
}

/**
 * Returns ranked, purpose-preserving alternatives for `exerciseId`.
 */
export function getAlternatives({ exerciseId, availableEquipment = "full_gym", excludeIds = [], limit = 4 }) {
  const base = getExerciseById(exerciseId);
  if (!base) throw new Error(`Unknown exercise_id "${exerciseId}"`);

  const resolvedEquip = resolveEquipmentPreset(availableEquipment);

  const candidates = EXERCISES.filter((e) =>
    e.exercise_id !== base.exercise_id &&
    !excludeIds.includes(e.exercise_id) &&
    equipmentAvailable(e, resolvedEquip)
  );

  // 1. Direct alternative_ids in base metadata
  const explicitIds = new Set(base.alternative_ids || []);
  const explicitAlts = candidates.filter((e) => explicitIds.has(e.exercise_id));

  // 2. Same substitution_group = purpose preserved by design
  const sameGroup = candidates.filter((e) =>
    !explicitIds.has(e.exercise_id) &&
    e.substitution_group === base.substitution_group
  );

  // 3. Same movement pattern + same primary muscle + same classification
  const samePatternAndType = candidates.filter((e) =>
    !explicitIds.has(e.exercise_id) &&
    e.substitution_group !== base.substitution_group &&
    e.movement_pattern === base.movement_pattern &&
    (e.classification || e.type) === (base.classification || base.type) &&
    e.primary_muscles.some((m) => base.primary_muscles.includes(m))
  );

  const ranked = [
    ...explicitAlts.sort((a, b) => similarityScore(base, a) - similarityScore(base, b)),
    ...sameGroup.sort((a, b) => similarityScore(base, a) - similarityScore(base, b)),
    ...samePatternAndType.sort((a, b) => similarityScore(base, a) - similarityScore(base, b)),
  ];

  return ranked.slice(0, limit).map((e) => ({
    exercise_id: e.exercise_id,
    name: e.name,
    classification: e.classification || e.type,
    movement_pattern: e.movement_pattern,
    equipment: e.equipment,
    preserves_purpose: e.substitution_group === base.substitution_group || explicitIds.has(e.exercise_id),
    reason: (e.substitution_group === base.substitution_group || explicitIds.has(e.exercise_id))
      ? `Preserves the exact ${base.movement_pattern.replace(/_/g, " ")} loading role as ${base.name} with your available equipment.`
      : `Trains the same primary muscle and movement pattern as ${base.name}, as a close alternative.`,
  }));
}

/**
 * Handles user-initiated exercise replacement requests with reason intelligence.
 */
export function handleExerciseChangeRequest({ exerciseId, reason, availableEquipment = "full_gym", excludeIds = [] }) {
  const base = getExerciseById(exerciseId);
  if (!base) throw new Error(`Unknown exercise_id "${exerciseId}"`);

  switch (reason) {
    case "equipment_unavailable": {
      const alternatives = getAlternatives({ exerciseId, availableEquipment, excludeIds });
      return {
        action: "substitute",
        alternatives,
        message: alternatives.length
          ? `Here are equipment-compatible alternatives that preserve the same training role as ${base.name}.`
          : `No equipment-compatible alternative preserves this exercise's training role.`,
      };
    }
    case "too_difficult": {
      const alternatives = getAlternatives({ exerciseId, availableEquipment, excludeIds, limit: 6 })
        .filter((alt) => {
          const cand = getExerciseById(alt.exercise_id);
          return (cand.difficulty || 2) <= (base.difficulty || 2);
        })
        .slice(0, 4);
      return {
        action: "regress",
        alternatives,
        message: `Here are lower-technicality progressions that preserve the same training role as ${base.name}.`,
      };
    }
    case "dislike": {
      const alternatives = getAlternatives({ exerciseId, availableEquipment, excludeIds });
      return {
        action: "substitute",
        remember_preference: true,
        alternatives,
        message: `Understood. Here are alternative exercises with the same training stimulus. CLAWW will remember your preference.`,
      };
    }
    case "pain_discomfort": {
      return {
        action: "flag_and_pause",
        remember_preference: true,
        exercise_flagged: exerciseId,
        message: `${base.name} has been paused and flagged in your profile due to pain or discomfort. Consult a sports medicine professional or physical therapist before reintroducing it.`,
      };
    }
    default:
      return {
        action: "substitute",
        alternatives: getAlternatives({ exerciseId, availableEquipment, excludeIds }),
        message: `Here are available alternatives for ${base.name}.`,
      };
  }
}
