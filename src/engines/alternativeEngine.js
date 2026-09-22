/**
 * PHASE 2 — ALTERNATIVE EXERCISE ENGINE
 *
 * "Change Exercise" must preserve TRAINING PURPOSE, not just muscle group.
 * A cable fly is a chest exercise but is NOT a valid alternative to a
 * bench press, because it drops the compound / heavy-loading role that
 * bench press serves in the program.
 *
 * Alternatives are ranked using: same substitution_group first (purpose
 * preserved by construction), else same movement_pattern + same primary
 * muscle + same compound/isolation type, ranked by closeness of
 * difficulty/stability/fatigue_cost and equipment availability.
 */

import { EXERCISES, getExerciseById } from "../data/exercises.js";

function equipmentAvailable(exercise, availableEquipment) {
  return exercise.equipment.some((eq) => availableEquipment.includes(eq));
}

function similarityScore(base, candidate) {
  // Lower is more similar. Purely an internal ranking signal.
  let score = 0;
  score += Math.abs(base.difficulty - candidate.difficulty);
  score += Math.abs(base.stability - candidate.stability);
  score += Math.abs(base.fatigue_cost - candidate.fatigue_cost);
  score += base.type === candidate.type ? 0 : 3; // compound vs isolation mismatch is heavily penalized
  return score;
}

/**
 * Returns ranked alternatives for `exerciseId` that preserve training
 * purpose, filtered by available equipment and excluded ids (e.g.
 * exercises already in the session, or ones the user dislikes/flagged).
 */
export function getAlternatives({ exerciseId, availableEquipment, excludeIds = [], limit = 4 }) {
  const base = getExerciseById(exerciseId);
  if (!base) throw new Error(`Unknown exercise_id "${exerciseId}"`);

  const candidates = EXERCISES.filter((e) =>
    e.exercise_id !== base.exercise_id &&
    !excludeIds.includes(e.exercise_id) &&
    e.movement_pattern === base.movement_pattern &&
    equipmentAvailable(e, availableEquipment)
  );

  // Same substitution_group = purpose preserved by design (highest priority tier).
  const sameGroup = candidates.filter((e) => e.substitution_group === base.substitution_group);
  const samePatternDifferentGroup = candidates.filter((e) =>
    e.substitution_group !== base.substitution_group &&
    e.type === base.type &&
    e.primary_muscles.some((m) => base.primary_muscles.includes(m))
  );

  const ranked = [
    ...sameGroup.sort((a, b) => similarityScore(base, a) - similarityScore(base, b)),
    ...samePatternDifferentGroup.sort((a, b) => similarityScore(base, a) - similarityScore(base, b)),
  ];

  return ranked.slice(0, limit).map((e) => ({
    exercise_id: e.exercise_id,
    name: e.name,
    preserves_purpose: e.substitution_group === base.substitution_group,
    reason: e.substitution_group === base.substitution_group
      ? `Preserves the same ${base.movement_pattern.replace("_", " ")} training role as ${base.name}, matching your available equipment.`
      : `Trains the same primary muscle and movement pattern as ${base.name}, as a close alternative.`,
  }));
}

/**
 * PHASE 12 — USER-INITIATED EXERCISE CHANGE
 * Handles the four "Change Exercise" reasons distinctly.
 */
export function handleExerciseChangeRequest({ exerciseId, reason, availableEquipment, excludeIds = [] }) {
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
          : `No equipment-compatible alternative preserves this exercise's training role. Consider adding equipment or accepting a temporary gap in this movement pattern this session.`,
      };
    }
    case "too_difficult": {
      // Prefer alternatives with lower difficulty/stability/technical_demand, same group first.
      const alternatives = getAlternatives({ exerciseId, availableEquipment, excludeIds, limit: 6 })
        .filter((alt) => {
          const cand = getExerciseById(alt.exercise_id);
          return cand.difficulty <= base.difficulty;
        })
        .slice(0, 4);
      return {
        action: "regress",
        alternatives,
        message: `Here are easier progressions that preserve the same training role as ${base.name}, so you can build toward it.`,
      };
    }
    case "dislike": {
      const alternatives = getAlternatives({ exerciseId, availableEquipment, excludeIds });
      return {
        action: "substitute",
        alternatives,
        remember_preference: true,
        message: `Noted — we'll deprioritize ${base.name} in future sessions. Here are equivalent alternatives.`,
      };
    }
    case "pain_discomfort": {
      // NEVER auto-prescribe a replacement as though the issue is solved.
      return {
        action: "flag_for_review",
        alternatives: [],
        remove_from_program_pending_review: true,
        message: `${base.name} has been flagged and paused in your program. Pain or discomfort during an exercise isn't something we auto-resolve by swapping movements — please have it evaluated by a qualified professional before resuming this movement pattern. We won't prescribe a replacement for this slot until you tell us it's cleared.`,
      };
    }
    default:
      throw new Error(`Unknown change reason "${reason}"`);
  }
}
