/**
 * PHASE 4 — FREQUENCY + SPLIT ENGINE
 *
 * Chooses a weekly day structure from days available, experience, and
 * goal. These are generation rules, not fixed templates — the same
 * days_per_week can resolve differently depending on experience/goal.
 *
 * Each day gets a `session_type` (full_body / upper / lower / push /
 * pull / legs / rest) and a list of `emphasis_muscles` the volume engine
 * should prioritize that day.
 */

function fullBodyDay() {
  return { session_type: "full_body", emphasis_muscles: ["chest", "back", "quads", "hamstrings", "glutes", "core"] };
}
function upperDay() {
  return { session_type: "upper", emphasis_muscles: ["chest", "back", "front_delts", "side_delts", "rear_delts", "biceps", "triceps"] };
}
function lowerDay() {
  return { session_type: "lower", emphasis_muscles: ["quads", "hamstrings", "glutes", "calves", "core"] };
}
function pushDay() {
  return { session_type: "push", emphasis_muscles: ["chest", "front_delts", "side_delts", "triceps"] };
}
function pullDay() {
  return { session_type: "pull", emphasis_muscles: ["back", "rear_delts", "biceps"] };
}
function legsDay() {
  return { session_type: "legs", emphasis_muscles: ["quads", "hamstrings", "glutes", "calves", "core"] };
}
function restDay() {
  return { session_type: "rest", emphasis_muscles: [] };
}

/**
 * Build a 7-slot weekly structure.
 * days: number of training days/week (2-6 supported)
 * experienceLevel / goal are used to break ties (e.g. 5-day hybrid choice).
 */
export function buildSplit({ daysPerWeek, experienceLevel, goal }) {
  if (daysPerWeek < 2 || daysPerWeek > 6) {
    throw new Error("daysPerWeek must be between 2 and 6");
  }

  let pattern; // array of day objects, length = daysPerWeek (rest days interleaved separately)
  let rationale;

  switch (daysPerWeek) {
    case 2:
      pattern = [fullBodyDay(), fullBodyDay()];
      rationale = "Two full-body sessions maximize per-session frequency for each muscle group when training days are limited.";
      break;
    case 3:
      pattern = [fullBodyDay(), fullBodyDay(), fullBodyDay()];
      rationale = "Three full-body sessions give every muscle group three weekly exposures with ample recovery between.";
      break;
    case 4:
      pattern = [upperDay(), lowerDay(), upperDay(), lowerDay()];
      rationale = "An upper/lower split at four days gives each region two weekly sessions with a manageable recovery cadence.";
      break;
    case 5:
      if (experienceLevel === "beginner") {
        // Beginners rarely benefit from 5-day specialization; keep it a simple upper/lower + full body hybrid.
        pattern = [upperDay(), lowerDay(), fullBodyDay(), upperDay(), lowerDay()];
        rationale = "At five beginner training days, an upper/lower/full-body hybrid keeps the structure simple while still using every day.";
      } else if (goal === "endurance") {
        pattern = [fullBodyDay(), lowerDay(), upperDay(), fullBodyDay(), lowerDay()];
        rationale = "Five days blending full-body strength work with dedicated lower-body sessions supports endurance goals without excessive resistance fatigue.";
      } else {
        pattern = [upperDay(), lowerDay(), pushDay(), pullDay(), legsDay()];
        rationale = "A hybrid upper/lower + push/pull/legs structure at five days lets intermediate/advanced trainees add specialization volume beyond a simple split.";
      }
      break;
    case 6:
      pattern = [pushDay(), pullDay(), legsDay(), pushDay(), pullDay(), legsDay()];
      rationale = "A push/pull/legs split repeated twice gives each muscle group two weekly sessions at high total frequency, appropriate for experienced trainees who can recover from six sessions.";
      break;
  }

  // Distribute rest days using a sensible, pre-defined weekly shape per
  // frequency (evenly-spaced training blocks) rather than a generic
  // algorithm that can bunch every rest day at the start of the week.
  const week = interleaveRestDays(pattern, daysPerWeek);

  return { daysPerWeek, days: week, rationale };
}

// 1 = training slot, 0 = rest slot, for each supported weekly frequency.
const WEEK_SHAPES = {
  2: [1, 0, 1, 0, 0, 0, 0],
  3: [1, 0, 1, 0, 1, 0, 0],
  4: [1, 1, 0, 1, 1, 0, 0],
  5: [1, 1, 0, 1, 1, 1, 0],
  6: [1, 1, 1, 0, 1, 1, 1],
};

function interleaveRestDays(trainingDays, daysPerWeek) {
  const shape = WEEK_SHAPES[daysPerWeek];
  const week = [];
  let dayIdx = 0;
  for (let slot = 0; slot < 7; slot++) {
    if (shape[slot] === 1) {
      week.push({ day_index: slot + 1, ...trainingDays[dayIdx] });
      dayIdx++;
    } else {
      week.push({ day_index: slot + 1, ...restDay() });
    }
  }
  return week;
}
