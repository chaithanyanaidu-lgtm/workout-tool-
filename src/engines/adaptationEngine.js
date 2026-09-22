/**
 * PHASE 12 / spec sections 20-23 — ADAPTATION ENGINE
 *
 * NOT the workout generator. Observes real training behaviour (via
 * performanceAnalyzer) and decides whether — and how much — the
 * existing program should change. Uses the SMALLEST effective
 * intervention, and never jumps from one bad session to a full rewrite.
 *
 * Levels:
 *   0 - No change
 *   1 - Progression adjustment (reps/load/progression target)
 *   2 - Exercise adjustment (swap the problematic exercise)
 *   3 - Volume adjustment (small +/- to relevant muscle volume)
 *   4 - Session adjustment (modify session structure)
 *   5 - Program adjustment (change split/frequency)
 *
 * Explicitly excludes any hard numeric threshold rule
 * (no "if RQS < 72 reduce volume 15%"). Decisions are driven by trend
 * classification + confidence + repetition, from performanceAnalyzer.
 */

import { analyzeExerciseTrend, analyzeAdherence } from "./performanceAnalyzer.js";

/**
 * Evaluate one exercise's trend and recommend the smallest sufficient
 * adaptation level, with a plain-language explanation.
 */
export function evaluateExerciseAdaptation({ exerciseName, history }) {
  const analysis = analyzeExerciseTrend(history);

  if (analysis.trend === "insufficient_data") {
    return {
      level: 0, action: "no_change", analysis,
      explanation: `Not enough logged sessions yet for ${exerciseName} to justify any change — the program continues as planned.`,
    };
  }

  if (analysis.trend === "consistent_progress" || analysis.trend === "stable_or_mixed") {
    return {
      level: 0, action: "no_change", analysis,
      explanation: `${exerciseName} is progressing normally (or performance is mixed within normal week-to-week variation), so no change is made. One off session is expected occasionally and isn't treated as a trend.`,
    };
  }

  if (analysis.trend === "repeated_incompletion" && analysis.confidence !== "high") {
    // Could be an exercise-selection issue OR a load/target issue. Start with the smallest lever.
    return {
      level: 1, action: "adjust_progression_target", analysis,
      explanation: `${exerciseName} has been incomplete in most recent sessions. Rather than replacing it, the rep/load target is being held or nudged down slightly so you can complete full sets again before we consider anything bigger.`,
    };
  }

  if (analysis.trend === "repeated_decline" && analysis.confidence === "moderate") {
    return {
      level: 1, action: "adjust_progression_target", analysis,
      explanation: `${exerciseName} shows a declining trend across several sessions, but confidence is still moderate. The progression target is adjusted downward slightly rather than swapping the exercise or changing your program.`,
    };
  }

  if (analysis.trend === "repeated_decline" && analysis.confidence === "high") {
    return {
      level: 2, action: "consider_exercise_swap", analysis,
      explanation: `${exerciseName} has shown a consistent decline with high confidence across repeated sessions with good exposure. This exercise is flagged for a targeted swap to an alternative that preserves the same training purpose, rather than changing your whole program.`,
    };
  }

  return { level: 0, action: "no_change", analysis, explanation: `No sufficient signal to change ${exerciseName}.` };
}

/**
 * Program-level check: looks across ALL exercises' evaluations plus
 * overall adherence to decide if a broader (level 3-5) change is
 * warranted. Only escalates when MULTIPLE exercises independently show
 * high-confidence decline (repetition across the program, not one lift).
 */
export function evaluateProgramAdaptation({ exerciseEvaluations, workoutLogs }) {
  const adherence = analyzeAdherence(workoutLogs);
  const highConfidenceDeclines = exerciseEvaluations.filter((e) => e.level >= 2);

  if (adherence.adherence === "low") {
    return {
      level: 4, action: "adjust_session_structure", adherence,
      explanation: `Adherence has been low across your recent sessions (${adherence.completed}/${adherence.total} completed). Rather than assuming a physiological cause, the session structure is being reviewed for length/complexity to make it easier to complete consistently.`,
    };
  }

  if (highConfidenceDeclines.length >= 3) {
    return {
      level: 5, action: "review_split_or_frequency", adherence,
      explanation: `Multiple exercises (${highConfidenceDeclines.length}) are independently showing high-confidence decline with good adherence. This repeated, cross-exercise pattern — not any single workout — is what justifies reviewing your overall split or weekly frequency.`,
    };
  }

  if (highConfidenceDeclines.length >= 1) {
    return {
      level: 3, action: "adjust_muscle_volume", adherence,
      explanation: `${highConfidenceDeclines.length} exercise(s) show a consistent decline. A small volume adjustment for the affected muscle group(s) is applied before considering any structural change.`,
    };
  }

  return { level: 0, action: "no_change", adherence, explanation: "Overall training data does not justify a program-level change." };
}

/** Records an adaptation decision to the audit trail (spec section 24 explainability). */
export function toAdaptationEvent({ userId, scope, exerciseId = null, decision, date = new Date().toISOString() }) {
  return {
    date, scope, exercise_id: exerciseId,
    level: decision.level, action: decision.action, explanation: decision.explanation,
  };
}
