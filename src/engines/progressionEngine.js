/**
 * PHASE 9 / spec section 14 — PROGRESSIVE OVERLOAD ENGINE
 *
 * Never increases load just because a new week started. Uses the
 * exercise's own logged history: only progresses load once performance
 * has repeatedly reached the top of the prescribed rep range across all
 * sets, then resets back toward the bottom of the range at the new load.
 *
 * Progression methods (mirrors spec section 14):
 *  - double_progression: reps climb through the range at fixed load;
 *      once every set hits rep_max, increase load and drop back to rep_min.
 *  - rep_progression_then_load: (machines) same idea, smaller increments.
 *  - rep_progression_small_load_increases: (isolation) reps climb, then
 *      small load bump.
 *  - reps_then_external_load_then_harder_variation: (bodyweight) reps
 *      climb; once maxed, suggest external load or a harder variation.
 *  - exercise_specific / other: falls back to double_progression logic.
 */

function allSetsAtOrAboveTop(lastEntry, repMax) {
  return lastEntry.reps.every((r) => r >= repMax);
}

function allSetsCompleted(lastEntry) {
  return lastEntry.completed !== false;
}

const LOAD_INCREMENTS = {
  double_progression: { compoundBarbell: 2.5, default: 2 },
  rep_progression_then_load: { default: 2 },
  rep_progression_small_load_increases: { default: 1 },
  reps_then_external_load_then_harder_variation: { default: 1 },
};

/**
 * history: array of past logged entries for this exercise, most recent last.
 *   { date, load, reps: [n,n,n], sets, rir, completed }
 * prescription: { rep_min, rep_max, sets, progression }
 * Returns a decision object with next target + human explanation. Never
 * mutates load on a single good set — requires the most recent completed
 * entry to have hit the top of the range on every set.
 */
export function computeNextTarget({ history, prescription, exerciseName }) {
  if (!history || history.length === 0) {
    return {
      action: "establish_baseline",
      next_load: null,
      next_rep_target: `${prescription.rep_min}-${prescription.rep_max}`,
      explanation: `No previous data for ${exerciseName} yet. Perform this session at a comfortable, controlled weight within RIR ${prescription.rir}, and we'll use it to set your baseline.`,
    };
  }

  const last = history[history.length - 1];

  if (!allSetsCompleted(last)) {
    return {
      action: "repeat",
      next_load: last.load,
      next_rep_target: `${prescription.rep_min}-${prescription.rep_max}`,
      explanation: `${exerciseName} was not fully completed last session, so today repeats the same load and rep target rather than adding load.`,
    };
  }

  const hitTop = allSetsAtOrAboveTop(last, prescription.rep_max);

  if (!hitTop) {
    return {
      action: "repeat",
      next_load: last.load,
      next_rep_target: `${prescription.rep_min}-${prescription.rep_max}`,
      explanation: `Your weight was not increased for ${exerciseName} because you haven't yet reached the top of the prescribed rep range (${prescription.rep_max}) on every set.`,
    };
  }

  const increments = LOAD_INCREMENTS[prescription.progression] || LOAD_INCREMENTS.double_progression;
  const increment = increments.default;
  const nextLoad = last.load != null ? Math.round((last.load + increment) * 2) / 2 : null;

  const isBodyweightPath = prescription.progression === "reps_then_external_load_then_harder_variation";

  return {
    action: isBodyweightPath ? "add_external_load_or_progress_variation" : "increase_load",
    next_load: nextLoad,
    next_rep_target: `${prescription.rep_min}-${prescription.rep_max}`,
    explanation: isBodyweightPath
      ? `You hit ${prescription.rep_max} reps on every set of ${exerciseName} last time, so today either add light external load or move to a harder variation, returning to the bottom of the rep range.`
      : `You hit the top of your rep range (${prescription.rep_max}) on every set of ${exerciseName} last time, so load increases to ${nextLoad}${last.load != null ? ` (from ${last.load})` : ""} and reps return toward ${prescription.rep_min}.`,
  };
}
